// supabase/functions/_shared/agentos-errors.ts
//
// Shared response helpers for the AgentOS edge functions.
//
// Every AgentOS endpoint speaks the same envelope: { data } on success and
// { error: { code, message } } on failure. HTTP status codes are derived from
// the envelope code so the frontend can map them without string matching.

import { corsHeaders } from './cors.ts';

export type ErrorCode =
  | 'unauthenticated'
  | 'forbidden'
  | 'not_found'
  | 'validation'
  | 'conflict'
  | 'out_of_credits'
  | 'not_configured'
  | 'unsupported'
  | 'timeout'
  | 'internal';

const STATUS_BY_CODE: Record<ErrorCode, number> = {
  unauthenticated: 401,
  forbidden: 403,
  not_found: 404,
  validation: 400,
  conflict: 409,
  out_of_credits: 402,
  not_configured: 503,
  unsupported: 501,
  timeout: 504,
  internal: 500,
};

export interface ApiEnvelope<T> {
  data?: T;
  error?: { code: ErrorCode; message: string; detail?: string };
}

export function jsonResponse<T>(status: number, body: ApiEnvelope<T>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

export function ok<T>(data: T): Response {
  return jsonResponse(200, { data });
}

export function fail(
  code: ErrorCode,
  message: string,
  detail?: string,
): Response {
  return jsonResponse(STATUS_BY_CODE[code], {
    error: { code, message, ...(detail ? { detail } : {}) },
  });
}

export function methodNotAllowed(method: string): Response {
  return fail('validation', `Unsupported method: ${method}`);
}

/**
 * Parse a JSON request body, returning a typed validation error rather than
 * throwing on malformed input.
 */
export async function readJsonBody<T = Record<string, unknown>>(
  req: Request,
): Promise<{ ok: true; body: T } | { ok: false; response: Response }> {
  try {
    const body = (await req.json()) as T;
    if (body === null || typeof body !== 'object') {
      return { ok: false, response: fail('validation', 'Request body must be a JSON object') };
    }
    return { ok: true, body };
  } catch (_err) {
    return { ok: false, response: fail('validation', 'Request body is not valid JSON') };
  }
}

/**
 * Wrap a handler so an unexpected throw becomes a 500 envelope instead of an
 * unstructured stack trace leaking to the client.
 *
 * WHY THE HANDLER TAKES NO ARGUMENT
 *   The guard is invoked as `withErrorGuard(async () => { ... })` inside the
 *   Deno.serve callback, where the request is already in scope. Typing the
 *   parameter as a Request would make every call site a type error.
 */
export async function withErrorGuard(
  handler: () => Promise<Response>,
): Promise<Response> {
  try {
    return await handler();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[agentos] unhandled error:', message);
    return fail('internal', 'Unexpected server error', message);
  }
}
