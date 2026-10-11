// supabase/functions/run-ai-app/index.ts
// OpenAI Responses API Integration with Streaming & Tool Support
// Supports current Responses tools plus legacy config labels: web search, file search, code interpreter, vision input, realtime
// Realtime voice sessions via handleRealtimeSession (mode=realtime query param)
// code_execution traces (code_execution_call/output) are captured in verificationTrace
//
// SECURITY CONTRACT (do not regress):
//  1. Identity: the caller's user id comes ONLY from the verified JWT
//     (`authenticateRequest`), never from the request body. WebSocket upgrades
//     verify identity exactly once, in the upgrade handler, before the
//     connection is accepted.
//  2. Credit gate: every OpenAI call is preceded by a balance check against
//     the service-role credits client; insufficient balance returns 402 and
//     the OpenAI request is never sent.
//  3. Post-call billing: usage is charged AFTER the call, computed from real
//     token usage. Streamed (SSE) responses are tee'd so the client stream is
//     forwarded byte-for-byte while the billing parser watches for the final
//     `response.completed` usage event.
//  4. Realtime sessions are billed per connected minute when the socket
//     closes.
//  5. Non-realtime WebSocket upgrades are refused with 426 (an unauthenticated
//     generic WS would be an OpenAI-spend bypass).

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createSupabaseContext } from "npm:@supabase/server";
import { getAppConfig, type ToolType } from "./app-configs.ts";
import {
  isSupportedModel,
  estimateRequestCredits,
  calculateUsageCredits,
  calculateRealtimeCredits,
} from "../_shared/creditRates.ts";
import {
  classifyIncomingRequest,
  computeRealtimeCreditsFromWindow,
  createBillingTee as createCoreBillingTee,
  creditGateHeaders,
  deductUsageCredits as deductUsageCreditsCore,
  deriveUserIdFromVerifiedContext,
  evaluateCreditGate,
  extractUpgradeToken,
  extractUsageFromEvent,
  insufficientCreditsBody,
  type StreamBill,
  type VerifiedAuthContextLike,
} from "./credit-core.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, upgrade",
};

// Credit balances live in the dedicated `credits` schema under the platform
// app id (same id used by create-credit-checkout / webhook-stripe).
const CREDITS_APP_ID = "videoremixvip";

// Untrusted-input bounds for client-supplied vector store ids.
const MAX_VECTOR_STORE_IDS = 20;
const MAX_VECTOR_STORE_ID_LENGTH = 200;

interface ServiceClients {
  /** Default-schema client (analytics tables such as ai_app_usage). */
  admin: ReturnType<typeof createClient>;
  /** credits-schema client (balances + deduction RPC). */
  credits: ReturnType<typeof createClient>;
}

function createServiceClients(): ServiceClients {
  const url = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  return {
    admin: createClient(url, serviceKey),
    credits: createClient(url, serviceKey, { schema: "credits" }),
  };
}

interface CreditBalance {
  balance: number;
  error?: string;
}

async function getCreditBalance(
  creditsClient: ReturnType<typeof createClient>,
  userId: string,
  appId: string,
): Promise<CreditBalance> {
  const { data, error } = await creditsClient
    .from("credit_balances")
    .select("balance_credits")
    .eq("user_id", userId)
    .eq("app_id", appId)
    .maybeSingle();

  if (error) {
    return { balance: 0, error: error.message };
  }

  return { balance: data?.balance_credits ?? 0 };
}

function insufficientCreditsResponse(
  required: number,
  balance: number,
  model: string,
): Response {
  return new Response(JSON.stringify(insufficientCreditsBody({ required, balance, model })), {
    status: 402,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
      ...creditGateHeaders({ balance, required }),
    },
  });
}

/**
 * Deduct credits for a completed call via the core helper, which issues a
 * single atomic `deduct_credits` RPC. Never throws: billing failures are
 * logged loudly (and reported to the caller as a zero deduction, i.e. an
 * absent X-Credits-Deducted header) so a ledger outage cannot take down the
 * user-facing response.
 */
