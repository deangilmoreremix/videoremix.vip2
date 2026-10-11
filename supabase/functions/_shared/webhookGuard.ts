// supabase/functions/_shared/webhookGuard.ts
//
// Fail-closed webhook verification for payment platforms that deliver
// events to public Edge Function URLs (Zaxxa, PayKickstart).
//
// Threat model: anyone who knows the function URL can POST a forged
// "sale.completed" payload and grant themselves app access. These guards
// make that impossible unless the sender knows the shared secret that is
// configured as a Supabase Edge Function secret.
//
// Design rules enforced here:
//   1. FAIL CLOSED. If the expected secret is not configured, or the request
//      carries no recognizable secret header, the request is rejected. A
//      missing/misconfigured secret must never silently allow traffic.
//   2. CONSTANT-TIME COMPARISON. The presented secret is compared to the
//      configured secret with a length-independent, timing-safe comparison so
//      an attacker cannot recover the secret byte-by-byte from response
//      timing.
//   3. IDEMPOTENCY. Webhook providers retry aggressively. Before processing,
//      callers check webhook_logs for an already-processed event id so a
//      replayed delivery cannot double-grant access or double-charge.

const encoder = new TextEncoder();

/** Candidate headers a platform may use to deliver its shared secret. */
export const WEBHOOK_SECRET_HEADERS = [
  'x-webhook-secret',
  'x-zaxxa-signature',
  'x-zaxxa-secret',
  'x-paykickstart-signature',
  'x-paykickstart-secret',
  'x-hub-signature-256',
] as const;

/**
 * Timing-safe string comparison.
 *
 * Always inspects every byte of both inputs (no early return on mismatch) and
 * treats different lengths as a mismatch without revealing the expected
 * length through timing.
 */
export function constantTimeEqual(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') return false;

  const aBytes = encoder.encode(a);
  const bBytes = encoder.encode(b);

  // Compare lengths in constant time relative to the longer input so the
  // result does not leak the configured secret's length.
  const maxLen = Math.max(aBytes.length, bBytes.length);
  let diff = aBytes.length === bBytes.length ? 0 : 1;

  for (let i = 0; i < maxLen; i++) {
    const aByte = i < aBytes.length ? aBytes[i] : 0;
    const bByte = i < bBytes.length ? bBytes[i] : 0;
    diff |= aByte ^ bByte;
  }

  return diff === 0;
}

/**
 * Extract the presented webhook secret from a request.
 *
 * Accepts any of the known secret headers, a `Authorization: Bearer <secret>`
 * header, or a `?secret=` / `?token=` query parameter (some platforms only
 * support query-string secrets for outgoing webhooks).
 */
export function extractWebhookSecret(req: Request): string | null {
  for (const header of WEBHOOK_SECRET_HEADERS) {
    const value = req.headers.get(header);
    if (value) {
      // Support "sha256=<hex>" style values by taking the last segment.
      const trimmed = value.trim();
      const hexMatch = trimmed.match(/^sha256=([a-fA-F0-9]+)$/);
      return hexMatch ? hexMatch[1] : trimmed;
    }
  }

  const auth = req.headers.get('authorization');
  if (auth?.toLowerCase().startsWith('bearer ')) {
    return auth.slice(7).trim();
  }

  try {
    const url = new URL(req.url);
    const querySecret = url.searchParams.get('secret') ?? url.searchParams.get('token');
    if (querySecret) return querySecret.trim();
  } catch {
    // Malformed URL: nothing to extract.
  }

  return null;
}

export interface WebhookSecretCheck {
  ok: boolean;
  reason?: 'secret_not_configured' | 'missing_secret' | 'invalid_secret';
}

/**
 * Fail-closed verification of a platform webhook request.
 *
 * - Returns `{ ok: false, reason: 'secret_not_configured' }` when the server
 *   has no configured secret. The caller must reject the request: an open
 *   webhook is an access-granting vulnerability.
 * - Returns `{ ok: false, reason: 'missing_secret' }` when the request
 *   presented nothing.
 * - Returns `{ ok: false, reason: 'invalid_secret' }` on mismatch.
 */
export function verifyWebhookSecret(
  req: Request,
  expectedSecret: string | undefined | null,
): WebhookSecretCheck {
  if (!expectedSecret || expectedSecret.trim().length === 0) {
    // Fail closed: misconfigured server must not accept unauthenticated traffic.
    return { ok: false, reason: 'secret_not_configured' };
  }

  const presented = extractWebhookSecret(req);
  if (!presented) {
    return { ok: false, reason: 'missing_secret' };
  }

  if (!constantTimeEqual(presented, expectedSecret)) {
    return { ok: false, reason: 'invalid_secret' };
  }

  return { ok: true };
}

/** Candidate payload fields that may carry a stable event identifier. */
const EVENT_ID_FIELDS = [
  'event_id',
  'eventId',
  'transaction_id',
  'order_id',
  'id',
] as const;

/** Extract a stable event identifier (and its field name) from a webhook payload. */
export function extractEventId(payload: any): { id: string; field: string } | null {
  if (!payload || typeof payload !== 'object') return null;

  for (const field of EVENT_ID_FIELDS) {
    const value = payload[field];
    if (value === undefined || value === null) continue;
    const id = String(value);
    if (id.length > 0) return { id, field };
  }

  const data = payload.data;
  if (data && typeof data === 'object') {
    for (const field of EVENT_ID_FIELDS) {
      const value = data[field];
      if (value === undefined || value === null) continue;
      const id = String(value);
      if (id.length > 0) return { id, field };
    }
  }

  return null;
}

export interface DuplicateCheck {
  duplicate: boolean;
  logId?: string;
  reason?: string;
}

/**
 * Idempotency check backed by webhook_logs.
 *
 * Returns `{ duplicate: true }` when a webhook_logs row already records this
 * platform + event id as processed (or currently processing). Callers must
 * skip processing in that case so retried deliveries cannot double-grant
 * entitlements.
 *
 * Any Supabase error is reported via `reason`; callers should treat an
 * indeterminate result conservatively (process once, guarded by the unique
 * constraint on purchases) rather than silently skipping.
 */
export async function checkWebhookProcessed(
  supabase: any,
  platform: string,
  payload: any,
): Promise<DuplicateCheck> {
  const event = extractEventId(payload);
  if (!event) {
    return { duplicate: false };
  }

  try {
    const { data, error } = await supabase
      .from('webhook_logs')
      .select('id, processing_status')
      .eq('platform', platform)
      .contains('webhook_payload', { [event.field]: event.id })
      .in('processing_status', ['processed', 'pending'])
      .limit(1);

    if (error) {
      return { duplicate: false, reason: error.message };
    }

    if (data && data.length > 0) {
      return { duplicate: true, logId: data[0].id };
    }

    return { duplicate: false };
  } catch (err: any) {
    return { duplicate: false, reason: err?.message ?? 'unknown_error' };
  }
}
