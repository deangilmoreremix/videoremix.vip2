// supabase/functions/_shared/webhookGuard.ts
//
// Fail-closed verification primitives for the payment webhook Edge Functions
// (Zaxxa ZPN, PayKickstart IPN).
//
// THREAT MODEL
// These Edge Function URLs are public and unauthenticated. Anyone who learns
// the URL can POST a forged "sale completed" body and grant themselves app
// access. Every grant therefore has to be gated by a cryptographic check that
// only the payment platform can satisfy.
//
// WHY THERE IS NO GENERIC "WEBHOOK SECRET HEADER"
// The previous revision of this module assumed every platform delivers its
// shared secret in a request header (`x-webhook-secret`, `Authorization:
// Bearer`, `?secret=...`). Research of the actual provider specifications
// showed that NEITHER platform does that, and neither one even uses an
// HMAC-over-the-raw-body scheme:
//
//   * Zaxxa (Zaxaa) ZPN posts an `application/x-www-form-urlencoded` body and
//     carries a `hash_key` field computed as
//     `UPPER(MD5(seller_id + api_signature + trans_receipt + trans_amount))`.
//     No timestamp is signed, no header is sent.
//   * PayKickstart IPN posts an `application/x-www-form-urlencoded` body and
//     carries a `hash` field computed as a per-campaign HMAC-SHA1 over the
//     sorted, filtered, pipe-joined form values. No header is sent.
//
// A generic header check would therefore have rejected 100% of legitimate
// deliveries (a silent outage of every automated grant) while still being
// trivially bypassable by anyone who set a matching query parameter. The
// header-based API (`verifyWebhookSecret` / `extractWebhookSecret` /
// `WEBHOOK_SECRET_HEADERS`) has been removed. Provider modules now own the
// signature construction; this module owns only the pieces that must be
// identical everywhere:
//
//   1. FAIL CLOSED. If the expected secret is not configured, or the payload
//      carries no verifiable signature, the request is rejected. A missing or
//      misconfigured secret must never silently allow traffic.
//   2. CONSTANT-TIME COMPARISON. Presented digests are compared to expected
//      digests with a length-independent, timing-safe comparison.
//   3. REPLAY DEFENCE. Where the platform signs a timestamp, deliveries
//      outside the replay window are rejected. Where it does not (Zaxxa),
//      replay is bounded by exactly-once event claiming instead.
//   4. EXACTLY-ONCE PROCESSING. Deliveries are claimed through webhook_logs
//      before any grant happens, so a platform retry cannot double-grant.
//   5. NO SECRETS IN LOGS. Handlers log reasons, event types and receipt /
//      transaction ids only. tests/webhook-*.test.ts enforce this by grepping
//      every log line and the webhook_logs payload for the test secrets.

const encoder = new TextEncoder();

/* -------------------------------------------------------------------------- */
/* Comparison                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Timing-safe string comparison.
 *
 * Always inspects every byte of both inputs (no early return on mismatch) and
 * treats different lengths as a mismatch without revealing the expected length
 * through timing.
 */
export function constantTimeEqual(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') return false;

  const aBytes = encoder.encode(a);
  const bBytes = encoder.encode(b);

  // Compare lengths in constant time relative to the longer input so the
  // result does not leak the expected value's length.
  const maxLen = Math.max(aBytes.length, bBytes.length);
  let diff = aBytes.length === bBytes.length ? 0 : 1;

  for (let i = 0; i < maxLen; i++) {
    const aByte = i < aBytes.length ? aBytes[i] : 0;
    const bByte = i < bBytes.length ? bBytes[i] : 0;
    diff |= aByte ^ bByte;
  }

  return diff === 0;
}

/** Lowercase hex encoding of a byte array. */
export function toHex(bytes: Uint8Array): string {
  let out = '';
  for (const byte of bytes) out += byte.toString(16).padStart(2, '0');
  return out;
}

/* -------------------------------------------------------------------------- */
/* Digests                                                                    */
/* -------------------------------------------------------------------------- */

// Zaxxa's ZPN spec uses raw MD5, so MD5 has to be implemented without pulling
// in a remote module (Deno URL imports cannot be loaded by the vitest suite).
// RFC 1321, operating on UTF-8 bytes the way the platform's own PHP/Java
// sample listeners do (`md5($sellerId . $signature . $receipt . $amount)` /
// `getBytes()` of the concatenated string).