function deductUsageCredits(params: {
  clients: ServiceClients;
  userId: string;
  appId: string;
  appSlug: string;
  model: string;
  credits: number;
  inputTokens: number;
  outputTokens: number;
  cachedInputTokens?: number;
  source: string;
}): Promise<number> {
  return deductUsageCreditsCore({
    rpc: (fn, args) => params.clients.credits.rpc(fn, args),
    userId: params.userId,
    appId: params.appId,
    appSlug: params.appSlug,
    model: params.model,
    credits: params.credits,
    inputTokens: params.inputTokens,
    outputTokens: params.outputTokens,
    cachedInputTokens: params.cachedInputTokens,
    source: params.source,
  });
}

/** Analytics-only usage row (best effort, never blocks billing or response). */
async function recordAnalyticsRun(
  clients: ServiceClients,
  userId: string,
  appSlug: string,
  tokens: number,
): Promise<void> {
  try {
    await clients.admin.rpc("record_ai_app_run", {
      user_uuid: userId,
      app_slug: appSlug,
      tokens,
    });
  } catch (err) {
    console.error("Failed to record analytics usage:", err);
  }
}

/**
 * Tee an SSE stream: forward every chunk to the client unchanged while
 * scanning for the terminal `response.completed` usage event so real token
 * usage can be billed after the stream finishes.
 *
 * Billing rules (implemented in credit-core, proven by tests):
 *  - terminal usage seen            -> exact usage credits;
 *  - partial stream (abort/error)   -> conservative pre-flight estimate, so
 *                                      partial provider spend is never free;
 *  - zero bytes / terminal error    -> no charge at all (no provider spend).
 * The stream is charged at most once (flush and cancel share a settled flag).
 *
 * The deduction runs when the upstream stream ends (or is cancelled). For
 * streamed responses the charge lands in `credit_transactions`; the
 * X-Credits-Deducted response header cannot be used here because headers are
 * already sent by the time billing completes.
 */
function createBillingTee(params: {
  clients: ServiceClients;
  userId: string;
  appId: string;
  appSlug: string;
  model: string;
  estimatedCredits: number;
  estimatedInputTokens: number;
  estimatedOutputTokens: number;
}): TransformStream<Uint8Array, Uint8Array> {
  return createCoreBillingTee({
    model: params.model,
    estimatedCredits: params.estimatedCredits,
    estimatedInputTokens: params.estimatedInputTokens,
    estimatedOutputTokens: params.estimatedOutputTokens,
    charge: (bill: StreamBill) =>
      deductUsageCredits({
        clients: params.clients,
        userId: params.userId,
        appId: params.appId,
        appSlug: params.appSlug,
        model: params.model,
        credits: bill.credits,
        inputTokens: bill.inputTokens,
        outputTokens: bill.outputTokens,
        cachedInputTokens: bill.cachedInputTokens,
        source: "run_ai_app",
      }),
  });
}

// Translate the repo's legacy tool labels into current Responses API tool shapes.
// Some labels (vision/realtime) are capability markers, not Responses tools.
function buildResponseTools(toolTypes: ToolType[] | undefined, inputs: Record<string, any>): any[] {
  if (!toolTypes?.length) return [];

  const tools: any[] = [];
  for (const toolType of toolTypes) {
    switch (toolType) {
      case "web_search_preview":
        tools.push({ type: "web_search" });
        break;
      case "code_execution":
        tools.push({ type: "code_interpreter", container: { type: "auto" } });
        break;
      case "file_search": {
        // Vector store ids are client-selectable, so they are untrusted input:
        // keep only non-empty string ids, bound the count and the length of
        // each id, and cap the total payload forwarded to the provider.
        const rawIds =
          inputs?.vector_store_ids ??
          inputs?.vectorStoreIds ??
          inputs?.vector_store_id ??
          inputs?.vectorStoreId;
        const rawList = Array.isArray(rawIds) ? rawIds : rawIds ? [rawIds] : [];
        const vectorStoreIds = rawList
          .filter((id: unknown): id is string => typeof id === "string")
          .map((id: string) => id.trim())
          .filter((id: string) => id.length > 0 && id.length <= MAX_VECTOR_STORE_ID_LENGTH)
          .slice(0, MAX_VECTOR_STORE_IDS);

        // file_search requires at least one vector store id. If the UI has not
        // created/selected one yet, omit the tool rather than sending an invalid request.
        if (vectorStoreIds.length > 0) {
          tools.push({ type: "file_search", vector_store_ids: vectorStoreIds });
        }
        break;
      }
      case "vision":
        // Vision is supplied as image input content, not as a tool declaration.
        break;
      case "realtime":
        // Realtime is handled by the dedicated realtime WebSocket path.
        break;
    }
  }

  return tools;
}

