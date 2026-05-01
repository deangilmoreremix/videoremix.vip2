/**
 * Shared utilities for Supabase Edge Functions
 * Provides consistent error handling, CORS, and Supabase client initialization
 */

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
