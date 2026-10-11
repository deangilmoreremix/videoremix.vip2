// supabase/functions/webhook-paykickstart/verify.ts
//
// PayKickstart Instant Payment Notification (IPN) verification — provider-correct.
//
// SOURCES (verified 2026-10-11)
//   * "API Reference / Instant Payment Notification / IPN POST" —
//     https://docs.paykickstart.com/
//     Documents the delivery format, the full event list, every payload field,
//     the `hash` field ("This is a hashed security key that can be used to
//     validate that the IPN POST received is in fact valid / verified") and the
//     "IPN Validation Function" in PHP, JS and Python.
//   * "Using the Product IPN URL Field" —
//     https://support.paykickstart.com/articles/5892063-using-the-product-ipn-url-field
//     Documents that the secret key is PER CAMPAIGN, so a single static secret
//     only verifies one campaign and integrations must resolve the secret from
//     the incoming `campaign_id`.
//
// CONFIRMED MECHANISM (from the published IPN Validation Function)
//   PayKickstart posts `application/x-www-form-urlencoded` to the product's IPN
//   URL. The body carries a `hash` field. To verify:
//
//     1. take `hash` as the presented digest
//     2. delete `hash` and `verification_code` from the data
//     3. trim every value and drop the empty ones (PHP array_filter also drops
//        "0" and 0; the JS and Python samples do the same)
//     4. sort the survivors by key
//     5. join the values with "|"
//     6. HMAC-SHA1 that string with the campaign's secret key and compare
//
//   There is no signature header. `transaction_time` IS one of the signed
//   values, so the replay window enforced here is cryptographically bound to
//   the signature — unlike Zaxxa, which signs no timestamp at all.

import {
  WebhookFields,
  buildPaykickstartCanonical,
  constantTimeEqual,
  hmacBytesHex,
} from '../_shared/webhookGuard.ts';
import type { ProcessedPurchase } from '../_shared/purchaseProcessor.ts';

export const PAYKICKSTART_PLATFORM = 'paykickstart';

/** Every IPN event PayKickstart documents. */
export const PAYKICKSTART_EVENTS = [
  'sales',
  'refund',
  'subscription-payment',
  'subscription-created',
  'subscription-cancelled',
  'subscription-completed',
  'subscription-trial-start',
  'subscription-trial-end',
  'subscription-payment-failed',
  'subscription-pending-cancelation',
  'subscription-pending-cancellation-revoked',
  'subscription-updated',
  'subscription-changed',
  'subscription-pause',
  'subscription-unpaused',
  'cart-abandoned',
  'trial-expiring',
  'transaction-pending',
  'subscription-reminder',
  'lead-added',
  'lead-subscribed',
  'lead-confirmed',
  'lead-buyer',
  'in_progress',
  'fulfilling',
  'shipped',
  'delivered',
  'returned',
  'refunded',
  'on_hold',
] as const;

export type PaykickstartEvent = (typeof PAYKICKSTART_EVENTS)[number];

/** Events that carry a successful charge and therefore grant entitlements. */
export const PAYKICKSTART_GRANTING_EVENTS: readonly PaykickstartEvent[] = [
  'sales',
  'subscription-created',
  'subscription-payment',
  'subscription-trial-start',
  'subscription-updated',
  'subscription-pending-cancellation-revoked',
  'subscription-unpaused',
];

/** Events that revoke an active subscription. */
export const PAYKICKSTART_CANCELLING_EVENTS: readonly PaykickstartEvent[] = [
  'subscription-cancelled',
  'subscription-pending-cancelation',
  'subscription-pause',
];

/** Events that revoke entitlements because the money went back. */
export const PAYKICKSTART_REFUNDING_EVENTS: readonly PaykickstartEvent[] = [
  'refund',
  'refunded',
];

export type PaykickstartRejectionReason =
  | 'secret_not_configured'
  | 'unknown_campaign'
  | 'malformed_payload'
  | 'missing_event'
  | 'missing_hash'
  | 'invalid_hash';

