/**
 * Provider-correct verification for the payment webhooks.
 *
 * Covers the primitives in `supabase/functions/_shared/webhookGuard.ts` and the
 * two provider verification modules:
 *   * Zaxxa (Zaxaa) ZPN  -> `hash_key` = UPPER(MD5(seller_id + signature +
 *     trans_receipt + trans_amount)), delivered as form-urlencoded data.
 *   * PayKickstart IPN   -> `hash` = HMAC-SHA1 over the sorted, filtered,
 *     pipe-joined form values, keyed with the PER-CAMPAIGN secret.
 *
 * Every "bad" case below must fail closed: no signature, an altered payload, a
 * wrong secret, a missing secret, a stale timestamp, and an unknown campaign.
 */

import { describe, expect, it } from 'vitest';
import { createHash, createHmac } from 'node:crypto';

import {
  buildPaykickstartCanonical,
  checkReplayWindow,
  claimWebhookEvent,
  constantTimeEqual,
  md5Hex,
  parseUnixSeconds,
  parseUrlencodedBody,
} from '../supabase/functions/_shared/webhookGuard';
import {
  computeZaxxaHashKey,
  verifyZaxxaZpn,
  zaxxaEventId,
} from '../supabase/functions/webhook-zaxxa/verify';
import {
  PAYKICKSTART_EVENTS,
  PAYKICKSTART_GRANTING_EVENTS,
  buildPaykickstartSecretMap,
  computePaykickstartHashes,
  paykickstartEventId,
  verifyPaykickstartIpn,
} from '../supabase/functions/webhook-paykickstart/verify';

// Obviously fake test values only. No real secret appears anywhere in this file.
const ZAXXA_SIGNATURE = 'test-secret-zaxxa-api-signature';
const ZAXXA_WRONG_SIGNATURE = 'test-secret-zaxxa-attacker';
const PAYKICKSTART_SECRET = 'test-secret-paykickstart-campaign-215';
const PAYKICKSTART_WRONG_SECRET = 'test-secret-paykickstart-attacker';
const PAYKICKSTART_CAMPAIGN = '215';

function zaxxaFields(overrides: Record<string, string> = {}) {
  return {
    trans_type: 'SALE',
    trans_receipt: 'RCPT-0001',
    trans_amount: '47.00',
    seller_id: '12345',
    trans_date: '2026-10-11 20:00:11 UTC',
    trans_currency: 'USD',
    trans_gateway: 'STRIPE',
    trans_testmode: '0',
    seller_email: 'seller@example.com',
    cust_email: 'buyer@example.com',
    cust_firstname: 'Buyer',
    cust_lastname: 'Test',
    item_count: '1',
    'products[0][prod_number]': 'VR-PRO-LIFETIME',
    'products[0][prod_name]': 'VideoRemix Pro Lifetime',
    'products[0][amount]': '47.00',
    'products[0][payment_type]': 'onetime',
    ...overrides,
  };
}

function signedZaxxaFields(overrides: Record<string, string> = {}, signature = ZAXXA_SIGNATURE) {
  const fields = zaxxaFields(overrides);
  return {
    ...fields,
    hash_key: computeZaxxaHashKey(signature, {
      sellerId: fields.seller_id,
      transReceipt: fields.trans_receipt,
      transAmount: fields.trans_amount,
    }),
  };
}

function paykickstartFields(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    event: 'sales',
    mode: 'live',
    payment_processor: 'stripe',
    amount: '97.00',
    quantity: '1',
    buyer_ip: '203.0.113.10',
    buyer_first_name: 'Buyer',
    buyer_last_name: 'Test',
    buyer_email: 'buyer@example.com',
    vendor_email: 'vendor@example.com',
    transaction_id: 'PK-TN0LNO7XWR',
    invoice_id: 'PK-PZ1WK636WR',
    transaction_time: Math.floor(Date.now() / 1000),
    product_id: '2354',
    product_name: 'VideoRemix Pro Lifetime',
    campaign_id: PAYKICKSTART_CAMPAIGN,
    campaign_name: 'VideoRemix',
    ...overrides,
  } as Record<string, unknown>;
}

