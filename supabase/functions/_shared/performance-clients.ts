/**
 * Optimized LLM Clients
 *
 * Provides pre-configured OpenAI and Anthropic clients with:
 * - Application-specific defaults (temperature, max_tokens, model)
 * - Built-in caching (via ResponseCache)
 * - Circuit breaker protection
 * - Automatic retry with exponential backoff
 * - Request deduplication
 * - Rate limiting compliance
 * - Performance metrics tracking
 *
 * Application Types & Their Profiles:
 *
 * 1. FINANCIAL ANALYSIS
 *    - Temperature: 0.2 (low creativity, high precision)
 *    - Max Tokens: 800 (concise)
 *    - Model: gpt-4o-mini (cost-effective)
 *    - Use for: stock analysis, financial advice, risk assessment
 *
 * 2. CONTENT GENERATION
 *    - Temperature: 0.7 (balanced creativity)
 *    - Max Tokens: 2000 (detailed)
 *    - Model: gpt-4o (best quality)
 *    - Use for: blog posts, marketing copy, articles
 *
 * 3. CODING/TECHNICAL
 *    - Temperature: 0.1 (deterministic)
 *    - Max Tokens: 3000 (detailed code)
 *    - Model: gpt-4o
 *    - Use for: code generation, debugging, documentation
 *
 * 4. RAG/Q&A
 *    - Temperature: 0.3 (factual, minimal creativity)
 *    - Max Tokens: 1000 (focused answers)
 *    - Model: gpt-4o-mini (fast & cheap)
 *    - Use for: knowledge base Q&A, document search
 *
 * 5. SOCIAL MEDIA
 *    - Temperature: 0.8 (high engagement, creative)
 *    - Max Tokens: 1500 (multiple posts/ideas)
 *    - Model: gpt-4o
 *    - Use for: tweet generation, social content, engagement
 *
 * 6. REASONING
 *    - Temperature: 0.2 (logical thinking)
 *    - Max Tokens: 4000 (deep analysis)
 *    - Model: gpt-4o (reasoning capability)
 *    - Use for: problem-solving, strategic planning
 *
 * 7. VISION
 *    - Temperature: 0.2 (objective analysis)
 *    - Max Tokens: 1000 (descriptive)
 *    - Model: gpt-4o (vision-capable)
 *    - Use for: image analysis, document understanding
 *
 * 8. PODCAST/AUDIO
 *    - Temperature: 0.75 (conversational, engaging)
 *    - Max Tokens: 3000 (long-form scripts)
 *    - Model: gpt-4o
 *    - Use for: podcast scripts, audio content
 */

import { OpenAI } from 'npm:openai@4.78.1';
import Anthropic from 'npm:anthropic@0.39.0';
import { deduplicateRequest, generateDedupeKey } from './deduplicator';
import { circuitBreakerRegistry, withCircuitBreaker } from './circuit-breaker';
import { retryWithBackoff } from './retry';
import { responseCache } from './cache';
import { getLLMRateLimiter, estimateChatTokens } from './rate-limiter';

export type AppType = 'financial' | 'content_generation' | 'coding' | 'rag' | 'social' | 'reasoning' | 'vision' | 'podcast' | 'default';

export const APP_TYPE_CONFIG: Record<AppType, LLMRequestOptions> = {
  financial: {
    temperature: 0.2,
    max_tokens: 800,
    top_p: 0.9,
    frequency_penalty: 0,
    presence_penalty: 0,
  },
  content_generation: {
    temperature: 0.7,
    max_tokens: 2000,
    top_p: 0.95,
    frequency_penalty: 0.3,
    presence_penalty: 0.3,
  },
  coding: {
    temperature: 0.1,
    max_tokens: 3000,
    top_p: 0.95,
    frequency_penalty: 0,
    presence_penalty: 0,
  },
  rag: {
    temperature: 0.3,
    max_tokens: 1000,
    top_p: 0.9,
    frequency_penalty: 0.1,
    presence_penalty: 0.1,
  },
  social: {
    temperature: 0.8,
    max_tokens: 1500,
    top_p: 0.95,
    frequency_penalty: 0.5,
    presence_penalty: 0.5,
  },
  reasoning: {
    temperature: 0.2,
    max_tokens: 4000,
    top_p: 0.9,
    frequency_penalty: 0,
    presence_penalty: 0,
  },
  vision: {
    temperature: 0.2,
    max_tokens: 1000,
    top_p: 0.9,
  },
  podcast: {
    temperature: 0.75,
    max_tokens: 3000,
    top_p: 0.95,
    frequency_penalty: 0.3,
    presence_penalty: 0.3,
  },
  default: {
    temperature: 0.5,
    max_tokens: 1500,
    top_p: 0.9,
  },
};