export type PaykickstartVerification =
  | { ok: true; fields: WebhookFields; event: PaykickstartEvent }
  | { ok: false; reason: PaykickstartRejectionReason; detail?: string };

/** Default replay window in minutes; 0 disables the check. */
export const DEFAULT_REPLAY_WINDOW_MINUTES = 7 * 24 * 60;

function readString(fields: WebhookFields, key: string): string | null {
  const value = fields[key];
  if (value === undefined || value === null) return null;
  if (typeof value !== 'string') return String(value);
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/** Compute every candidate PayKickstart IPN digest for a payload. */
export async function computePaykickstartHashes(
  fields: WebhookFields,
  secret: string,
): Promise<string[]> {
  const hashes: string[] = [];
  for (const mode of ['php', 'ascii'] as const) {
    const canonical = buildPaykickstartCanonical(fields, mode);
    hashes.push(await hmacBytesHex('SHA-1', secret, canonical));
  }
  return hashes;
}

/**
 * Verify a PayKickstart IPN delivery.
 *
 * Fails closed on every path: an unconfigured secret, an unknown campaign, a
 * missing `event` or `hash`, and a digest mismatch all reject the request.
 * Accepts a digest computed under either of the two published reference
 * encodings (see `buildPaykickstartCanonical`); both still require the campaign
 * secret.
 */
export async function verifyPaykickstartIpn(
  fields: WebhookFields,
  secrets: ReadonlyMap<string, string> | null,
): Promise<PaykickstartVerification> {
  if (!secrets || secrets.size === 0) {
    return { ok: false, reason: 'secret_not_configured' };
  }

  if (!fields || typeof fields !== 'object') {
    return { ok: false, reason: 'malformed_payload' };
  }

  const event = readString(fields, 'event');
  if (!event) {
    return { ok: false, reason: 'missing_event' };
  }

  if (!PAYKICKSTART_EVENTS.includes(event as PaykickstartEvent)) {
    return { ok: false, reason: 'missing_event', detail: `unknown event: ${event}` };
  }

  // PayKickstart signs a per-campaign secret, so the campaign has to be
  // resolved before the digest can be recomputed. An unknown campaign is a
  // rejection, never a fallback to some other campaign's secret.
  const campaignId = readString(fields, 'campaign_id');
  const secret = campaignId ? secrets.get(campaignId) : undefined;
  if (!secret) {
    return { ok: false, reason: 'unknown_campaign', detail: `campaign_id: ${campaignId ?? 'absent'}` };
  }

  const presented = readString(fields, 'hash') ?? readString(fields, 'verification_code');
  if (!presented) {
    return { ok: false, reason: 'missing_hash' };
  }

  const candidates = await computePaykickstartHashes(fields, secret);
  const matches = candidates.some((candidate) => constantTimeEqual(candidate, presented.toLowerCase()));

  if (!matches) {
    return { ok: false, reason: 'invalid_hash' };
  }

  return { ok: true, fields, event: event as PaykickstartEvent };
}

/* -------------------------------------------------------------------------- */
/* Secret resolution                                                          */
/* -------------------------------------------------------------------------- */

/**
 * Build the campaign -> secret map from the configured secrets.
 *
 * `PAYKICKSTART_WEBHOOK_SECRETS` is a JSON object of `{ "<campaign_id>":
 * "<secret>" }`. `PAYKICKSTART_WEBHOOK_SECRET` is a single-campaign fallback
 * for accounts that only sell through one campaign. Secret values are never
 * logged or echoed.
 */
export function buildPaykickstartSecretMap(
  secretsJson: string | undefined | null,
  fallbackSecret: string | undefined | null,
): Map<string, string> {
  const map = new Map<string, string>();

  if (secretsJson && secretsJson.trim().length > 0) {
    try {
      const parsed = JSON.parse(secretsJson);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        for (const [campaignId, secret] of Object.entries(parsed)) {
          if (typeof secret === 'string' && secret.trim().length > 0) {
            map.set(String(campaignId), secret.trim());
          }
        }
      }
    } catch {
      // A malformed secret map leaves only the fallback; it never throws into
      // the request path and never widens acceptance.
    }
  }

  if (fallbackSecret && fallbackSecret.trim().length > 0) {
    for (const campaignId of FALLBACK_CAMPAIGN_IDS) {
      if (!map.has(campaignId)) map.set(campaignId, fallbackSecret.trim());
    }
  }

  return map;
}