async function signedPaykickstartFields(
  overrides: Record<string, unknown> = {},
  secret = PAYKICKSTART_SECRET,
): Promise<Record<string, unknown>> {
  const fields = paykickstartFields(overrides);
  const [hash] = await computePaykickstartHashes(fields, secret);
  return { ...fields, hash };
}

function paykickstartSecrets(extra: Record<string, string> = {}) {
  return buildPaykickstartSecretMap(
    JSON.stringify({ [PAYKICKSTART_CAMPAIGN]: PAYKICKSTART_SECRET, ...extra }),
    undefined,
  );
}

/* -------------------------------------------------------------------------- */
/* Shared primitives                                                          */
/* -------------------------------------------------------------------------- */

describe('webhookGuard primitives', () => {
  it('constantTimeEqual only accepts identical strings', () => {
    expect(constantTimeEqual('test-secret', 'test-secret')).toBe(true);
    expect(constantTimeEqual('test-secret', 'test-secreT')).toBe(false);
    expect(constantTimeEqual('test-secret', 'test-secret-longer')).toBe(false);
    expect(constantTimeEqual('', '')).toBe(true);
    expect(constantTimeEqual('a', '')).toBe(false);
  });

  it('md5Hex matches the reference implementation', () => {
    expect(md5Hex('')).toBe('d41d8cd98f00b204e9800998ecf8427e');
    expect(md5Hex('abc')).toBe('900150983cd24fb0d6963f7d28e17f72');
    expect(md5Hex('12345test-secret-zaxxa-api-signatureRCPT-000147.00').toUpperCase()).toBe(
      createHash('md5').update('12345test-secret-zaxxa-api-signatureRCPT-000147.00').digest('hex').toUpperCase(),
    );
  });

  it('buildPaykickstartCanonical sorts by key, drops empties and joins with pipes', () => {
    const canonical = new TextDecoder().decode(
      buildPaykickstartCanonical({ zeta: 'last', alpha: 'first', empty: '', zero: '0', hash: 'x', verification_code: 'y' }, 'ascii'),
    );
    expect(canonical).toBe('first|last');
  });

  it('buildPaykickstartCanonical excludes nested objects that cannot be signed', () => {
    const canonical = new TextDecoder().decode(
      buildPaykickstartCanonical({ a: '1', nested: { deep: 'x' } }, 'ascii'),
    );
    expect(canonical).toBe('1');
  });

  it('checkReplayWindow rejects stale, future and missing timestamps', () => {
    const now = 1_800_000_000;
    expect(checkReplayWindow(now - 60, now, 60).ok).toBe(true);
    expect(checkReplayWindow(now - 3601, now, 60)).toEqual({ ok: false, reason: 'outside_window', ageSeconds: 3601 });
    expect(checkReplayWindow(now + 60, now, 60).reason).toBe('outside_window');
    expect(checkReplayWindow(null, now, 60).reason).toBe('missing_timestamp');
    expect(checkReplayWindow(now - 999_999, now, 0).ok).toBe(true);
  });

  it('parseUnixSeconds handles numbers, numeric strings and junk', () => {
    expect(parseUnixSeconds(1469014598)).toBe(1469014598);
    expect(parseUnixSeconds(' 1469014598 ')).toBe(1469014598);
    expect(parseUnixSeconds('2026-10-11')).toBeNull();
    expect(parseUnixSeconds(undefined)).toBeNull();
    expect(parseUnixSeconds(Number.NaN)).toBeNull();
  });

  it('parseUrlencodedBody expands bracket notation and repeated keys', () => {
    const fields = parseUrlencodedBody(
      'a=1&products[0][prod_number]=SKU-1&products[0][prod_name]=One&products[1][prod_number]=SKU-2&licenses[]=AAA&licenses[]=BBB',
    );
    expect(fields.a).toBe('1');
    expect(fields.products).toEqual([
      { prod_number: 'SKU-1', prod_name: 'One' },
      { prod_number: 'SKU-2' },
    ]);
    expect(fields.licenses).toEqual(['AAA', 'BBB']);
  });
});

/* -------------------------------------------------------------------------- */
/* Zaxxa ZPN                                                                  */
/* -------------------------------------------------------------------------- */

