// supabase/functions/_shared/creditRates.ts
//
// Credit pricing shared by the OpenAI-proxy and run-ai-app edge functions.
//
// SOURCE OF TRUTH: src/lib/credit-math.ts (client-side display math).
// The tables below intentionally mirror it exactly:
//   CREDITS_PER_DOLLAR = 100_000  (1 credit = $0.00001)
//   per-million-token credit rate = USD price per 1M tokens * 100_000
//
// Keep both files in sync. Any divergence lets a user arbitrage the
// difference between the estimate (this file) and the ledger (SQL).

export const CREDITS_PER_DOLLAR = 100_000;

export interface ModelCreditRate {
  /** credits charged per 1M input tokens */
  input: number;
  /** credits charged per 1M output tokens */
  output: number;
}

/**
 * Corrected model rates (verified against OpenAI list pricing):
 *   gpt-5.5      $5 / $30   per 1M tokens -> 500_000 / 3_000_000 credits
 *   gpt-5.5-mini $0.15/$0.60              -> 15_000 / 60_000 credits
 *   o3           $2 / $8                  -> 200_000 / 800_000 credits
 *   o3-mini      $1.10 / $4.40            -> 110_000 / 440_000 credits
 *   gpt-4o       $2.50 / $10              -> 250_000 / 1_000_000 credits
 *   gpt-4o-mini  $0.15 / $0.60            -> 15_000 / 60_000 credits
 *   o1           $15 / $60                -> 1_500_000 / 6_000_000 credits
 *   o1-mini      $1.10 / $4.40            -> 110_000 / 440_000 credits
 */
export const MODEL_CREDIT_RATES: Record<string, ModelCreditRate> = {
  'gpt-5.5': { input: 500_000, output: 3_000_000 },
  'gpt-5.5-mini': { input: 15_000, output: 60_000 },
  'o3': { input: 200_000, output: 800_000 },
  'o3-mini': { input: 110_000, output: 440_000 },
  'gpt-4o': { input: 250_000, output: 1_000_000 },
  'gpt-4o-mini': { input: 15_000, output: 60_000 },
  'o1': { input: 1_500_000, output: 6_000_000 },
  'o1-mini': { input: 110_000, output: 440_000 },
};

export const DALLE_CREDITS_PER_IMAGE = 4_000;
export const WHISPER_CREDITS_PER_MINUTE = 600;

/** Realtime voice sessions are billed per connected minute. */
export const REALTIME_CREDITS_PER_MINUTE = 6_000;

export function getModelRate(model: string): ModelCreditRate | null {
  return MODEL_CREDIT_RATES[model] ?? null;
}

export function isSupportedModel(model: string): boolean {
  return Object.prototype.hasOwnProperty.call(MODEL_CREDIT_RATES, model);
}

/** Credits for a number of tokens at a per-1M-token rate (rounded up). */
export function creditsForTokens(tokens: number, perMillionRate: number): number {
  if (!Number.isFinite(tokens) || tokens <= 0) return 0;
  if (!Number.isFinite(perMillionRate) || perMillionRate <= 0) return 0;
  return Math.ceil((tokens * perMillionRate) / 1_000_000);
}

/**
 * Exact cost of a completed request from its token usage.
 * Unknown models cost 0 — callers reject unknown models before the OpenAI
 * call instead (see proxy-openai), so this should not happen in practice.
 */
export function calculateUsageCredits(
  model: string,
  inputTokens: number,
  outputTokens: number,
): number {
  const rate = getModelRate(model);
  if (!rate) return 0;
  return (
    creditsForTokens(inputTokens, rate.input) +
    creditsForTokens(outputTokens, rate.output)
  );
}

/**
 * Conservative pre-flight estimate used for the credit gate (402 check).
 * Estimates the full expected spend (input + max output) so a request can
 * never start when the balance cannot cover the maximum possible bill.
 */
export function estimateRequestCredits(
  model: string,
  estimatedInputTokens: number,
  estimatedOutputTokens: number,
): number {
  const rate = getModelRate(model);
  if (!rate) return 0;
  const input = creditsForTokens(estimatedInputTokens, rate.input);
  const output = creditsForTokens(estimatedOutputTokens, rate.output);
  return Math.max(input + output, 1);
}

/** Estimate input tokens from a chat-completions style body (~4 chars/token). */
export function estimateChatInputTokens(requestBody: any): number {
  const messages = requestBody?.messages;
  if (!Array.isArray(messages)) return 100;
  let chars = 0;
  for (const message of messages) {
    const content = message?.content;
    if (typeof content === 'string') {
      chars += content.length;
    } else if (Array.isArray(content)) {
      for (const part of content) {
        if (typeof part?.text === 'string') chars += part.text.length;
      }
    }
  }
  if (chars === 0) return 100;
  return Math.max(1, Math.ceil(chars / 4));
}

/** Credits for a realtime voice session of `seconds` duration. */
export function calculateRealtimeCredits(seconds: number): number {
  if (!Number.isFinite(seconds) || seconds <= 0) return 0;
  const minutes = seconds / 60;
  return Math.ceil(minutes * REALTIME_CREDITS_PER_MINUTE);
}