export interface LLMRequestOptions {
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  stream?: boolean; // Streaming not compatible with caching
  timeout?: number;
  retryAttempts?: number;
  cacheTtl?: number; // 0 = disable cache, >0 = cache in seconds
  priority?: 'low' | 'normal' | 'high';
  model?: string;
}

export interface OptimizedOpenAI {
  chat: {
    completions: {
      create: (params: any, options?: any) => Promise<any>;
    };
  };
  embeddings: {
    create: (params: { model: string; input: string | string[] }) => Promise<any>;
  };
}

/**
 * Create an optimized OpenAI client with performance enhancements
 */
export function createOptimizedOpenAIClient(
  apiKey?: string,
  defaults?: Partial<LLMRequestOptions>,
): OptimizedOpenAI {
  const baseKey = apiKey || Deno.env.get('OPENAI_API_KEY');
  if (!baseKey) {
    throw new Error('OpenAI API key not provided');
  }

  const openai = new OpenAI({
    apiKey: baseKey,
    maxRetries: 0, // We handle retries ourselves
    timeout: 60000,
  });

  const rateLimiter = getLLMRateLimiter();

  return {
    chat: {
      completions: {
        create: async (params: any, options: any = {}) => {
          const merged = mergeParams(params, defaults, 'openai');

          // Build dedupe key
          const dedupeKey = generateDedupeKey(
            'openai',
            merged.model,
            merged.messages,
            { ...merged, ...options },
          );

          // Wrap entire operation in deduplication
          return await deduplicateRequest(
            dedupeKey,
            async () => {
              // Rate limit check
              const estimatedTokens = estimateChatTokens(merged.messages, merged.model) + merged.max_tokens;
              await rateLimiter.acquire('openai', merged.model, estimatedTokens);

              // Circuit breaker
              const breakerName = `openai:${merged.model}`;
              return await withCircuitBreaker(breakerName, async () => {
                // Retry with backoff
                return await retryWithBackoff(
                  async () => {
                    const result = await openai.chat.completions.create(merged, options);

                    // Track metrics
                    trackAPICall('openai', merged.model, result);

                    return result;
                  },
                  {
                    maxAttempts: merged.retryAttempts || 3,
                    retryableErrors: ['rate_limit', 'timeout', '429', '500', '502', '503', '504'],
                    initialDelayMs: 1000,
                    maxDelayMs: 30000,
                    onRetry: (attempt, error, delay) => {
                      console.log(`OpenAI retry ${attempt} after ${delay}ms: ${error.message}`);
                    },
                  },
                );
              });
            },
            { ttl: merged.cacheTtl ? merged.cacheTtl * 1000 : 0 },
          );
        },
      },
    },

    embeddings: {
      create: async (params: { model: string; input: string | string[] }) => {
        // Handle both single and batch
        const texts = Array.isArray(params.input) ? params.input : [params.input];

        // Estimate tokens (roughly 4 chars per token)
        const totalChars = texts.reduce((sum, t) => sum + t.length, 0);
        const estimatedTokens = Math.ceil(totalChars / 4);

        // Rate limit
        await rateLimiter.acquire('openai', params.model, estimatedTokens);

        // Dedupe key based on texts (if single, use dedupe; if batch, always process)
        const dedupeKey = texts.length === 1
          ? `embed:${params.model}:${texts[0].slice(0, 100)}`
          : `embed:batch:${Date.now()}`;

        return await deduplicateRequest(
          dedupeKey,
          async () => {
            const breakerName = `openai:${params.model}:embeddings`;
            return await withCircuitBreaker(breakerName, async () => {
              return await retryWithBackoff(
                async () => {
                  const result = await openai.embeddings.create({
                    model: params.model,
                    input: texts,
                  });

                  // Cache individual embeddings
                  if (result.data) {
                    for (let i = 0; i < texts.length; i++) {
                      await responseCache.set(
                        'openai',
                        params.model,
                        [{ content: texts[i] }],
                        result.data[i].embedding,
                        24 * 60 * 60, // 24 hours
                      );
                    }
                  }

                  trackAPICall('openai', params.model, result, true);
                  return result;
                },
                {
                  maxAttempts: 3,
                  retryableErrors: ['rate_limit', 'timeout', '429', '500', '502', '503', '504'],
                },
              );
            }),
          },
        );
      },
    },
  };
}

/**
 * Create an optimized Anthropic client
 */
