// supabase/functions/run-ai-app/index.ts
// OpenAI Responses API Integration with Streaming & Tool Support
// Supports: web_search_preview, file_search, vision, code_execution, realtime
// Realtime voice sessions via handleRealtimeSession (mode=realtime query param)
// code_execution traces (code_execution_call/output) are captured in verificationTrace

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getAppConfig, type ToolType } from "./app-configs.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, upgrade",
};

// Tool definitions for OpenAI Responses API
const TOOL_DEFINITIONS: Record<ToolType, any> = {
  web_search_preview: {
    type: "web_search_preview" as const,
  },
  file_search: {
    type: "file_search" as const,
  },
  vision: {
    type: "vision" as const,
  },
  code_execution: {
    type: "code_execution" as const,
  },
  realtime: {
    type: "realtime" as const,
  },
};

interface RunAIAppRequest {
  appSlug: string;
  inputs: Record<string, any>;
  context?: string;
  userId?: string;
  stream?: boolean;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.headers.get("upgrade") === "websocket") {
    const url = new URL(req.url);
    const mode = url.searchParams.get("mode");
    if (mode === "realtime") {
      return handleRealtimeSession(req);
    }
    return handleWebSocket(req);
  }

  try {
    const { appSlug, inputs, context, userId, stream = true }: RunAIAppRequest = await req.json();

    if (!appSlug) {
      return new Response(JSON.stringify({ error: "appSlug is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

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

    // Build tools array based on app config
    const tools: any[] = [];

    if (config.tools && config.tools.length > 0) {
      for (const toolType of config.tools) {
        if (TOOL_DEFINITIONS[toolType]) {
          tools.push(TOOL_DEFINITIONS[toolType]);
        }
      }
    }

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
      model: config.model || "gpt-4o-mini",
      input: inputContent,
      stream: stream !== false,
    };

    // Add tools if needed
    if (tools.length > 0) {
      requestBody.tools = tools;
    }

    // Add parsing instructions
    requestBody.instruction = `Return valid JSON matching the expected output structure. No additional text outside JSON. Expected keys: ${config.expectedOutputKeys.join(", ")}`;

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
      throw new Error(`OpenAI error ${response.status}: ${errText}`);
    }

    // Handle streaming response
    if (stream !== false) {
      const contentType = response.headers.get("content-type");

      if (contentType?.includes("text/event-stream")) {
        // Return streaming response directly to client
        return new Response(response.body, {
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

    const result = {
      success: true,
      appSlug,
      output: parsedOutput,
      metadata: {
        model: openaiData.model || config.model,
        tokensUsed: openaiData.usage?.total_tokens || 0,
        latencyMs: openaiData.latency?.total_ms || 0,
        timestamp: new Date().toISOString(),
        userId: userId || null,
        toolsUsed: config.tools || [],
      },
    };

    // Record usage for billing
    if (userId) {
      const tokensUsed = openaiData.usage?.total_tokens || 0;
      try {
        await supabase.rpc("record_ai_app_run", {
          user_uuid: userId,
          app_slug: appSlug,
          tokens: tokensUsed,
        });
      } catch (usageErr) {
        console.error("Failed to record usage:", usageErr);
      }
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("run-ai-app error:", error);
    return new Response(JSON.stringify({ error: error.message || "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function handleWebSocket(req: Request): Promise<Response> {
  const upgrader = Deno.upgradeWebSocket(req);

  const { socket, response } = upgrader;

  socket.onopen = () => {
    console.log("WebSocket connected");
  };

  socket.onmessage = async (event) => {
    try {
      const data = JSON.parse(event.data);
      const { appSlug, inputs, context, userId, stream = true } = data;

      if (!appSlug) {
        socket.send(JSON.stringify({ error: "appSlug is required" }));
        socket.close();
        return;
      }

      const supabase = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      );

      const config = getAppConfig(appSlug);
      const openaiKey = Deno.env.get("OPENAI_API_KEY");

      if (!config || !openaiKey) {
        socket.send(JSON.stringify({
          success: true,
          appSlug,
          output: {
            summary: `Demo mode for ${appSlug}. Connect OPENAI_API_KEY and add config for full AI.`,
            message: "Add your OpenAI key in Supabase Edge secrets",
          },
          metadata: { model: "fallback", demo: true, timestamp: new Date().toISOString() },
        }));
        socket.close();
        return;
      }

      const tools: any[] = [];
      if (config.tools && config.tools.length > 0) {
        for (const toolType of config.tools) {
          if (TOOL_DEFINITIONS[toolType]) {
            tools.push(TOOL_DEFINITIONS[toolType]);
          }
        }
      }

      let inputContent = "";
      if (context) {
        inputContent += context + "\n\n";
      }
      inputContent += `${config.systemPrompt}\n\n`;

      if (typeof inputs === "object" && inputs !== null) {
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

      const requestBody: any = {
        model: config.model || "gpt-4o-mini",
        input: inputContent,
        stream: stream !== false,
      };

      if (tools.length > 0) {
        requestBody.tools = tools;
      }

      requestBody.instruction = `Return valid JSON matching the expected output structure. No additional text outside JSON. Expected keys: ${config.expectedOutputKeys.join(", ")}`;

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
        socket.send(JSON.stringify({ error: `OpenAI error ${response.status}: ${errText}` }));
        socket.close();
        return;
      }

      if (stream !== false && response.headers.get("content-type")?.includes("text/event-stream")) {
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader!.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") {
                socket.send(JSON.stringify({ type: "done" }));
              } else {
                socket.send(JSON.stringify({ type: "chunk", data }));
              }
            }
          }
        }

        socket.send(JSON.stringify({ type: "done" }));
      } else {
        const openaiData = await response.json();
        const parsedOutput = parseResponseOutput(openaiData);
        socket.send(JSON.stringify({
          success: true,
          appSlug,
          output: parsedOutput,
          metadata: {
            model: openaiData.model || config.model,
            tokensUsed: openaiData.usage?.total_tokens || 0,
            latencyMs: openaiData.latency?.total_ms || 0,
            timestamp: new Date().toISOString(),
            userId: userId || null,
            toolsUsed: config.tools || [],
          },
        }));
      }

      socket.close();
    } catch (error: any) {
      console.error("WebSocket error:", error);
      socket.send(JSON.stringify({ error: error.message || "Internal error" }));
      socket.close();
    }
  };

  socket.onerror = (error) => {
    console.error("WebSocket error:", error);
  };

  socket.onclose = () => {
    console.log("WebSocket closed");
  };

  return response;
}

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

async function handleRealtimeSession(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const appSlug = url.searchParams.get("appSlug");
  const voice = url.searchParams.get("voice");
  const accessToken = url.searchParams.get("access_token") || url.searchParams.get("token");

  if (!appSlug) {
    return new Response(JSON.stringify({ error: "appSlug is required" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Extract and validate user from Supabase JWT (passed as query param for browser WebSocket compatibility)
  let authenticatedUserId: string | null = null;
  if (accessToken) {
    try {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      );
      const { data: { user } } = await supabase.auth.getUser(accessToken);
      authenticatedUserId = user?.id ?? null;
    } catch (e) {
      console.warn("Realtime access_token validation failed (continuing):", e);
    }
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
      return new Response(JSON.stringify({ error: `OpenAI error ${sessionRes.status}: ${errText}` }), {
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
  const userId: string | null = authenticatedUserId; // from validated access_token query param (or null)

  clientSocket.onopen = () => {
    console.log(`Realtime session started for app=${appSlug} voice=${realtimeVoice}`);
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
    if (sessionStartTime && userId) {
      const durationSeconds = (Date.now() - sessionStartTime) / 1000;
      recordRealtimeUsage(userId, appSlug, durationSeconds).catch((err) => {
        console.error("Failed to record realtime usage:", err);
      });
    }
  };

  return response;
}

async function recordRealtimeUsage(userId: string, appSlug: string, seconds: number): Promise<void> {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );
    await supabase.rpc("record_ai_app_run", {
      user_uuid: userId,
      app_slug: appSlug,
      tokens: 0,
    });
  } catch (err) {
    console.error("recordRealtimeUsage error:", err);
  }
}