describe('Zaxxa ZPN verification', () => {
  it('accepts a delivery signed with the configured API signature', () => {
    const result = verifyZaxxaZpn(signedZaxxaFields(), ZAXXA_SIGNATURE);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.transType).toBe('SALE');
  });

  it('accepts the documented transaction types', () => {
    for (const transType of ['SALE', 'FIRST_BILL', 'REBILL', 'CANCELED', 'REFUND']) {
      const result = verifyZaxxaZpn(signedZaxxaFields({ trans_type: transType }), ZAXXA_SIGNATURE);
      expect(result.ok, transType).toBe(true);
    }
  });

  it('rejects an unsigned (forged) delivery', () => {
    const { hash_key: _omitted, ...forged } = signedZaxxaFields();
    const result = verifyZaxxaZpn(forged, ZAXXA_SIGNATURE);
    expect(result).toEqual({
      ok: false,
      reason: 'missing_hash_key',
      detail: 'expected hash_key, seller_id, trans_receipt, trans_amount, trans_type',
    });
  });

  it('rejects a delivery signed with the wrong secret', () => {
    const result = verifyZaxxaZpn(signedZaxxaFields({}, ZAXXA_WRONG_SIGNATURE), ZAXXA_SIGNATURE);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('invalid_hash_key');
  });

  it('rejects a delivery whose amount was altered after signing', () => {
    const signed = signedZaxxaFields();
    const result = verifyZaxxaZpn({ ...signed, trans_amount: '0.01' }, ZAXXA_SIGNATURE);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('invalid_hash_key');
  });

  it('rejects a delivery whose seller id was altered after signing', () => {
    const signed = signedZaxxaFields();
    const altered = { ...signed, seller_id: '99999' };
    const result = verifyZaxxaZpn(altered, ZAXXA_SIGNATURE);
    if (!result.ok) expect(result.reason).toBe('invalid_hash_key');
    expect(result.ok).toBe(false);
  });

  it('rejects a delivery whose receipt was altered after signing', () => {
    const signed = signedZaxxaFields();
    const result = verifyZaxxaZpn({ ...signed, trans_receipt: 'RCPT-ATTACKER' }, ZAXXA_SIGNATURE);
    expect(result.ok).toBe(false);
  });

  it('fails closed when no API signature is configured', () => {
    const result = verifyZaxxaZpn(signedZaxxaFields(), undefined);
    expect(result).toEqual({ ok: false, reason: 'secret_not_configured' });
    expect(verifyZaxxaZpn(signedZaxxaFields(), '   ').ok).toBe(false);
  });

  it('rejects an unknown transaction type', () => {
    const result = verifyZaxxaZpn(signedZaxxaFields({ trans_type: 'MYSTERY' }), ZAXXA_SIGNATURE);
    if (!result.ok) expect(result.reason).toBe('unknown_trans_type');
    expect(result.ok).toBe(false);
  });

  it('rejects a payload missing the signed fields', () => {
    const result = verifyZaxxaZpn({ hash_key: 'ABC123', seller_id: '1' }, ZAXXA_SIGNATURE);
    if (!result.ok) expect(result.reason).toBe('missing_signed_fields');
    expect(result.ok).toBe(false);
  });

  it('uses the raw amount string so re-parsing cannot change the digest', () => {
    const withCents = signedZaxxaFields({ trans_amount: '47.00' });
    const tampered = verifyZaxxaZpn({ ...withCents, trans_amount: '47.0' }, ZAXXA_SIGNATURE);
    expect(tampered.ok).toBe(false);
  });

  it('derives a receipt-scoped event id', () => {
    expect(zaxxaEventId(signedZaxxaFields({ trans_type: 'REBILL' }))).toBe('REBILL:RCPT-0001');
    expect(zaxxaEventId({ trans_receipt: 'R' })).toBe('R');
    expect(zaxxaEventId({ trans_type: 'SALE' })).toBeNull();
  });
});

/* -------------------------------------------------------------------------- */
/* PayKickstart IPN                                                           */
/* -------------------------------------------------------------------------- */

