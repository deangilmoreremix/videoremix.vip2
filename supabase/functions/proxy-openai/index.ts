// supabase/functions/proxy-openai/index.ts
//
// Authenticated OpenAI proxy with credit enforcement. Identity, credit gate,
// stream billing, and the atomic deduction all run through the shared core in
// ../run-ai-app/credit-core.ts (proven by tests/run-ai-app-credit-core.test.ts
// and tests/credit-concurrency.test.ts):
//   1. user_id comes only from the verified bearer token (never the body);
//   2. unpriced models are refused (400 MODEL_NOT_PRICED) before any spend;
//   3. a machine-readable 402 (INSUFFICIENT_CREDITS) precedes every OpenAI
//      call whose balance cannot cover the conservative estimate;
//   4. streamed runs are billed from real provider usage, exactly once, with
//      no charge when the provider sent zero bytes or a terminal error event;
//   5. deductions go through the single atomic `credits.deduct_credits` RPC
//      on the service-role client (no read-modify-write in this file).

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';
import {
  isSupportedModel,
  MODEL_CREDIT_RATES,
  estimateRequestCredits,
  calculateUsageCredits,
  estimateChatInputTokens,
  creditsForTokens,
  DALLE_CREDITS_PER_IMAGE,
  WHISPER_CREDITS_PER_MINUTE,
} from '../_shared/creditRates.ts';
import {
  MODEL_NOT_PRICED_CODE,
  createBillingTee,
  creditGateHeaders,
  deductUsageCredits,
  evaluateCreditGate,
  extractUsageFromEvent,
  insufficientCreditsBody,
  type RpcCaller,
  type StreamBill,
} from '../run-ai-app/credit-core.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

const DEFAULT_APP_ID = 'videoremixvip';
const DEFAULT_MODEL = 'gpt-5.5';
const DEFAULT_OUTPUT_TOKEN_ESTIMATE = 1_000;

/**
 * Verify the caller from the Authorization bearer token ONLY.
 *
 * The identity used for balance reads and deductions is the `sub` of the
 * verified token - never anything from the request body. The Supabase client
 * here is the anon client scoped to the caller's token, used purely for
 * identity verification; all credit operations below run on the service-role
 * client so RLS/ownership mistakes cannot move another user's balance.
 */
async function verifyUser(req: Request) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.substring(7);
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: `Bearer ${token}` },
        },
      }
    );
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) return null;
    return { user_id: user.id };
  } catch (e) {
    console.error('JWT verification failed:', e);
    return null;
  }
}

/** Service-role client bound to the credits schema. */
function createCreditsClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { schema: 'credits' }
  );
}

async function getBalance(userId: string, appId: string): Promise<{ balance: number; error?: string }> {
  const creditsClient = createCreditsClient();
  const { data, error } = await creditsClient
    .from('credit_balances')
    .select('balance_credits')
    .eq('user_id', userId)
    .eq('app_id', appId)
    .maybeSingle();

  if (error) {
    return { balance: 0, error: error.message };
  }
  return { balance: data?.balance_credits ?? 0 };
}

function insufficientCreditsResponse(required: number, balance: number, model: string) {
  return new Response(
    JSON.stringify(insufficientCreditsBody({ required, balance, model, message: 'Insufficient credits' })),
    {
      status: 402,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        ...creditGateHeaders({ balance, required }),
      },
    }
  );
}