const MD5_SHIFT = [
  7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
  5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
  4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
  6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21,
];

const MD5_K = new Uint32Array(64);
for (let i = 0; i < 64; i++) {
  MD5_K[i] = Math.floor(Math.abs(Math.sin(i + 1)) * 0x100000000);
}

function md5(input: Uint8Array): Uint8Array {
  const messageBits = input.length * 8;
  // 1 byte padding marker + 8 byte length + enough to fill the 64 byte block.
  const padded = new Uint8Array((((input.length + 8) >> 6) << 6) + 64);
  padded.set(input);
  padded[input.length] = 0x80;

  const view = new DataView(padded.buffer);
  view.setUint32(padded.length - 8, messageBits >>> 0, true);
  view.setUint32(padded.length - 4, Math.floor(messageBits / 0x100000000), true);

  let a0 = 0x67452301;
  let b0 = 0xefcdab89;
  let c0 = 0x98badcfe;
  let d0 = 0x10325476;

  for (let offset = 0; offset < padded.length; offset += 64) {
    const block = new Uint32Array(16);
    for (let i = 0; i < 16; i++) block[i] = view.getUint32(offset + i * 4, true);

    let a = a0;
    let b = b0;
    let c = c0;
    let d = d0;

    for (let i = 0; i < 64; i++) {
      let f: number;
      let g: number;
      if (i < 16) {
        f = (b & c) | (~b & d);
        g = i;
      } else if (i < 32) {
        f = (d & b) | (~d & c);
        g = (5 * i + 1) % 16;
      } else if (i < 48) {
        f = b ^ c ^ d;
        g = (3 * i + 5) % 16;
      } else {
        f = c ^ (b | ~d);
        g = (7 * i) % 16;
      }

      f = (f + a + MD5_K[i] + block[g]) >>> 0;
      a = d;
      d = c;
      c = b;
      b = (b + (((f << MD5_SHIFT[i]) | (f >>> (32 - MD5_SHIFT[i]))) >>> 0)) >>> 0;
    }

    a0 = (a0 + a) >>> 0;
    b0 = (b0 + b) >>> 0;
    c0 = (c0 + c) >>> 0;
    d0 = (d0 + d) >>> 0;
  }

  const digest = new Uint8Array(16);
  const digestView = new DataView(digest.buffer);
  digestView.setUint32(0, a0, true);
  digestView.setUint32(4, b0, true);
  digestView.setUint32(8, c0, true);
  digestView.setUint32(12, d0, true);
  return digest;
}

/** Hex MD5 of the UTF-8 encoding of `input` (Zaxxa ZPN `hash_key`). */
export function md5Hex(input: string): string {
  return toHex(md5(encoder.encode(input)));
}

/**
 * Hex HMAC of a raw byte message keyed with `secret`.
 *
 * Uses WebCrypto (`crypto.subtle`), which is available in both the Deno edge
 * runtime and the Node test runner, so verification code runs identically in
 * production and under test.
 */
export async function hmacBytesHex(
  algorithm: 'SHA-1' | 'SHA-256',
  secret: string,
  message: Uint8Array,
): Promise<string> {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) {
    throw new Error('WebCrypto subtle is unavailable; cannot compute an HMAC');
  }

  const key = await subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: algorithm },
    false,
    ['sign'],
  );
  const signature = await subtle.sign('HMAC', key, message as unknown as ArrayBuffer);
  return toHex(new Uint8Array(signature));
}

/* -------------------------------------------------------------------------- */
/* Body parsing                                                               */
/* -------------------------------------------------------------------------- */

/**
 * A flat map of the form/JSON fields a webhook delivered.
 *
 * Bracket notation (`products[0][prod_number]`) is expanded into nested
 * objects/arrays so consumers can read structured values the same way the
 * platform's own PHP listeners read them out of `$_POST`.
 */
export type WebhookFields = Record<string, unknown>;