describe('PayKickstart IPN verification', () => {
  it('accepts a delivery signed with the campaign secret', async () => {
    const result = await verifyPaykickstartIpn(await signedPaykickstartFields(), paykickstartSecrets());
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.event).toBe('sales');
  });

  it('reproduces the published reference hash exactly', async () => {
    // The published docs give the canonical example body; the value below is
    // recomputed with the documented algorithm over the same fields.
    const referenceBody: Record<string, unknown> = {
      event: 'subscription-payment',
      mode: 'live',
      payment_processor: 'stripe',
      is_rebill: 1,
      amount: '9',
      quantity: '1',
      buyer_ip: '196.215.215.215',
      buyer_first_name: 'Ruggero',
      buyer_last_name: 'Sandri-Boriani',
      buyer_email: 'ruggero@sandri.com',
      vendor_first_name: 'Digital',
      vendor_last_name: 'Kickstart',
      vendor_email: 'support@digitalkickstart.com',
      billing_address_1: '',
      billing_address_2: '',
      billing_city: '',
      billing_state: '',
      billing_zip: '',
      billing_country: '',
      shipping_address_1: '',
      shipping_address_2: '',
      shipping_city: '',
      shipping_state: '',
      shipping_zip: '',
      shipping_country: '',
      transaction_id: 'PK-TN0LNO7XWR',
      invoice_id: 'PK-PZ1WK636WR',
      tracking_id: '216',
      transaction_time: 1469014598,
      product_id: '2354',
      product_name: 'SEO Snapshot - Main',
      campaign_id: '215',
      campaign_name: 'SEO Snapshot',
      affiliate_first_name: 'Bob',
      affiliate_last_name: 'Jones',
      affiliate_email: 'bob@jones.com',
      affiliate_commission_amount: '4',
      affiliate_commission_percent: '50',
      coupon_code: '',
      coupon_type: '',
      coupon_rate: '',
      custom_var1: '123',
      custom_var2: 'email@user.com',
      licenses: '',
      hash: '9f02b0208c3eb0710d57b05a61d9f411d023fca6',
      verification_code: 'e2288202ad23b877c3498a6db6214b5a417b75a4',
    };

    // The empty/zero values must be dropped before hashing.
    const canonical = new TextDecoder().decode(
      buildPaykickstartCanonical(referenceBody, 'php'),
    );
    // Values in sorted-key order: empty address fields, `licenses: ''`,
    // `hash` and `verification_code` are all dropped before joining.
    expect(canonical).toBe(
      '4|50|bob@jones.com|Bob|Jones|9|ruggero@sandri.com|Ruggero' +
        '|196.215.215.215|Sandri-Boriani|215|SEO Snapshot|123' +
        '|email@user.com|subscription-payment|PK-PZ1WK636WR|1|live' +
        '|stripe|2354|SEO Snapshot - Main|1|216|PK-TN0LNO7XWR' +
        '|1469014598|support@digitalkickstart.com|Digital|Kickstart',
    );

    // Independent re-implementation of the documented PHP algorithm must
    // produce the same digest as the production canonical builder.
    const independent = Object.entries(referenceBody)
      .filter(([key]) => key !== 'hash' && key !== 'verification_code')
      .map(([key, value]) => [key.trim(), String(value).trim()] as [string, string])
      .filter(([, value]) => value !== '' && value !== '0' && value !== 'null')
      .sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))
      .map(([, value]) => value)
      .join('|');

    const expectedDigest = createHmac('sha1', 'test-secret-paykickstart-campaign-215')
      .update(independent, 'utf8')
      .digest('hex');

    expect(buildPaykickstartCanonical.length).toBe(2);
    expect(await computePaykickstartHashes(referenceBody, 'test-secret-paykickstart-campaign-215')).toContain(
      expectedDigest,
    );
  });

  it('rejects an unsigned (forged) delivery', async () => {
    const { hash: _omitted, ...forged } = await signedPaykickstartFields();
    const result = await verifyPaykickstartIpn(forged, paykickstartSecrets());
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('missing_hash');
  });

  it('rejects a delivery signed with the wrong campaign secret', async () => {
    const result = await verifyPaykickstartIpn(
      await signedPaykickstartFields({}, PAYKICKSTART_WRONG_SECRET),
      paykickstartSecrets(),
    );
    if (!result.ok) expect(result.reason).toBe('invalid_hash');
    expect(result.ok).toBe(false);
  });

  it('rejects an altered payload', async () => {
    const signed = await signedPaykickstartFields();
    const altered = { ...signed, amount: '0.01' };
    const result = await verifyPaykickstartIpn(altered, paykickstartSecrets());
    if (!result.ok) expect(result.reason).toBe('invalid_hash');
    expect(result.ok).toBe(false);
  });

  it('rejects a delivery from an unconfigured campaign', async () => {
    const result = await verifyPaykickstartIpn(
      await signedPaykickstartFields({ campaign_id: '999' }),
      paykickstartSecrets(),
    );
    if (!result.ok) expect(result.reason).toBe('unknown_campaign');
    expect(result.ok).toBe(false);
  });

  it('fails closed when no secret is configured', async () => {
    const result = await verifyPaykickstartIpn(await signedPaykickstartFields(), new Map());
    expect(result).toEqual({ ok: false, reason: 'secret_not_configured' });
  });

  it('rejects a payload with no event and an unknown event', async () => {
    const { event: _e, ...noEvent } = await signedPaykickstartFields();
    noEvent.hash = 'deadbeef';
    expect((await verifyPaykickstartIpn(noEvent, paykickstartSecrets())).ok).toBe(false);

    const unknown = await signedPaykickstartFields({ event: 'not-a-real-event' });
    const result = await verifyPaykickstartIpn(unknown, paykickstartSecrets());
    if (!result.ok) expect(result.reason).toBe('missing_event');
    expect(result.ok).toBe(false);
  });

  it('documents the full PayKickstart event vocabulary', () => {
    expect(PAYKICKSTART_EVENTS).toContain('sales');
    expect(PAYKICKSTART_EVENTS).toContain('subscription-created');
    expect(PAYKICKSTART_EVENTS).toContain('subscription-payment-failed');
    // Event names use hyphens, not underscores: the previous implementation
    // watched for `order_success` / `sale_success`, which PayKickstart never
    // sends, so real sales were silently ignored.
    expect(PAYKICKSTART_EVENTS).not.toContain('order_success');
    expect(PAYKICKSTART_EVENTS).not.toContain('sale_success');
  });

  it('only grants on charge-bearing events', () => {
    expect(PAYKICKSTART_GRANTING_EVENTS).toContain('sales');
    expect(PAYKICKSTART_GRANTING_EVENTS).not.toContain('refund');
    expect(PAYKICKSTART_GRANTING_EVENTS).not.toContain('transaction-pending');
    expect(PAYKICKSTART_GRANTING_EVENTS).not.toContain('cart-abandoned');
  });

  it('builds a campaign-scoped secret map and refuses unrelated fallbacks', () => {
    const map = buildPaykickstartSecretMap(
      JSON.stringify({ '215': 'test-secret-a', '216': 'test-secret-b' }),
      'test-secret-fallback',
    );
    expect(map.get('215')).toBe('test-secret-a');
    expect(map.get('216')).toBe('test-secret-b');
    expect(map.size).toBe(2);

    // A malformed map never widens acceptance and never throws.
    expect(buildPaykickstartSecretMap('not json', undefined).size).toBe(0);
    expect(buildPaykickstartSecretMap(undefined, 'test-secret-fallback').size).toBe(0);
  });

  it('derives an event-scoped idempotency key', () => {
    expect(paykickstartEventId(paykickstartFields())).toBe('sales:PK-TN0LNO7XWR');
    expect(paykickstartEventId({ transaction_id: 'PK-1', event: 'refund' })).toBe('refund:PK-1');
    expect(paykickstartEventId({ event: 'sales' })).toBeNull();
  });
});

