import { describe, it, expect } from 'vitest';
import {
  CREDITS_PER_DOLLAR,
  MODEL_CREDIT_RATES,
  DALLE_CREDITS_PER_IMAGE,
  WHISPER_CREDITS_PER_MINUTE,
  calculateCreditsForUsage,
  calculateModelCredits,
  calculateImageCredits,
  calculateMinuteCredits,
  deductCredits,
  creditsToUsd,
  usdToCredits,
  type UsageInput,
  type DeductResult,
} from '../src/lib/credit-math';

describe('credit-math', () => {
  describe('CREDITS_PER_DOLLAR', () => {
    it('should define credits per dollar', () => {
      expect(CREDITS_PER_DOLLAR).toBe(100_000);
    });
  });

  describe('MODEL_CREDIT_RATES', () => {
    it('should define rates for all models', () => {
      expect(MODEL_CREDIT_RATES['gpt-4o']).toEqual({ input: 500_000, output: 1_500_000 });
      expect(MODEL_CREDIT_RATES['gpt-4o-mini']).toEqual({ input: 15_000, output: 60_000 });
      expect(MODEL_CREDIT_RATES['o1']).toEqual({ input: 1_500_000, output: 6_000_000 });
      expect(MODEL_CREDIT_RATES['o1-mini']).toEqual({ input: 300_000, output: 1_200_000 });
    });
  });

  describe('DALLE_CREDITS_PER_IMAGE', () => {
    it('should define credits per DALL-E image', () => {
      expect(DALLE_CREDITS_PER_IMAGE).toBe(4_000);
    });
  });

  describe('WHISPER_CREDITS_PER_MINUTE', () => {
    it('should define credits per Whisper minute', () => {
      expect(WHISPER_CREDITS_PER_MINUTE).toBe(600);
    });
  });

  describe('calculateModelCredits', () => {
    it('should calculate input credits for gpt-4o', () => {
      expect(calculateModelCredits('gpt-4o', 'input', 1_000_000)).toBe(500_000);
      expect(calculateModelCredits('gpt-4o', 'input', 2_000_000)).toBe(1_000_000);
    });

    it('should calculate output credits for gpt-4o', () => {
      expect(calculateModelCredits('gpt-4o', 'output', 1_000_000)).toBe(1_500_000);
      expect(calculateModelCredits('gpt-4o', 'output', 2_000_000)).toBe(3_000_000);
    });

    it('should calculate credits for gpt-4o-mini', () => {
      expect(calculateModelCredits('gpt-4o-mini', 'input', 1_000_000)).toBe(15_000);
      expect(calculateModelCredits('gpt-4o-mini', 'output', 1_000_000)).toBe(60_000);
    });

    it('should calculate credits for o1', () => {
      expect(calculateModelCredits('o1', 'input', 1_000_000)).toBe(1_500_000);
      expect(calculateModelCredits('o1', 'output', 1_000_000)).toBe(6_000_000);
    });

    it('should calculate credits for o1-mini', () => {
      expect(calculateModelCredits('o1-mini', 'input', 1_000_000)).toBe(300_000);
      expect(calculateModelCredits('o1-mini', 'output', 1_000_000)).toBe(1_200_000);
    });

    it('should return 0 for unknown models', () => {
      expect(calculateModelCredits('unknown-model', 'input', 1_000_000)).toBe(0);
      expect(calculateModelCredits('unknown-model', 'output', 1_000_000)).toBe(0);
    });

    it('should handle zero tokens', () => {
      expect(calculateModelCredits('gpt-4o', 'input', 0)).toBe(0);
      expect(calculateModelCredits('gpt-4o', 'output', 0)).toBe(0);
    });

    it('should handle partial tokens', () => {
      expect(calculateModelCredits('gpt-4o', 'input', 500_000)).toBe(250_000);
      expect(calculateModelCredits('gpt-4o-mini', 'input', 666_666)).toBeCloseTo(10_000, 0);
    });
  });

  describe('calculateImageCredits', () => {
    it('should calculate credits for DALL-E images', () => {
      expect(calculateImageCredits('dall-e-3', 1)).toBe(4_000);
      expect(calculateImageCredits('dall-e-3', 2)).toBe(8_000);
      expect(calculateImageCredits('DALL-E 3', 1)).toBe(4_000);
    });

    it('should handle zero images', () => {
      expect(calculateImageCredits('dall-e-3', 0)).toBe(0);
    });

    it('should handle fractional images', () => {
      expect(calculateImageCredits('dall-e-3', 0.5)).toBe(2_000);
    });
  });

  describe('calculateMinuteCredits', () => {
    it('should calculate credits for Whisper', () => {
      expect(calculateMinuteCredits('whisper-1', 1)).toBe(600);
      expect(calculateMinuteCredits('whisper', 5)).toBe(3_000);
      expect(calculateMinuteCredits('whisper-1-turbo', 2.5)).toBe(1_500);
    });

    it('should handle zero minutes', () => {
      expect(calculateMinuteCredits('whisper-1', 0)).toBe(0);
    });

    it('should handle fractional minutes', () => {
      expect(calculateMinuteCredits('whisper-1', 0.5)).toBe(300);
    });
  });

  describe('calculateCreditsForUsage', () => {
    it('should calculate input credits', () => {
      const input: UsageInput = { model: 'gpt-4o', type: 'input', amount: 500_000 };
      expect(calculateCreditsForUsage(input)).toBe(250_000);
    });

    it('should calculate output credits', () => {
      const input: UsageInput = { model: 'gpt-4o', type: 'output', amount: 500_000 };
      expect(calculateCreditsForUsage(input)).toBe(750_000);
    });

    it('should calculate image credits', () => {
      const input: UsageInput = { model: 'dall-e-3', type: 'image', amount: 3 };
      expect(calculateCreditsForUsage(input)).toBe(12_000);
    });

    it('should calculate minute credits', () => {
      const input: UsageInput = { model: 'whisper-1', type: 'minute', amount: 2 };
      expect(calculateCreditsForUsage(input)).toBe(1_200);
    });

    it('should handle zero amounts', () => {
      const input: UsageInput = { model: 'gpt-4o', type: 'input', amount: 0 };
      expect(calculateCreditsForUsage(input)).toBe(0);
    });

    it('should handle unknown models', () => {
      const input: UsageInput = { model: 'unknown-model', type: 'input', amount: 1_000_000 };
      expect(calculateCreditsForUsage(input)).toBe(0);
    });
  });

  describe('deductCredits', () => {
    it('should deduct credits from balance', () => {
      const result = deductCredits(1000, 300);
      expect(result).toEqual<DeductResult>({ credits: 300, balanceAfter: 700 });
    });

    it('should not deduct more than available', () => {
      const result = deductCredits(100, 300);
      expect(result).toEqual<DeductResult>({ credits: 300, balanceAfter: 0 });
    });

    it('should handle zero deduction', () => {
      const result = deductCredits(1000, 0);
      expect(result).toEqual<DeductResult>({ credits: 0, balanceAfter: 1000 });
    });

    it('should handle negative deduction', () => {
      const result = deductCredits(1000, -50);
      expect(result).toEqual<DeductResult>({ credits: 0, balanceAfter: 1000 });
    });

    it('should handle full balance deduction', () => {
      const result = deductCredits(500, 500);
      expect(result).toEqual<DeductResult>({ credits: 500, balanceAfter: 0 });
    });
  });

  describe('creditsToUsd', () => {
    it('should convert credits to USD', () => {
      expect(creditsToUsd(100_000)).toBe(1);
      expect(creditsToUsd(50_000)).toBe(0.5);
      expect(creditsToUsd(500_000)).toBe(5);
    });

    it('should handle zero credits', () => {
      expect(creditsToUsd(0)).toBe(0);
    });
  });

  describe('usdToCredits', () => {
    it('should convert USD to credits', () => {
      expect(usdToCredits(1)).toBe(100_000);
      expect(usdToCredits(0.5)).toBe(50_000);
      expect(usdToCredits(5)).toBe(500_000);
    });

    it('should handle fractional USD', () => {
      expect(usdToCredits(0.01)).toBe(1_000);
    });

    it('should handle zero USD', () => {
      expect(usdToCredits(0)).toBe(0);
    });
  });

  describe('GPT-4o pricing', () => {
    it('should match OpenAI pricing of $5/1M input tokens', () => {
      const inputCredits = calculateModelCredits('gpt-4o', 'input', 1_000_000);
      expect(inputCredits).toBe(500_000);
      expect(creditsToUsd(inputCredits)).toBe(5);
    });

    it('should match OpenAI pricing of $15/1M output tokens', () => {
      const outputCredits = calculateModelCredits('gpt-4o', 'output', 1_000_000);
      expect(outputCredits).toBe(1_500_000);
      expect(creditsToUsd(outputCredits)).toBe(15);
    });
  });

  describe('GPT-4o-mini pricing', () => {
    it('should match OpenAI pricing of $0.15/1M input tokens', () => {
      const inputCredits = calculateModelCredits('gpt-4o-mini', 'input', 1_000_000);
      expect(inputCredits).toBe(15_000);
      expect(creditsToUsd(inputCredits)).toBe(0.15);
    });

    it('should match OpenAI pricing of $0.60/1M output tokens', () => {
      const outputCredits = calculateModelCredits('gpt-4o-mini', 'output', 1_000_000);
      expect(outputCredits).toBe(60_000);
      expect(creditsToUsd(outputCredits)).toBe(0.60);
    });
  });

  describe('o1 pricing', () => {
    it('should match OpenAI pricing of $15/1M input tokens', () => {
      const inputCredits = calculateModelCredits('o1', 'input', 1_000_000);
      expect(inputCredits).toBe(1_500_000);
      expect(creditsToUsd(inputCredits)).toBe(15);
    });

    it('should match OpenAI pricing of $60/1M output tokens', () => {
      const outputCredits = calculateModelCredits('o1', 'output', 1_000_000);
      expect(outputCredits).toBe(6_000_000);
      expect(creditsToUsd(outputCredits)).toBe(60);
    });
  });

  describe('o1-mini pricing', () => {
    it('should match OpenAI pricing of $3/1M input tokens', () => {
      const inputCredits = calculateModelCredits('o1-mini', 'input', 1_000_000);
      expect(inputCredits).toBe(300_000);
      expect(creditsToUsd(inputCredits)).toBe(3);
    });

    it('should match OpenAI pricing of $12/1M output tokens', () => {
      const outputCredits = calculateModelCredits('o1-mini', 'output', 1_000_000);
      expect(outputCredits).toBe(1_200_000);
      expect(creditsToUsd(outputCredits)).toBe(12);
    });
  });

  describe('DALL-E 3 pricing', () => {
    it('should match OpenAI pricing of $40 per image', () => {
      const credits = calculateImageCredits('dall-e-3', 1);
      expect(credits).toBe(4_000);
      expect(creditsToUsd(credits)).toBe(0.04);
    });
  });

  describe('Whisper pricing', () => {
    it('should match OpenAI pricing of $0.006 per minute', () => {
      const credits = calculateMinuteCredits('whisper-1', 1);
      expect(credits).toBe(600);
      expect(creditsToUsd(credits)).toBe(0.006);
    });

    it('should match OpenAI pricing of $0.006 per minute for 2.5 minutes', () => {
      const credits = calculateMinuteCredits('whisper-1', 2.5);
      expect(credits).toBe(1_500);
      expect(creditsToUsd(credits)).toBe(0.015);
    });
  });

  describe('rounding behavior', () => {
    it('should round up partial credits', () => {
      expect(calculateModelCredits('gpt-4o-mini', 'input', 33_333_333)).toBeGreaterThanOrEqual(500_000);
    });

    it('should handle very small token counts', () => {
      expect(calculateModelCredits('gpt-4o-mini', 'input', 1)).toBeGreaterThanOrEqual(1);
    });
  });

  describe('credit product value', () => {
    it('should map 500K credits to $5 (Starter)', () => {
      expect(creditsToUsd(500_000)).toBe(5);
    });

    it('should map 2.5M credits to $25 at base rate', () => {
      expect(creditsToUsd(2_500_000)).toBe(25);
    });

    it('should map 8M credits to $80 at base rate', () => {
      expect(creditsToUsd(8_000_000)).toBe(80);
    });

    it('should map 35M credits to $350 at base rate', () => {
      expect(creditsToUsd(35_000_000)).toBe(350);
    });
  });
});