/** Values PHP's `array_filter`/`empty()` treats as "not present". */
function isEmptyForHash(value: unknown): boolean {
  if (value === null || value === undefined || value === false) return true;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed === '' || trimmed === '0';
  }
  if (typeof value === 'number') return value === 0;
  // A nested object can never have been signed by the reference algorithm
  // (PHP's `trim()` rejects an array in PHP 8), so it is dropped rather than
  // rendered into some arbitrary string. Arrays are kept and comma-joined,
  // which is what the documented JavaScript reference implementation does.
  if (typeof value === 'object' && !Array.isArray(value)) return true;
  return false;
}

/**
 * Render a form value the way the documented reference implementations do.
 *
 * `mode: 'php'` reproduces PayKickstart's PHP sample listener
 * (`iconv("UTF-8", "ISO-8859-1//IGNORE", $value)`: Latin-1 characters keep
 * their byte value, anything above U+00FF is dropped).
 * `mode: 'ascii'` reproduces the Python sample listener's `cleanString()`
 * (every code point >= U+0080 is dropped).
 *
 * The two published reference implementations disagree on Latin-1 supplement
 * characters, so the verifier accepts a digest computed under either rule.
 * Both require the campaign secret, so accepting both does not widen what an
 * attacker can do.
 */
export function encodeFieldValue(value: string, mode: 'php' | 'ascii'): Uint8Array {
  const bytes: number[] = [];
  for (const char of value) {
    const codePoint = char.codePointAt(0) ?? 0;
    if (mode === 'ascii') {
      if (codePoint < 0x80) bytes.push(codePoint);
      continue;
    }
    if (codePoint <= 0xff) bytes.push(codePoint);
  }
  return new Uint8Array(bytes);
}

/** PHP `trim()`/JavaScript `trim()` equivalence is close enough for ASCII. */
function normalizeHashValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value.trim();
  if (Array.isArray(value)) return value.map((v) => String(v)).join(',');
  return String(value);
}

/**
 * Build the canonical byte string PayKickstart's IPN validation function hashes.
 *
 * Faithful to the published PHP reference:
 *   1. drop the `hash` and `verification_code` fields
 *   2. trim every value and drop the ones that are empty afterwards
 *   3. sort the survivors by key (string comparison)
 *   4. join the values with `|`
 *
 * The result is a byte string, not UTF-8 text: `mode: 'php'` reproduces the PHP
 * sample listener's `iconv("UTF-8", "ISO-8859-1//IGNORE", $value)` (Latin-1
 * characters keep their byte value, anything above U+00FF is dropped) while
 * `mode: 'ascii'` reproduces the Python sample listener's `cleanString()` (every
 * code point >= U+0080 is dropped). The two published reference
 * implementations disagree on Latin-1 supplement characters, so the verifier
 * accepts a digest computed under either rule; both require the campaign
 * secret, so accepting both does not widen what an attacker can do.
 */
export function buildPaykickstartCanonical(
  fields: WebhookFields,
  mode: 'php' | 'ascii',
): Uint8Array {
  const excluded = new Set(['hash', 'verification_code']);

  const kept = Object.keys(fields)
    .filter((key) => !excluded.has(key))
    .map((key) => ({ key, value: fields[key] }))
    .filter((entry) => !isEmptyForHash(entry.value))
    .map((entry) => ({ key: entry.key, text: normalizeHashValue(entry.value) }))
    .sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0));

  const parts = kept.map((entry) => encodeFieldValue(entry.text, mode));
  const total = parts.reduce((sum, part) => sum + part.length + 1, 0);
  const message = new Uint8Array(Math.max(0, total - 1));
  let cursor = 0;
  for (let i = 0; i < parts.length; i++) {
    if (i > 0) message[cursor++] = 0x7c; // '|'
    message.set(parts[i], cursor);
    cursor += parts[i].length;
  }
  return message;
}

/**
 * Parse an `application/x-www-form-urlencoded` body into fields.
 *
 * Repeated keys become arrays, and `name[index][sub]` becomes nested
 * structures, matching how PHP's `$_POST` would present the same body.
 */
export function parseUrlencodedBody(raw: string): WebhookFields {
  const root: Record<string, unknown> = {};
  const params = new URLSearchParams(raw);

  for (const [rawKey, value] of params) {
    // `name[]` appends to a list; `name[i]` writes index i.
    const appends = rawKey.endsWith('[]');
    const key = appends ? rawKey.slice(0, -2) : rawKey;
    assignBracketPath(root, key, value, appends);
  }

  return root;
}