export function createOptimizedAnthropicClient(
  apiKey?: string,
  defaults?: Partial<LLMRequestOptions>,
) {
  const baseKey = apiKey || Deno.env.get('ANTHROPIC_API_KEY');
  if (!baseKey) {
    throw new Error('Anthropic API key not provided');
  }

  const anthropic = new Anthropic({ apiKey: baseKey });
  const rateLimiter = getLLMRateLimiter();

  return {
    messages: {
      create: async (params: any, options: any = {}) => {
        const merged = mergeAnthropicParams(params, defaults);

        // Dedupe key
        const dedupeKey = generateDedupeKey(
          'anthropic',
          merged.model,
          [{ role: 'user', content: merged.messages }],
          merged,
        );

        return await deduplicateRequest(
          dedupeKey,
          async () => {
            const estimatedTokens = (merged.max_tokens || 1000) + estimateChatTokens(merged.messages);
            await rateLimiter.acquire('anthropic', merged.model, estimatedTokens);

            const breakerName = `anthropic:${merged.model}`;
            return await withCircuitBreaker(breakerName, async () => {
              return await retryWithBackoff(
                async () => {
                  const result = await anthropic.messages.create(merged);

                  trackAPICall('anthropic', merged.model, result);
                  return result;
                },
                {
                  maxAttempts: merged.retryAttempts || 3,
                  retryableErrors: ['rate_limit', 'timeout', '429', '500', '502', '503', '504'],
                  initialDelayMs: 2000, // Anthropic rate limits are stricter
                  maxDelayMs: 60000,
                },
              );
            });
          },
          { ttl: merged.cacheTtl ? merged.cacheTtl * 1000 : 0 },
        );
      },
    },
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function mergeParams(
  params: any,
  defaults?: Partial<LLMRequestOptions>,
  provider: 'openai' | 'anthropic' = 'openai',
): any {
  // Determine app type from context (can be overridden)
  let appType: AppType = 'default';

  if (params.temperature !== undefined) {
    if (params.temperature < 0.4) appType = 'financial';
    else if (params.temperature > 0.75) appType = 'social';
    else if (params.max_tokens && params.max_tokens > 3000) appType = 'coding';
    else if (params.model?.includes('mini')) appType = 'rag';
  }

  const baseConfig = APP_TYPE_CONFIG[appType];
  const merged = { ...baseConfig, ...defaults, ...params };

  // Ensure streaming is disabled (caching requires full response)
  merged.stream = false;

  // Set sensible defaults if still missing
  if (!merged.model) {
    merged.model = appType === 'rag' || appType === 'financial' ? 'gpt-4o-mini' : 'gpt-4o';
  }

  return merged;
}

function mergeAnthropicParams(params: any, defaults?: Partial<LLMRequestOptions>): any {
  const appType = params.temperature && params.temperature > 0.6 ? 'content_generation' : 'rag';
  const baseConfig = APP_TYPE_CONFIG[appType];

  return {
    ...baseConfig,
    ...defaults,
    ...params,
    // Anthropic requires max_tokens
    max_tokens: params.max_tokens || baseConfig.max_tokens || 2000,
  };
}

function trackAPICall(provider: string, model: string, response: any, isEmbedding = false) {
  const perfMonitor = (globalThis as any).performanceMonitor;
  if (!perfMonitor) return;

  // Increment API call counter
  perfMonitor.trackMetric(`api_calls_${provider}`, 1);

  // Track tokens if available
  let tokens = 0;
  if (response.usage) {
    tokens = response.usage.total_tokens || (response.usage.input_tokens + response.usage.output_tokens);
  } else if (isEmbedding && response.data) {
    tokens = response.data.length * 1024; // Approximate
  }

  if (tokens > 0) {
    perfMonitor.trackMetric(`tokens_${provider}`, tokens);

    // Track cost (approximate)
    const cost = estimateCost(provider, model, tokens);
    if (cost > 0) {
      perfMonitor.trackMetric(`cost_${provider}`, Math.round(cost * 100) / 100);
    }
  }
}

function estimateCost(provider: string, model: string, tokens: number): number {
  const per1k = getCostPer1k(provider, model);
  return (tokens / 1000) * per1k;
}

function getCostPer1k(provider: string, model: string): number {
  if (provider === 'openai') {
    if (model.includes('gpt-4o-mini')) return 0.00015; // Input
    if (model.includes('gpt-4o')) return 0.005; // Input
    if (model.includes('embedding')) return 0.00002;
    return 0.01;
  }
  if (provider === 'anthropic') {
    if (model.includes('claude-3-opus')) return 0.015;
    if (model.includes('claude-3-sonnet')) return 0.003;
    if (model.includes('claude-3-haiku')) return 0.00025;
    return 0.003;
  }
  return 0.01;
}

// Export utilities
export {
  mergeParams,
  mergeAnthropicParams,
  trackAPICall,
  estimateCost,
}

// Re-export from other modules
export { responseCache } from './cache';
export { getLLMRateLimiter, estimateChatTokens } from './rate-limiter';
export { deduplicateRequest } from './deduplicator';
export { retryWithBackoff } from './retry';
export { circuitBreakerRegistry } from './circuit-breaker';

export default {
  createOptimizedOpenAIClient,
  createOptimizedAnthropicClient,
  APP_TYPE_CONFIG,
};
