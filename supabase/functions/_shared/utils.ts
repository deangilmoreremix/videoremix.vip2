/**
 * Shared utilities for Supabase Edge Functions
 * Provides consistent error handling, CORS, and Supabase/client initialization
 *
 * Performance optimization additions:
 * - Optimized LLM client creation
 * - Cache primitives
 * - Rate limiting helpers
 */

import { OpenAI } from 'npm:openai@4.78.1';
import Anthropic from 'npm:anthropic@0.39.0';
import { createClient } from '@supabase/supabase-js';

export interface EdgeFunctionResponse {
  success: boolean;
  data?: unknown;
  error?: string;
  timestamp: string;
}

/**
 * Standard CORS headers for Edge Functions
 */
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

/**
 * Create a standardized JSON response
 */
export function jsonResponse(
  data: unknown,
  status = 200,
  headers: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json', ...headers },
  });
}

/**
 * Create an error response
 */
export function errorResponse(message: string, status = 500): Response {
  return jsonResponse(
    {
      success: false,
      error: message,
      timestamp: new Date().toISOString(),
    },
    status,
  );
}

/**
 * Initialize Supabase client with service role key
 * Use for server-side functions that need admin access
 */
export function createSupabaseAdminClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  // Note: Import via dynamic import in Deno:
  // const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.39.7');
  return {
    url: supabaseUrl,
    key: supabaseServiceKey,
    // Lazy creation: const supabase = await createSupabaseAdminClient();
  };
}

/**
 * Initialize Supabase anon client
 */
export function createSupabaseClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  return createClient(supabaseUrl, supabaseKey);
}

/**
 * Initialize optimized OpenAI client
 * Includes caching, rate limiting, circuit breaker
 */
export function createOptimizedOpenAI(apiKey?: string, appType?: 'financial' | 'content' | 'rag' | 'social') {
  // Lazy load to avoid cold start penalty
  return {
    getClient: async () => {
      if (typeof Deno === 'undefined') return null;
      try {
        const { createOptimizedOpenAIClient } = await import('../_shared/performance-clients.ts');
        return createOptimizedOpenAIClient(apiKey, appType);
      } catch (e) {
        console.warn('Failed to load optimized OpenAI client:', e);
        // Fallback to basic client
        return new OpenAI({ apiKey: apiKey || Deno.env.get('OPENAI_API_KEY') });
      }
    },
  };
}

/**
 * Initialize optimized Anthropic client
 */
export function createOptimizedAnthropic(apiKey?: string) {
  return {
    getClient: async () => {
      try {
        const { createOptimizedAnthropicClient } = await import('../_shared/performance-clients.ts');
        return createOptimizedAnthropicClient(apiKey);
      } catch (e) {
        console.warn('Failed to load optimized Anthropic client:', e);
        return new Anthropic({ apiKey: apiKey || Deno.env.get('ANTHROPIC_API_KEY') });
      }
    },
  };
}

/**
 * Parse multipart form data (for file uploads)
 * Requires: import { multipart } from "https://deno.land/x/multipart@v1.0.2/mod.ts";
 */
export async function parseFormData(req: Request): Promise<FormData> {
  const contentType = req.headers.get('content-type') || '';
  if (!contentType.includes('multipart/form-data')) {
    throw new Error('Expected multipart/form-data');
  }
  return await req.formData();
}

/**
 * Validate required environment variables
 */
export function checkEnvVars(required: string[]): void {
  const missing = required.filter((key) => !Deno.env.get(key));
  if (missing.length > 0) {
    throw new Error(`Missing environment variables: ${missing.join(', ')}`);
  }
}

/**
 * Log structured error with context
 */
export function logError(context: string, error: Error) {
  console.error(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      context,
      message: error.message,
      stack: error.stack,
    }),
  );
}

/**
 * Performance tracking decorator (for expensive operations)
 */
export function trackPerformance<T>(operationName: string, fn: () => Promise<T>): Promise<T> {
  const start = performance.now();
  return fn()
    .then((result) => {
      const duration = performance.now() - start;
      console.log(`⚡ ${operationName}: ${duration.toFixed(2)}ms`);
      return result;
    })
    .catch((error) => {
      const duration = performance.now() - start;
      console.error(`❌ ${operationName} failed after ${duration.toFixed(2)}ms:`, error);
      throw error;
    });
}

/**
 * Simple in-memory cache with TTL
 * For when Redis is not available
 */
export class SimpleCache<T = any> {
  private cache = new Map<string, { value: T; expires: number }>();

  get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expires) {
      this.cache.delete(key);
      return null;
    }
    return entry.value;
  }

  set(key: string, value: T, ttlMs: number = 300000): void {
    this.cache.set(key, { value, expires: Date.now() + ttlMs });
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }
}

// Global simple cache instance for edge function context
export const simpleCache = new SimpleCache();

/**
 * Standard CORS headers for Edge Functions
 */
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

/**
 * Create a standardized JSON response
 */
export function jsonResponse(
  data: unknown,
  status = 200,
  headers: Record<string, string> = {}
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json', ...headers },
  });
}

/**
 * Create an error response
 */
export function errorResponse(message: string, status = 500): Response {
  return jsonResponse(
    {
      success: false,
      error: message,
      timestamp: new Date().toISOString(),
    },
    status
  );
}

/**
 * Initialize Supabase client with service role key
 * Use for server-side functions that need admin access
 */
export function createSupabaseAdminClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  return new URL('https://esm.sh/@supabase/supabase-js@2.39.7').toString();
  // Usage: const supabase = createSupabaseClient();
}

/**
 * Initialize OpenAI client (Deno-compatible via npm specifier)
 */
export function createOpenAIClient() {
  const apiKey = Deno.env.get('OPENAI_API_KEY');
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not set');
  }
  return {
    // Will be imported dynamically in function
    client: null,
    init() {
      // Dynamic import to avoid cold start penalty if not used
    },
  };
}

/**
 * Parse multipart form data (for file uploads)
 * Requires: import { multipart } from "https://deno.land/x/multipart@v1.0.2/mod.ts";
 */
export async function parseFormData(req: Request): Promise<FormData> {
  const contentType = req.headers.get('content-type') || '';
  if (!contentType.includes('multipart/form-data')) {
    throw new Error('Expected multipart/form-data');
  }
  // Use Deno's built-in formData parsing
  return await req.formData();
}

/**
 * Validate required environment variables
 */
export function checkEnvVars(required: string[]): void {
  const missing = required.filter((key) => !Deno.env.get(key));
  if (missing.length > 0) {
    throw new Error(`Missing environment variables: ${missing.join(', ')}`);
  }
}

/**
 * Log structured error with context (won't show in production logs unless debugging)
 */
export function logError(context: string, error: Error) {
  console.error(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      context,
      message: error.message,
      stack: error.stack,
    })
  );
}
