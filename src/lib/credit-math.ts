export type UsageType = 'input' | 'output' | 'image' | 'minute';

export interface UsageInput {
  model: string;
  type: UsageType;
  amount: number;
}

export interface DeductResult {
  credits: number;
  balanceAfter: number;
}

export interface Transaction {
  amount_credits: number;
  balance_after_credits: number;
  type: 'purchase' | 'api_usage' | 'refund' | 'bonus' | 'adjustment';
  source: string;
  source_id: string;
}

export const CREDITS_PER_DOLLAR = 100_000;

export const MODEL_CREDIT_RATES: Record<string, { input: number; output: number }> = {
  'gpt-4o': { input: 500_000, output: 1_500_000 },
  'gpt-4o-mini': { input: 15_000, output: 60_000 },
  'o1': { input: 1_500_000, output: 6_000_000 },
  'o1-mini': { input: 300_000, output: 1_200_000 },
};

export const DALLE_CREDITS_PER_IMAGE = 4_000;
export const WHISPER_CREDITS_PER_MINUTE = 600;

export function calculateCreditsForUsage(input: UsageInput): number {
  if (input.amount <= 0) {
    return 0;
  }

  switch (input.type) {
    case 'input':
      return calculateModelCredits(input.model, 'input', input.amount);
    case 'output':
      return calculateModelCredits(input.model, 'output', input.amount);
    case 'image':
      return calculateImageCredits(input.model, input.amount);
    case 'minute':
      return calculateMinuteCredits(input.model, input.amount);
    default:
      return 0;
  }
}

export function calculateModelCredits(model: string, ioType: 'input' | 'output', tokens: number): number {
  const rates = MODEL_CREDIT_RATES[model];
  if (!rates) {
    return 0;
  }

  const rate = ioType === 'input' ? rates.input : rates.output;
  return Math.ceil((tokens * rate) / 1_000_000);
}

export function calculateImageCredits(model: string, images: number): number {
  if (images <= 0) {
    return 0;
  }

  const rate = model.toLowerCase().includes('dall-e') || model.toLowerCase().includes('dall-e-3')
    ? DALLE_CREDITS_PER_IMAGE
    : DALLE_CREDITS_PER_IMAGE;

  return Math.ceil(images * rate);
}

export function calculateMinuteCredits(model: string, minutes: number): number {
  if (minutes <= 0) {
    return 0;
  }

  const rate = model.toLowerCase().includes('whisper')
    ? WHISPER_CREDITS_PER_MINUTE
    : 0;

  return Math.ceil(minutes * rate);
}

export function deductCredits(currentBalance: number, creditsToDeduct: number): DeductResult {
  if (creditsToDeduct <= 0) {
    return { credits: 0, balanceAfter: currentBalance };
  }

  const balanceAfter = Math.max(0, currentBalance - creditsToDeduct);
  return { credits: creditsToDeduct, balanceAfter };
}

export function creditsToUsd(credits: number): number {
  return credits / CREDITS_PER_DOLLAR;
}

export function usdToCredits(usd: number): number {
  return Math.ceil(usd * CREDITS_PER_DOLLAR);
}