/**
 * Campaign ids that a bare `PAYKICKSTART_WEBHOOK_SECRET` applies to.
 *
 * Empty by default: the documented guidance is that one static secret maps to
 * one campaign, so a wildcard would let a notification from an unrelated
 * campaign verify. Operators list their real campaign ids explicitly in
 * `PAYKICKSTART_WEBHOOK_SECRETS`.
 */
export const FALLBACK_CAMPAIGN_IDS: readonly string[] = [];

/* -------------------------------------------------------------------------- */
/* Payload -> purchase mapping                                                */
/* -------------------------------------------------------------------------- */

/**
 * Composite idempotency key.
 *
 * PayKickstart fires several IPNs for one transaction (`sales` plus
 * `subscription-created`, and a new `transaction_id` for every rebill), so the
 * event type has to be part of the key.
 */
export function paykickstartEventId(fields: WebhookFields): string | null {
  const transactionId = readString(fields, 'transaction_id');
  const event = readString(fields, 'event');
  if (!transactionId) return null;
  return event ? `${event}:${transactionId}` : transactionId;
}

/** `invoice_id` is the stable purchase id across subscription rebills. */
export function paykickstartSubscriptionId(fields: WebhookFields): string | undefined {
  const invoiceId = readString(fields, 'invoice_id');
  return invoiceId ?? undefined;
}

/**
 * Map a verified IPN delivery onto the shared purchase processor's input.
 *
 * `transactionId` is PayKickstart's `transaction_id` (unique per charge), so
 * `purchases UNIQUE (platform, platform_transaction_id)` makes every grant
 * exactly-once even when the platform retries.
 *
 * `productSku` is deliberately left unset: PayKickstart sends `product_id` and
 * `product_name` but no SKU, and the numeric product id lives in a different
 * namespace from `products_catalog.sku`. Passing it through could match an
 * unrelated catalog row that happens to use a numeric SKU, so entitlement
 * matching goes through the exact-name path (`platform_product_mappings`,
 * catalog name/slug) instead.
 */
export function toProcessedPurchase(
  fields: WebhookFields,
  event: PaykickstartEvent,
): ProcessedPurchase | null {
  const email = readString(fields, 'buyer_email') ?? readString(fields, 'email');
  if (!email) return null;

  const amount = Number.parseFloat(readString(fields, 'amount') ?? '0');
  const isRebill = readString(fields, 'is_rebill') === '1';
  const isSubscription =
    event.startsWith('subscription') || isRebill || Boolean(readString(fields, 'next_billing_date'));

  const transactionTime = Number(readString(fields, 'transaction_time') ?? '');
  const purchaseDate =
    Number.isFinite(transactionTime) && transactionTime > 0
      ? new Date(transactionTime * 1000)
      : new Date();

  const transactionId = readString(fields, 'transaction_id') ?? '';

  return {
    email,
    productName: readString(fields, 'product_name') ?? 'Unknown Product',
    amount: Number.isFinite(amount) ? amount : 0,
    currency: readString(fields, 'currency') ?? 'USD',
    transactionId,
    subscriptionId: paykickstartSubscriptionId(fields),
    isSubscription,
    purchaseDate,
  };
}

/**
 * Best-effort read of `mode` (`live` | `test`).
 *
 * `mode` is signed by `hash`, so an authentic test-mode IPN really did come
 * from the vendor's PayKickstart account. It is recorded in the audit log and
 * never used as a security control.
 */
export function readPaykickstartMode(fields: WebhookFields): 'live' | 'test' | null {
  const mode = readString(fields, 'mode');
  return mode === 'live' || mode === 'test' ? mode : null;
}