async function authenticateRequest(
  req: Request,
  tokenOverride?: string | null,
): Promise<{ userId: string } | null> {
  try {
    const authReq = tokenOverride
      ? new Request(req.url, {
          method: "GET",
          headers: { Authorization: `Bearer ${tokenOverride}` },
        })
      : req;

    // `auth: "user"` verifies a USER JWT (Clerk-issued on this platform):
    // anon/publishable keys and service/secret keys do not match this mode,
    // so they can never bill against a user balance.
    const { data: ctx, error } = await createSupabaseContext(authReq, { auth: "user" });
    if (error || !ctx) return null;

    // The billed identity comes ONLY from verified claims — never from the
    // request body, query string, or unverified headers.
    const userId = deriveUserIdFromVerifiedContext(ctx as VerifiedAuthContextLike);

    return userId ? { userId } : null;
  } catch (error) {
    console.error("run-ai-app auth verification failed:", error);
    return null;
  }
}

/** Rough prompt-size estimate in tokens (~4 characters per token). */
function estimateTokensFromText(text: string): number {
  if (!text) return 0;
  return Math.max(1, Math.ceil(text.length / 4));
}

interface RunAIAppRequest {
  appSlug: string;
  inputs: Record<string, any>;
  context?: string;
  stream?: boolean;
  // NOTE: a client-supplied `userId` is intentionally NOT part of the trusted
  // input surface. The billed identity always comes from the verified JWT.
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const upgrade = classifyIncomingRequest({
    upgradeHeader: req.headers.get("upgrade"),
    url,
  });