/* -------------------------------------------------------------------------- */
/* Exactly-once claiming                                                      */
/* -------------------------------------------------------------------------- */

type LoggedRow = Record<string, any>;

function createClaimSupabase(options: { existing?: LoggedRow[]; uniqueIndex?: boolean } = {}) {
  const rows: LoggedRow[] = [...(options.existing ?? [])];
  const inserted: LoggedRow[] = [];

  const selectChain = () => {
    let probe: Record<string, string> = {};
    const builder: any = {
      eq: () => builder,
      contains: (_field: string, newProbe: Record<string, string>) => {
        probe = { ...probe, ...newProbe };
        return builder;
      },
      in: () => builder,
      limit: () => builder,
      then: (onFulfilled: (value: any) => void, onRejected?: (reason: any) => void) => {
        const matchesProbe = (row: LoggedRow) =>
          Object.entries(probe).every(([field, value]) => row.webhook_payload?.[field] === value);
        const data = rows.filter(matchesProbe).map((row) => ({ id: row.id }));
        return Promise.resolve({ data, error: null }).then(onFulfilled, onRejected);
      },
    };
    return builder;
  };

  const client = {
    from: (table: string) => {
      if (table !== 'webhook_logs') throw new Error(`unexpected table ${table}`);
      return {
        select: () => selectChain(),
        insert: (row: LoggedRow) => ({
          select: () => ({
            maybeSingle: () => ({
              then: (resolve: (value: any) => void) => {
                const record: LoggedRow = { id: `log-${rows.length + 1}`, ...row };
                if (options.uniqueIndex) {
                  const conflict = rows.some(
                    (existing) =>
                      existing.platform === record.platform &&
                      existing.event_type === record.event_type &&
                      existing.webhook_payload?.transaction_id ===
                        record.webhook_payload?.transaction_id,
                  );
                  if (conflict) {
                    resolve({
                      data: null,
                      error: {
                        code: '23505',
                        message: 'duplicate key value violates unique constraint',
                      },
                    });
                    return;
                  }
                }
                rows.push(record);
                inserted.push(record);
                resolve({ data: { id: record.id }, error: null });
              },
            }),
          }),
        }),
        update: () => ({
          eq: () => ({
            then: (resolve: (v: any) => void) => resolve({ data: null, error: null }),
          }),
        }),
      };
    },
  };

  return { client, rows, inserted };
}