function assignBracketPath(
  root: Record<string, unknown>,
  key: string,
  value: string,
  append = false,
): void {
  const path = parseBracketKey(key);
  if (path.length === 0) return;

  let cursor: Record<string, unknown> | unknown[] = root;
  for (let i = 0; i < path.length - 1; i++) {
    const segment = path[i];
    const nextSegment = path[i + 1];
    const wantArray = typeof nextSegment === 'number';
    const index = typeof segment === 'number' ? segment : (segment as string);

    const container = cursor as Record<string | number, unknown>;
    const existing = container[index];
    if (existing === undefined || existing === null || typeof existing !== 'object') {
      container[index] = wantArray ? [] : {};
    }
    cursor = container[index] as Record<string, unknown> | unknown[];
  }

  const last = path[path.length - 1];
  const container = cursor as Record<string | number, unknown>;
  const existing = container[last];

  if (append) {
    const list = Array.isArray(existing) ? existing : [];
    list.push(value);
    container[last] = list;
    return;
  }

  if (existing === undefined) {
    container[last] = value;
  } else if (Array.isArray(existing)) {
    existing.push(value);
  } else {
    container[last] = [existing, value];
  }
}

/** Parse `a`, `a[]`, `a[0]`, `a[0][b]` into a segment path. */
function parseBracketKey(key: string): Array<string | number> {
  const open = key.indexOf('[');
  if (open === -1) return [key];

  const name = key.slice(0, open);
  if (!name) return [];

  const path: Array<string | number> = [name];
  const rest = key.slice(open);
  const matcher = /\[([^\]]*)\]/g;
  let match: RegExpExecArray | null;
  while ((match = matcher.exec(rest)) !== null) {
    const inner = match[1].trim();
    path.push(inner === '' ? 0 : /^\d+$/.test(inner) ? Number(inner) : inner);
  }
  return path;
}

export interface ParsedWebhookBody {
  fields: WebhookFields;
  raw: string;
}

/**
 * Read a webhook body without ever letting a parse failure crash the handler.
 *
 * Both platforms post form-urlencoded data. JSON is accepted as well so that
 * hand-written replays and provider sandbox modes keep working, but the
 * provider digest check is still the only thing that authorises a grant.
 */
export async function readWebhookBody(req: Request): Promise<ParsedWebhookBody> {
  const raw = await req.text();
  const contentType = (req.headers.get('content-type') ?? '').toLowerCase();

  if (contentType.includes('json')) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return { fields: parsed as WebhookFields, raw };
      }
    } catch {
      // Fall through to the form parser.
    }
  }

  return { fields: parseUrlencodedBody(raw), raw };
}

/* -------------------------------------------------------------------------- */
/* Timestamp / replay window                                                  */
/* -------------------------------------------------------------------------- */

/** Parse a unix-seconds timestamp. Returns null when absent or unparseable. */
export function parseUnixSeconds(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!/^\d+$/.test(trimmed)) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

export interface ReplayCheck {
  ok: boolean;
  ageSeconds?: number;
  reason?: 'missing_timestamp' | 'malformed_timestamp' | 'outside_window';
}

/**
 * Reject deliveries whose signed timestamp is outside the replay window.
 *
 * Only meaningful when the timestamp is covered by the signature. PayKickstart
 * signs `transaction_time`, so a stale delivery cannot be replayed; Zaxxa signs
 * no timestamp at all, so Zaxxa relies on exactly-once claiming instead.
 *
 * `maxAgeMinutes <= 0` disables the check entirely.
 */
export function checkReplayWindow(
  eventSeconds: number | null,
  nowSeconds: number,
  maxAgeMinutes: number,
): ReplayCheck {
  if (maxAgeMinutes <= 0) return { ok: true };
  if (eventSeconds === null) return { ok: false, reason: 'missing_timestamp' };

  const ageSeconds = nowSeconds - eventSeconds;
  if (!Number.isFinite(ageSeconds) || ageSeconds < 0 || ageSeconds > maxAgeMinutes * 60) {
    return { ok: false, reason: 'outside_window', ageSeconds };
  }
  return { ok: true, ageSeconds };
}

/* -------------------------------------------------------------------------- */
/* Exactly-once event claiming                                                */
/* -------------------------------------------------------------------------- */

