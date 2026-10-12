// supabase/functions/webhook-zaxxa/verify.ts
//
// Zaxxa (Zaxaa) ZPN verification — provider-correct.
//
// SOURCES (verified 2026-10-11)
//   * "Zaxaa Payment Notification (ZPN) Guide" — http://www.zaxaa.com/p/zpn
//     "Another important data that will be needed by your ZPN listener script is
//      your unique API Signature. Your script must use your own API signature to
//      verify the validity of the notifications." Obtained from
//     Settings -> Account Settings -> "Show API Signature".
//   * "ZPN and PDT Variables" — http://www.zaxaa.com/p/zpn-pdt-vars
//     Documents `hash_key` ("Unique key to verify the validity of the ZPN"),
//     `trans_type` (SALE | FIRST_BILL | REBILL | CANCELED | REFUND),
//     `trans_receipt`, `trans_amount`, `seller_id`, `cust_email`, and the
//     nested `products[x][...]` structure.
//   * Archived official sample listeners (the links on the ZPN guide are dead;
//     these are the Wayback captures of the same URLs):
//       http://web.archive.org/web/20200204012951/http://e526d29e057611599413-03e793fd560b09763197df610f0fba8f.r87.cf2.rackcdn.com/samples/zpn-php.txt
//       http://web.archive.org/web/20200204012951/http://e526d29e057611599413-03e793fd560b09763197df610f0fba8f.r87.cf2.rackcdn.com/samples/zpn-java.txt
//
// CONFIRMED MECHANISM (identical in the PHP and Java samples)
//   Zaxxa posts `application/x-www-form-urlencoded` to the notification handler
//   URL configured on the product. The body carries a `hash_key` field:
//
//       hash_key = UPPER(MD5(seller_id + api_signature + trans_receipt + trans_amount))
//
//   The listener recomputes that digest with its own API signature and compares
//   it to the presented `hash_key`. There is no signature header, no HMAC and
//   no signed timestamp. `trans_date` is present in the body but is NOT part of
//   the signed material, so it cannot be trusted for replay defence.

import {
  WebhookFields,
  constantTimeEqual,
  md5Hex,
} from '../_shared/webhookGuard.ts';
import type { ProcessedPurchase } from '../_shared/purchaseProcessor.ts';

export const ZAXXA_PLATFORM = 'zaxxa';

/** Transaction types Zaxxa documents for ZPN. */
export type ZaxxaTransType =
  | 'SALE'
  | 'FIRST_BILL'
  | 'REBILL'
  | 'CANCELED'
  | 'REFUND';

export const ZAXXA_TRANS_TYPES: readonly ZaxxaTransType[] = [
  'SALE',
  'FIRST_BILL',
  'REBILL',
  'CANCELED',
  'REFUND',
];

export type ZaxxaRejectionReason =
  | 'secret_not_configured'
  | 'malformed_payload'
  | 'missing_hash_key'
  | 'missing_signed_fields'
  | 'unknown_trans_type'
  | 'invalid_hash_key';

export type ZaxxaVerification =
  | { ok: true; fields: WebhookFields; transType: ZaxxaTransType }
  | { ok: false; reason: ZaxxaRejectionReason; detail?: string };

/** Fields Zaxxa includes in the signed material, extracted from the payload. */
export interface ZaxxaSignedFields {
  sellerId: string;
  transReceipt: string;
  transAmount: string;
  hashKey: string;
}

/**
 * Compute the Zaxxa ZPN `hash_key` from the signed fields.
 *
 * Digest is uppercase hex MD5 over the UTF-8 bytes of the concatenation, which
 * is what both the PHP (`strtoupper(md5(...))`) and the Java
 * (`getMD5Hash(...).toUpperCase()`) sample listeners produce.
 */
export function computeZaxxaHashKey(
  apiSignature: string,
  signed: { sellerId: string; transReceipt: string; transAmount: string },
): string {
  return md5Hex(`${signed.sellerId}${apiSignature}${signed.transReceipt}${signed.transAmount}`).toUpperCase();
}