function unsupportedModelResponse(model: string) {
  return new Response(
    JSON.stringify({
      error: MODEL_NOT_PRICED_CODE,
      message: `Model "${model}" is not supported by the credit billing system.`,
      supported_models: Object.keys(MODEL_CREDIT_RATES),
    }),
    {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}

/** Conservative pre-flight estimate for the credit gate. */
function estimateRequestCost(model: string, requestBody: any): number {
  if (model === 'dall-e-3') {
    const images = Number(requestBody?.n) || 1;
    return Math.max(Math.ceil(images * DALLE_CREDITS_PER_IMAGE), 1);
  }
  if (model === 'whisper-1') {
    // Transcription is billed per minute; assume the minimum billable minute.
    return Math.max(WHISPER_CREDITS_PER_MINUTE, 1);
  }

  const inputTokens = estimateChatInputTokens(requestBody);
  const outputTokens =
    Number(requestBody?.max_tokens) ||
    Number(requestBody?.max_completion_tokens) ||
    DEFAULT_OUTPUT_TOKEN_ESTIMATE;

  return estimateRequestCredits(model, inputTokens, outputTokens);
}

/** Exact post-call cost from a parsed (non-streaming) response body. */
function calculateActualCost(model: string, responseData: any): number {
  if (model === 'dall-e-3') {
    const images = Array.isArray(responseData?.data) ? responseData.data.length : 1;
    return Math.max(images * DALLE_CREDITS_PER_IMAGE, 1);
  }
  if (model === 'whisper-1') {
    const seconds = Number(responseData?.duration) || 0;
    const minutes = seconds / 60;
    return Math.max(creditsForTokens(minutes, WHISPER_CREDITS_PER_MINUTE), 1);
  }

  const usage = responseData?.usage;
  if (!usage) return 0;

  const inputTokens = Number(usage.prompt_tokens ?? usage.input_tokens ?? 0);
  const outputTokens = Number(usage.completion_tokens ?? usage.output_tokens ?? 0);
  return Math.max(calculateUsageCredits(model, inputTokens, outputTokens), 1);
}

/** Billed-token extraction for a completed (non-streaming) provider response. */
function extractUsage(responseData: any): {
  inputTokens: number;
  outputTokens: number;
  cachedInputTokens: number;
} {
  const parsed = extractUsageFromEvent(responseData);
  return {
    inputTokens: parsed?.inputTokens ?? 0,
    outputTokens: parsed?.outputTokens ?? 0,
    cachedInputTokens: parsed?.cachedInputTokens ?? 0,
  };
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    // 1. Identity: only from the verified bearer token.
    const userContext = await verifyUser(req);
    if (!userContext) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { user_id } = userContext;
    const appId = DEFAULT_APP_ID;

    // Parse path from URL
    const url = new URL(req.url);
    const openaiPath = url.pathname.replace(/^\/functions\/v1\/proxy-openai/, '') || '/';

    // Read request body
    const body = await req.text();
    let requestBody: any = {};
    try {
      requestBody = JSON.parse(body);
    } catch {
      // body may be empty or not JSON
    }

    // Determine model from request body
    const model = requestBody.model || DEFAULT_MODEL;

    // 2. Unknown models have no price -> refuse (400) instead of guessing.
    if (!isSupportedModel(model)) {
      return unsupportedModelResponse(model);
    }

    // 3. Balance + cost estimate on the service-role credits client.
    const { balance, error: balanceError } = await getBalance(user_id, appId);

    const estimatedCost = estimateRequestCost(model, requestBody);

    // Credit gate (shared with run-ai-app): fail closed on balance-read
    // errors, refuse unpriced models, and return a machine-readable 402
    // BEFORE any OpenAI spend.
    const gate = evaluateCreditGate({
      balanceError: balanceError ? String(balanceError) : null,
      balance,
      requiredCredits: estimatedCost,
      model,
      modelSupported: isSupportedModel(model),
    });

    if (!gate.ok) {
      if (gate.status === 402) {
        return insufficientCreditsResponse(estimatedCost, balance, model);
      }
      console.error('proxy-openai credit gate refused:', JSON.stringify(gate.body));
      return new Response(JSON.stringify(gate.body), {
        status: gate.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Forward request to OpenAI
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      console.error('OPENAI_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const openaiUrl = `https://api.openai.com${openaiPath}`;

    let openaiResponse: Response;
    try {
      openaiResponse = await fetch(openaiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiApiKey}`,
        },
        body,
      });
    } catch (error) {
      console.error('OpenAI request failed:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to reach AI service' }),
        {
          status: 503,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const isStreamingResponse =
      requestBody.stream === true &&
      openaiResponse.headers.get('content-type')?.includes('text/event-stream');

    // Deduct via the shared, atomic-RPC core. Returns the credits actually
    // charged (0 when the deduction failed, which is logged loudly for
    // reconciliation: CREDIT_SHORTFALL when the balance could not cover it).
    const chargeCredits = async (
      amount: number,
      tokens?: { inputTokens?: number; outputTokens?: number; cachedInputTokens?: number },
    ): Promise<number> => {
      if (amount <= 0) return 0;
      return deductUsageCredits({
        rpc: ((fn: string, args: Record<string, unknown>) =>
          createCreditsClient().rpc(fn, args)) as RpcCaller,
        userId: user_id,
        appId,
        appSlug: 'proxy-openai',
        model,
        credits: amount,
        inputTokens: tokens?.inputTokens ?? 0,
        outputTokens: tokens?.outputTokens ?? 0,
        cachedInputTokens: tokens?.cachedInputTokens ?? 0,
        source: 'api_proxy',
        sourceId: `proxy:${Date.now()}`,
      });
    };

    if (!openaiResponse.ok) {
      // Upstream failure: no spend, no charge.
      const responseBody = await openaiResponse.text();
      return new Response(responseBody, {
        status: openaiResponse.status,
        headers: {
          ...corsHeaders,
          'Content-Type': openaiResponse.headers.get('Content-Type') || 'application/json',
        },
      });
    }

    // 4. Streaming responses are tee'd: the client stream is forwarded
    //    byte-for-byte while the terminal usage chunk is captured for billing.
    if (isStreamingResponse && openaiResponse.body) {
      // Tee with the shared billing core: exact usage when the terminal usage
      // chunk arrived, the conservative estimate for a partially consumed
      // stream (client abort), and NO charge when the provider delivered
      // zero bytes or ended the stream with a terminal error event.
      let estimateTokens = { inputTokens: 0, outputTokens: 0 };
      if (model !== 'dall-e-3' && model !== 'whisper-1') {
        estimateTokens = {
          inputTokens: estimateChatInputTokens(requestBody),
          outputTokens:
            Number(requestBody?.max_tokens) ||
            Number(requestBody?.max_completion_tokens) ||
            DEFAULT_OUTPUT_TOKEN_ESTIMATE,
        };
      }

      const tee = createBillingTee({
        model,
        estimatedCredits: estimatedCost,
        estimatedInputTokens: estimateTokens.inputTokens,
        estimatedOutputTokens: estimateTokens.outputTokens,
        charge: async (bill: StreamBill) => {
          const deducted = await chargeCredits(bill.credits, {
            inputTokens: bill.inputTokens,
            outputTokens: bill.outputTokens,
            cachedInputTokens: bill.cachedInputTokens,
          });
          // The response headers were already sent, so the authoritative
          // balance lives in credit_transactions; failures are logged loudly.
          if (deducted === 0) {
            console.error(`Credit deduction failed for user=${user_id} amount=${bill.credits}`);
          }
        },
      });

      return new Response(openaiResponse.body.pipeThrough(tee), {
        status: openaiResponse.status,
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    // Read OpenAI response (non-streaming)
    const responseBody = await openaiResponse.text();
    let responseData: any = {};
    try {
      responseData = JSON.parse(responseBody);
    } catch {
      // not JSON
    }

    // Only deduct credits for successful responses
    const actualCost = calculateActualCost(model, responseData);
    const usage = extractUsage(responseData);
    const deducted = await chargeCredits(actualCost, {
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
      cachedInputTokens: usage.cachedInputTokens,
    });

    const { balance: remainingBalance } = await getBalance(user_id, appId);

    return new Response(responseBody, {
      status: openaiResponse.status,
      headers: {
        ...corsHeaders,
        'Content-Type': openaiResponse.headers.get('Content-Type') || 'application/json',
        'X-Credits-Remaining': String(remainingBalance),
        'X-Credits-Deducted': String(deducted),
      },
    });
  } catch (error) {
    console.error('Proxy error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