export interface WebhookEventRef {
  platform: string;
  /**
   * Composite identifier used for logging, e.g. `sales:PK-TN0LNO7XWR`.
   * Providers fire several event types for a single charge, so the event type
   * has to be part of the key or the second notification would be discarded.
   */
  eventId: string | null;
  /** Fields that must appear together in `webhook_payload` to identify a row. */
  match: Record<string, string>;
  eventType: string;
  payload: Record<string, unknown>;
}

export interface WebhookClaim {
  duplicate: boolean;
  logId?: string;
  /** Populated when the claim could not be made cleanly. */
  reason?: string;
}

function isUniqueViolation(error: any): boolean {
  if (error?.code === '23505') return true;
  return (
    typeof error?.message === 'string' &&
      /duplicate key value violates unique constraint|unique constraint/i.test(error.message)
  );
}

async function findLoggedEvent(
  supabase: any,
  ref: WebhookEventRef,
): Promise<{ id: string } | null> {
  if (Object.keys(ref.match).length === 0) return null;

  // One containment probe for the whole match object: `webhook_payload @>
  // '{"transaction_id":"...","event":"..."}'`. Applied in a single call rather
  // than chained, so the query never depends on a builder round-tripping its
  // own methods.
  const { data, error } = await supabase
    .from('webhook_logs')
    .select('id')
    .eq('platform', ref.platform)
    .contains('webhook_payload', ref.match)
    .limit(1);

  if (error || !data || data.length === 0) return null;
  return { id: data[0].id as string };
}

/**
 * Claim a delivery for processing, or detect that it was already claimed.
 *
 * Insert-or-detect: the caller inserts a `pending` webhook_logs row and treats
 * a unique violation (Postgres `23505`) as proof that a concurrent delivery
 * already claimed the same event. Without the unique index the insert-succeeds
 * branch is taken, which is why entitlement grants must additionally be
 * guarded by `purchases UNIQUE (platform, platform_transaction_id)` (see
 * `_shared/purchaseProcessor.ts`, which re-checks for an existing purchase
 * before granting).
 *
 * A database failure here is reported via `reason` and never treated as a
 * duplicate, so a transient outage cannot be used to skip a real delivery.
 */
export async function claimWebhookEvent(
  supabase: any,
  ref: WebhookEventRef,
): Promise<WebhookClaim> {
  if (!ref.eventId) {
    return { duplicate: false, reason: 'no_event_id' };
  }

  try {
    const existing = await findLoggedEvent(supabase, ref);
    if (existing) {
      return { duplicate: true, logId: existing.id };
    }

    const { data, error } = await supabase
      .from('webhook_logs')
      .insert({
        platform: ref.platform,
        // Required by the webhook_logs_provider_event_key unique index
        // (20261011170000_webhook_logs_event_key.sql) so concurrent duplicate
        // deliveries collide on the key instead of double-processing.
        event_id: ref.eventId,
        event_type: ref.eventType,
        webhook_payload: ref.payload,
        processing_status: 'pending',
      })
      .select('id')
      .maybeSingle();

    if (error) {
      if (isUniqueViolation(error)) {
        // A concurrent delivery won the race for this event id.
        const raced = await findLoggedEvent(supabase, ref);
        return { duplicate: true, logId: raced?.id, reason: 'concurrent_claim' };
      }
      return { duplicate: false, reason: error.message ?? 'insert_failed' };
    }

    return { duplicate: false, logId: data?.id as string | undefined };
  } catch (err: any) {
    return { duplicate: false, reason: err?.message ?? 'unknown_error' };
  }
}

/** Record the terminal state of a claimed delivery. Never throws. */
export async function finalizeWebhookEvent(
  supabase: any,
  webhookLogId: string | undefined,
  status: 'processed' | 'failed',
  errorMessage?: string,
): Promise<void> {
  if (!webhookLogId) return;

  try {
    await supabase
      .from('webhook_logs')
      .update({
        processing_status: status,
        processed_at: new Date().toISOString(),
        ...(errorMessage ? { error_message: errorMessage.slice(0, 500) } : {}),
      })
      .eq('id', webhookLogId);
  } catch {
    // Audit bookkeeping must never break the grant path.
  }
}