function readString(fields: WebhookFields, key: string): string | null {
  const value = fields[key];
  if (value === undefined || value === null) return null;
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/** Pull the signed fields out of a Zaxxa ZPN body. */
export function extractZaxxaSignedFields(
  fields: WebhookFields,
): (ZaxxaSignedFields & { transType: string }) | null {
  const hashKey = readString(fields, 'hash_key');
  const sellerId = readString(fields, 'seller_id');
  const transReceipt = readString(fields, 'trans_receipt');
  const transAmount = readString(fields, 'trans_amount');
  const transType = readString(fields, 'trans_type');

  if (!hashKey || !sellerId || !transReceipt || !transAmount || !transType) return null;

  return { hashKey, sellerId, transReceipt, transAmount, transType };
}

/**
 * Verify a Zaxxa ZPN delivery.
 *
 * Fails closed on every path: an unconfigured API signature, a missing
 * `hash_key`, missing signed material, an unknown transaction type or a digest
 * mismatch all reject the request. `trans_amount` is used exactly as posted
 * (e.g. `"47.00"`) because Zaxxa hashes the raw string — re-parsing it as a
 * number would change the digest and reject every genuine delivery.
 */
export function verifyZaxxaZpn(
  fields: WebhookFields,
  apiSignature: string | undefined | null,
): ZaxxaVerification {
  if (!apiSignature || apiSignature.trim().length === 0) {
    return { ok: false, reason: 'secret_not_configured' };
  }

  if (!fields || typeof fields !== 'object') {
    return { ok: false, reason: 'malformed_payload' };
  }

  const signed = extractZaxxaSignedFields(fields);
  if (!signed) {
    const hasHashKey = readString(fields, 'hash_key') !== null;
    return {
      ok: false,
      reason: hasHashKey ? 'missing_signed_fields' : 'missing_hash_key',
      detail: 'expected hash_key, seller_id, trans_receipt, trans_amount, trans_type',
    };
  }

  const normalizedType = signed.transType.toUpperCase();
  if (!ZAXXA_TRANS_TYPES.includes(normalizedType as ZaxxaTransType)) {
    return { ok: false, reason: 'unknown_trans_type', detail: normalizedType };
  }

  const expected = computeZaxxaHashKey(apiSignature, signed);
  const presented = signed.hashKey.toUpperCase();

  if (!constantTimeEqual(presented, expected)) {
    return { ok: false, reason: 'invalid_hash_key' };
  }

  return { ok: true, fields, transType: normalizedType as ZaxxaTransType };
}

/* -------------------------------------------------------------------------- */
/* Payload -> purchase mapping                                                */
/* -------------------------------------------------------------------------- */

export interface ZaxxaProduct {
  sku: string | null;
  name: string;
  amount: number;
  paymentType: 'onetime' | 'subscription' | null;
  recurringId: string | null;
  recurringStatus: string | null;
  custom: string | null;
}

/** Read `products[x]` back out of the parsed form body. */
export function extractZaxxaProducts(fields: WebhookFields): ZaxxaProduct[] {
  const raw = (fields as any).products;
  const list: any[] = Array.isArray(raw)
    ? raw
    : raw && typeof raw === 'object'
      ? Object.values(raw)
      : [];

  return list
    .filter((entry) => entry && typeof entry === 'object')
    .map((entry) => ({
      sku: readString(entry, 'prod_number'),
      name: readString(entry, 'prod_name') ?? 'Unknown Product',
      amount: Number.parseFloat(readString(entry, 'amount') ?? '0') || 0,
      paymentType: (readString(entry, 'payment_type') as ZaxxaProduct['paymentType']) ?? null,
      recurringId: readString(entry, 'recurring_id'),
      recurringStatus: readString(entry, 'recurring_status'),
      custom: readString(entry, 'custom'),
    }));
}

/** Composite idempotency key: the receipt number is unique per charge. */
export function zaxxaEventId(fields: WebhookFields): string | null {
  const receipt = readString(fields, 'trans_receipt');
  const type = readString(fields, 'trans_type');
  if (!receipt) return null;
  return type ? `${type.toUpperCase()}:${receipt}` : receipt;
}

/**
 * Map a verified ZPN delivery onto the shared purchase processor's input.
 *
 * `transactionId` is the Zaxxa receipt number, which is unique per charge, so
 * every SALE, FIRST_BILL and REBILL gets its own `purchases` row (a rebill is a
 * real, distinct charge) while `grantAppAccess`'s
 * `upsert(onConflict: 'user_id,app_slug')` keeps the entitlement itself
 * exactly-once.
 */
export function toProcessedPurchase(
  fields: WebhookFields,
  products: ZaxxaProduct[],
): ProcessedPurchase | null {
  const email = readString(fields, 'cust_email');
  if (!email) return null;

  const primary = products[0];
  const isSubscription =
    primary?.paymentType === 'subscription' || fields.trans_type === 'FIRST_BILL';

  const purchaseDate = parseZaxxaDate(readString(fields, 'trans_date')) ?? new Date();

  return {
    email,
    productName: primary?.name ?? 'Unknown Product',
    productSku: primary?.sku ?? undefined,
    amount: primary?.amount ?? 0,
    currency: readString(fields, 'trans_currency') ?? 'USD',
    transactionId: readString(fields, 'trans_receipt') ?? '',
    customerId: readString(fields, 'seller_id') ?? undefined,
    subscriptionId: primary?.recurringId ?? undefined,
    isSubscription,
    purchaseDate,
  };
}

/**
 * Parse Zaxxa's `trans_date` ("2013-05-09 20:00:11 UTC", timezone UTC).
 *
 * Used for logging and diagnostics only — it is not part of the signed
 * material, so it can never be a security control.
 */
export function parseZaxxaDate(value: string | null): Date | null {
  if (!value) return null;
  const parsed = new Date(value.replace(' UTC', 'Z').replace(' ', 'T'));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}