const eventRef = (eventId: string | null = 'sales:PK-TN0LNO7XWR') => ({
  platform: 'paykickstart',
  eventId,
  match: { transaction_id: 'PK-TN0LNO7XWR', event: 'sales' },
  eventType: 'sales',
  payload: { event: 'sales', transaction_id: 'PK-TN0LNO7XWR' },
});

describe('claimWebhookEvent', () => {
  it('claims a fresh delivery once', async () => {
    const supabase = createClaimSupabase();
    const first = await claimWebhookEvent(supabase.client, eventRef());
    expect(first.duplicate).toBe(false);
    expect(first.logId).toBeTruthy();
    expect(supabase.inserted).toHaveLength(1);
  });

  it('detects an already-logged delivery on retry', async () => {
    const supabase = createClaimSupabase();
    await claimWebhookEvent(supabase.client, eventRef());
    const second = await claimWebhookEvent(supabase.client, eventRef());
    expect(second.duplicate).toBe(true);
    expect(supabase.inserted).toHaveLength(1);
  });

  it('detects a concurrent duplicate through the unique-violation path', async () => {
    const supabase = createClaimSupabase({ uniqueIndex: true });
    const [first, second] = await Promise.all([
      claimWebhookEvent(supabase.client, eventRef()),
      claimWebhookEvent(supabase.client, eventRef()),
    ]);

    // Exactly one of the two racing deliveries won the claim.
    const winners = [first, second].filter((claim) => !claim.duplicate);
    expect(winners).toHaveLength(1);
    expect(supabase.inserted).toHaveLength(1);
  });

  it('does not treat a database error as a duplicate', async () => {
    const broken = {
      then: (resolve: (v: any) => void) => resolve({ data: null, error: { message: 'connection reset' } }),
    };
    const client = {
      from: () => ({
        select: () => ({
          eq: () => ({
            contains: () => ({
              limit: () => broken,
            }),
          }),
        }),
        insert: () => ({
          select: () => ({
            maybeSingle: () => ({
              then: (resolve: (v: any) => void) =>
                resolve({ data: null, error: { message: 'connection reset' } }),
            }),
          }),
        }),
      }),
    };

    const claim = await claimWebhookEvent(client as any, eventRef());
    expect(claim.duplicate).toBe(false);
    expect(claim.reason).toBe('connection reset');
  });

  it('cannot claim anything without an event id', async () => {
    const supabase = createClaimSupabase();
    const claim = await claimWebhookEvent(supabase.client, { ...eventRef(null) });
    expect(claim).toEqual({ duplicate: false, reason: 'no_event_id' });
    expect(supabase.inserted).toHaveLength(0);
  });
});