  if (upgrade.kind === "ws_unsupported") {
    // Normal SapienX runs use authenticated HTTP/SSE. Keeping a generic
    // unauthenticated WebSocket here would create an OpenAI-spend bypass.
    return new Response(JSON.stringify({ error: "Use authenticated HTTP/SSE for AI app runs" }), {
      status: 426,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (upgrade.kind === "ws_realtime") {
    // Identity is verified exactly once, here in the upgrade handler, and
    // the verified id is passed down to the session handler. Browser
    // WebSockets cannot attach an Authorization header, so the verified
    // token travels as a query parameter (same pattern Supabase realtime
    // uses); it is verified server-side before the socket is accepted.
    const token = extractUpgradeToken(url);
    const auth = await authenticateRequest(req, token);
    if (!auth) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    return handleRealtimeSession(req, auth.userId);
  }

  const auth = await authenticateRequest(req);
  if (!auth) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    let payload: RunAIAppRequest;
    try {
      payload = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: "Request body must be valid JSON" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { appSlug, inputs, context, stream = true } = payload;
    // user_id comes ONLY from the verified JWT above.
    const userId = auth.userId;

    if (!appSlug) {
      return new Response(JSON.stringify({ error: "appSlug is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const clients = createServiceClients();

    const config = getAppConfig(appSlug);
    const openaiKey = Deno.env.get("OPENAI_API_KEY");

    if (!config || !openaiKey) {
      const fallback = {
        success: true,
        appSlug,
        output: {
          summary: `Demo mode for ${appSlug}. Connect OPENAI_API_KEY and add config for full AI.`,
          message: "Add your OpenAI key in Supabase Edge secrets",
        },
        metadata: { model: "fallback", demo: true, timestamp: new Date().toISOString() },
      };
      return new Response(JSON.stringify(fallback), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const tools = buildResponseTools(config.tools, inputs);

    // Build the input content from user inputs
    let inputContent = "";

    if (context) {
      inputContent += context + "\n\n";
    }

    inputContent += `${config.systemPrompt}\n\n`;

    if (typeof inputs === "object" && inputs !== null) {
      // Add each input as a separate line for clarity
      for (const [key, value] of Object.entries(inputs)) {
        if (value !== undefined && value !== null && value !== "") {
          const formattedValue = typeof value === "object"
            ? JSON.stringify(value, null, 2)
            : String(value);
          inputContent += `\n${key}: ${formattedValue}`;
        }
      }
    } else {
      inputContent += String(inputs);
    }

    // Prepare the request body for Responses API
    const requestBody: any = {
      model: config.model || "gpt-5.5",
      input: inputContent,
      stream: stream !== false,
      ...(config.maxTokens ? { max_output_tokens: config.maxTokens } : {}),
    };

    // Add tools if needed
    if (tools.length > 0) {
      requestBody.tools = tools;
    }

    // Add parsing instructions
    requestBody.instructions = `Return valid JSON matching the expected output structure. No additional text outside JSON. Expected keys: ${config.expectedOutputKeys.join(", ")}`;

    // --- Credit gate (402) BEFORE the OpenAI call -------------------------
    // A model with no known price can never be billed, and a balance that
    // cannot cover the conservative estimate must never reach the provider.
    const model = requestBody.model;
    const estimatedInputTokens = estimateTokensFromText(inputContent);
    const estimatedOutputTokens = config.maxTokens ?? 1_000;
    const estimatedCredits = estimateRequestCredits(
      model,
      estimatedInputTokens,
      estimatedOutputTokens,
    );

    const balance = await getCreditBalance(clients.credits, userId, CREDITS_APP_ID);

    const gate = evaluateCreditGate({
      balanceError: balance.error,
      balance: balance.balance,
      requiredCredits: estimatedCredits,
      model,
      modelSupported: isSupportedModel(model),
      appSlug,
    });

    if (!gate.ok) {
      if (gate.status === 402) {
        return new Response(JSON.stringify(gate.body), {
          status: 402,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
            ...gate.headers,
          },
        });
      }
      console.error(
        `run-ai-app credit gate refused ${appSlug}: ${JSON.stringify(gate.body)}`,
      );
      return new Response(JSON.stringify(gate.body), {
        status: gate.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    // ----------------------------------------------------------------------

    // Make the API call
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("OpenAI API error:", response.status, errText);
      // Upstream failure: no spend, no charge.
      return new Response(JSON.stringify({ error: `OpenAI error ${response.status}` }), {
        status: response.status >= 500 ? 502 : 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Handle streaming response
    if (stream !== false) {
      const contentType = response.headers.get("content-type");

      if (contentType?.includes("text/event-stream")) {
        // Tee the SSE stream: client gets every byte unchanged, the billing
        // parser extracts the terminal usage event and charges after close.
        const tee = createBillingTee({
          clients,
          userId,
          appId: CREDITS_APP_ID,
          appSlug,
          model,
          estimatedCredits,
          estimatedInputTokens,
          estimatedOutputTokens,
        });

        const billedBody = response.body!.pipeThrough(tee);

        return new Response(billedBody, {
          headers: {
            ...corsHeaders,
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
          },
        });
      }
    }

    // Non-streaming response processing
    const openaiData = await response.json();

    // Parse output from Responses API format
    let parsedOutput = parseResponseOutput(openaiData);

    // Map usage from the provider response (input/output/cached tokens).
    // `input_tokens` already includes cached tokens, so they are never added
    // on top; cached counts ride along in the ledger metadata.
    const usage = extractUsageFromEvent(openaiData) ?? {
      inputTokens: Number(openaiData.usage?.input_tokens ?? openaiData.usage?.prompt_tokens ?? 0),
      outputTokens: Number(openaiData.usage?.output_tokens ?? openaiData.usage?.completion_tokens ?? 0),
      cachedInputTokens: 0,
    };
    const inputTokens = usage.inputTokens;
    const outputTokens = usage.outputTokens;
    const cachedInputTokens = usage.cachedInputTokens;
    const actualCredits = Math.max(
      calculateUsageCredits(model, inputTokens, outputTokens),
      1,
    );

    const deducted = await deductUsageCredits({
      clients,
      userId,
      appId: CREDITS_APP_ID,
      appSlug,
      model,
      credits: actualCredits,
      inputTokens,
      outputTokens,
      cachedInputTokens,
      source: "run_ai_app",
    });

    await recordAnalyticsRun(clients, userId, appSlug, inputTokens + outputTokens);

    const result = {
      success: true,
      appSlug,
      output: parsedOutput,
      metadata: {
        model: openaiData.model || config.model,
        tokensUsed: usage.total_tokens ?? inputTokens + outputTokens,
        latencyMs: openaiData.latency?.total_ms || 0,
        timestamp: new Date().toISOString(),
        // Echo the verified identity for client-side correlation only.
        userId,
        toolsUsed: config.tools || [],
        creditsCharged: deducted,
      },
    };

    return new Response(JSON.stringify(result), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "X-Credits-Deducted": String(deducted),
      },
    });
  } catch (error: any) {
    console.error("run-ai-app error:", error);
    return new Response(JSON.stringify({ error: error.message || "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

/**
 * Safely extract stdout/stderr/exitCode from code_execution tool output items.
 * Never throws - returns a safe default on any malformed input.
 */
function safeExtractCodeExecutionOutput(item: any): { stdout: string; stderr: string; exitCode: number } {
  try {
    if (item.type === "code_execution_output") {
      let stdout = "";
      let stderr = "";
      let exitCode = 0;
      if (typeof item.output === "string") {
        stdout = item.output;
      } else if (item.output && typeof item.output === "object") {
        stdout = item.output.stdout || "";
        stderr = item.output.stderr || "";
        exitCode = item.output.exitCode || 0;
      }
      return { stdout, stderr, exitCode };
    }
    return { stdout: "", stderr: "", exitCode: 0 };
  } catch {
    return { stdout: "", stderr: "", exitCode: 0 };
  }
}

/**
 * Parse the OpenAI Responses API output into a structured format.
 * Handles code_execution_call / code_execution_output items (2026 shape) and
 * surfaces captured output under verificationTrace for JSON final answers.
 * Never throws on unknown item types.
 */
function parseResponseOutput(data: any): any {
  if (data.error) {
    throw new Error(data.error.message || "API Error");
  }

  if (data.output && Array.isArray(data.output)) {
    const textParts: string[] = [];
    const toolCalls: any[] = [];
    const outputTexts: any[] = [];
    let verificationTrace: any = undefined;

    for (const item of data.output) {
      if (!item || typeof item.type !== "string") {
        continue;
      }
      switch (item.type) {
        case "code_execution_call":
          toolCalls.push({
            id: item.id,
            name: item.name || "code_execution",
            arguments: item.arguments || "",
            callId: item.call_id || item.id,
            toolType: "code_execution_call",
          });
          break;

        case "code_execution_output": {
          const extracted = safeExtractCodeExecutionOutput(item);
          toolCalls.push({
            id: item.id,
            callId: item.call_id || item.id,
            toolType: "code_execution_output",
            output: extracted.stdout,
            stderr: extracted.stderr,
            exitCode: extracted.exitCode,
          });
          if (!verificationTrace) {
            verificationTrace = { executedCode: "", stdout: "", stderr: "", passed: false };
          }
          verificationTrace.stdout = extracted.stdout;
          verificationTrace.stderr = extracted.stderr;
          verificationTrace.passed = extracted.exitCode === 0;
          break;
        }

        case "message":
          if (item.content) {
            for (const content of item.content) {
              if (content.type === "output_text") {
                textParts.push(content.text || "");
              }
            }
          }
          break;

        case "output_text":
          if (item.text) {
            textParts.push(item.text);
          }
          if (item.annotations) {
            outputTexts.push({ type: "text_with_annotations", content: item.text, annotations: item.annotations });
          } else {
            outputTexts.push(item.text);
          }
          break;

        case "function_call":
          toolCalls.push({
            id: item.id,
            name: item.name,
            arguments: item.arguments,
            callId: item.call_id,
          });
          break;

        case "function_call_output":
          toolCalls.push({
            id: item.id,
            output: item.output,
            callId: item.call_id,
          });
          break;

        case "reasoning":
          if (item.summary) {
            outputTexts.push({ type: "reasoning", content: item.summary });
          }
          break;

        default:
          if (item.text) {
            textParts.push(item.text);
          }
      }
    }

    if (toolCalls.length > 0) {
      const result: any = {
        toolCalls,
        usage: "Tool execution completed",
      };
      if (verificationTrace) {
        result.verificationTrace = verificationTrace;
      }
      return result;
    }

    const combinedText = textParts.join("\n").trim();

    if (!combinedText) {
      return { message: "No output generated" };
    }

    try {
      const parsed = JSON.parse(combinedText);
      if (verificationTrace) {
        parsed.verificationTrace = verificationTrace;
      }
      return parsed;
    } catch {
      return {
        content: combinedText,
        formatted: outputTexts.length > 0 ? outputTexts : undefined,
        ...(verificationTrace ? { verificationTrace } : {}),
      };
    }
  }

  if (data.output_text) {
    try {
      return JSON.parse(data.output_text);
    } catch {
      return { content: data.output_text };
    }
  }

  if (data.error) {
    throw new Error(data.error.message || "Unknown error");
  }

  return data;
}

/**
 * Realtime voice session proxy.
 *
 * `verifiedUserId` is the identity verified once in the WebSocket upgrade
 * handler (the only place this function trusts). The session is billed per
 * connected minute through the service-role credits client when the client
 * socket closes.
 */
async function handleRealtimeSession(req: Request, verifiedUserId: string): Promise<Response> {
  const url = new URL(req.url);
  const appSlug = url.searchParams.get("appSlug");
  const voice = url.searchParams.get("voice");

  if (!appSlug) {
    return new Response(JSON.stringify({ error: "appSlug is required" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const config = getAppConfig(appSlug);
  const openaiKey = Deno.env.get("OPENAI_API_KEY");

  if (!config || !openaiKey) {
    return new Response(JSON.stringify({ error: "App not found or OpenAI key not configured" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const realtimeVoice = config.realtimeVoice || voice || "alloy";

  if (!config.tools?.includes("realtime")) {
    return new Response(JSON.stringify({ error: "Realtime not enabled for this app" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // A zero (or unknown) balance cannot cover even a single billed minute, so
  // refuse to mint the OpenAI realtime session up front.
  const clients = createServiceClients();
  const model = "gpt-realtime-mini";
  const minimumSessionCredits = Math.max(calculateRealtimeCredits(60), 1);
  const balance = await getCreditBalance(clients.credits, verifiedUserId, CREDITS_APP_ID);
  if (balance.error) {
    console.error("Failed to check credit balance for realtime session:", balance.error);
    return new Response(JSON.stringify({ error: "Failed to check credit balance" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  if (balance.balance < minimumSessionCredits) {
    return insufficientCreditsResponse(minimumSessionCredits, balance.balance, model);
  }

  let ephemeralToken: string;
  let sessionModel: string;

  try {
    const sessionRes = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-realtime-mini",
        modalities: ["audio", "text"],
        voice: realtimeVoice,
        instructions: config.systemPrompt || "You are a helpful AI assistant.",
      }),
    });

    if (!sessionRes.ok) {
      const errText = await sessionRes.text();
      console.error("Realtime session creation failed:", sessionRes.status, errText);
      return new Response(JSON.stringify({ error: `OpenAI error ${sessionRes.status}` }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sessionData = await sessionRes.json();
    ephemeralToken = sessionData.client_secret?.value;
    sessionModel = sessionData.model || "gpt-realtime-mini";

    if (!ephemeralToken) {
      return new Response(JSON.stringify({ error: "No ephemeral token returned from OpenAI" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (err: any) {
    console.error("Failed to create realtime session:", err);
    return new Response(JSON.stringify({ error: err.message || "Failed to create realtime session" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const upgrader = Deno.upgradeWebSocket(req);
  const { socket: clientSocket, response } = upgrader;

  let openaiSocket: WebSocket | null = null;
  let sessionStartTime: number | null = null;
  let billed = false;

  const billRealtimeSession = () => {
    if (billed || sessionStartTime === null) return;
    billed = true;

    // Bill the connected minutes exactly once, through the same atomic
    // deduction RPC as text runs. A window that never really opened
    // (sessionStartTime === null) or a degenerate duration bills nothing.
    const credits = computeRealtimeCreditsFromWindow(sessionStartTime, Date.now());

    if (credits <= 0) return;

    deductUsageCredits({
      clients,
      userId: verifiedUserId,
      appId: CREDITS_APP_ID,
      appSlug,
      model,
      credits,
      inputTokens: 0,
      outputTokens: 0,
      source: "realtime_session",
    }).catch((err) => {
      console.error("Failed to bill realtime session:", err);
    });

    recordAnalyticsRun(clients, verifiedUserId, appSlug, 0).catch(() => {});
  };

  clientSocket.onopen = () => {
    console.log(`Realtime session started for app=${appSlug} voice=${realtimeVoice} user=${verifiedUserId}`);
    sessionStartTime = Date.now();

    try {
      openaiSocket = new WebSocket(
        `wss://api.openai.com/v1/realtime?model=${sessionModel}`,
        ["realtime", `openai-insecure-api-key.${ephemeralToken}`],
      );

      openaiSocket.onopen = () => {
        console.log("OpenAI Realtime WebSocket opened");
        openaiSocket!.send(JSON.stringify({
          type: "session.update",
          session: {
            modalities: ["audio", "text"],
            voice: realtimeVoice,
            instructions: config.systemPrompt || "You are a helpful AI assistant.",
          },
        }));
      };

      openaiSocket.onmessage = (event: MessageEvent) => {
        try {
          const msg = JSON.parse(event.data);
          if (clientSocket.readyState === WebSocket.OPEN) {
            clientSocket.send(JSON.stringify(msg));
          }

          if (msg.type === "response.output_text.delta" || msg.type === "response.text.delta") {
            const textDelta = msg.delta?.text || msg.text || "";
            if (textDelta.length > 0) {
              let parsedJson: any = null;
              try {
                const soFar = (msg._accumulatedText || "") + textDelta;
                msg._accumulatedText = soFar;
                const trimmed = soFar.trim();
                if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
                  parsedJson = JSON.parse(trimmed);
                } else if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
                  parsedJson = JSON.parse(trimmed);
                }
              } catch {}
              if (parsedJson && clientSocket.readyState === WebSocket.OPEN) {
                clientSocket.send(JSON.stringify({ type: "json_delta", data: parsedJson }));
              }
            }
          }
        } catch (err) {
          console.error("Error forwarding OpenAI message:", err);
        }
      };

      openaiSocket.onerror = (err) => {
        console.error("OpenAI Realtime WebSocket error:", err);
      };

      openaiSocket.onclose = (event) => {
        console.log("OpenAI Realtime WebSocket closed:", event.code, event.reason);
        if (clientSocket.readyState === WebSocket.OPEN) {
          clientSocket.close(event.code || 1000, event.reason || "OpenAI connection closed");
        }
      };
    } catch (err) {
      console.error("Failed to create OpenAI WebSocket:", err);
      clientSocket.send(JSON.stringify({ error: "Failed to connect to OpenAI Realtime" }));
      clientSocket.close();
    }
  };

  clientSocket.onmessage = async (event: MessageEvent) => {
    if (!openaiSocket || openaiSocket.readyState !== WebSocket.OPEN) {
      return;
    }
    try {
      const msg = JSON.parse(event.data);
      openaiSocket.send(JSON.stringify(msg));
    } catch (err) {
      console.error("Error forwarding client message to OpenAI:", err);
    }
  };

  clientSocket.onerror = (err) => {
    console.error("Client WebSocket error:", err);
  };

  clientSocket.onclose = () => {
    console.log("Client WebSocket closed, cleaning up OpenAI connection");
    if (openaiSocket && openaiSocket.readyState === WebSocket.OPEN) {
      openaiSocket.close();
    }
    // Bill the connected minutes exactly once.
    billRealtimeSession();
  };

  return response;
}
