// supabase/functions/webhook-zaxxa/handler.ts
//
// Zaxxa (Zaxaa) ZPN webhook handler.
//
// Kept free of Deno-only imports so the whole request path can be driven by
// the vitest suite in tests/webhook-zaxxa.test.ts. `index.ts` is the thin Deno
// bootstrap that wires this to `serve()` and real environment secrets.

import { corsHeaders } from '../_shared/cors.ts';
import { processPurchase } from '../_shared/purchaseProcessor.ts';
import {
  WebhookEventRef,
  WebhookFields,
  claimWebhookEvent,
  finalizeWebhookEvent,
  readWebhookBody,
} from '../_shared/webhookGuard.ts';
import {
  ZAXXA_PLATFORM,
  ZaxxaTransType,
  extractZaxxaProducts,
  toProcessedPurchase,
  verifyZaxxaZpn,
  zaxxaEventId,
} from './verify.ts';

export interface ZaxxaWebhookDeps {
  /** Configured Zaxxa API Signature (Settings -> Account Settings). */
  apiSignature: string | undefined | null;
  supabaseUrl: string;
  supabaseServiceRoleKey: string;
  /** Injected so the handler can be exercised without a live project. */
  createClient: (url: string, key: string) => any;
}

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

/**
 * Zaxxa ZPN grant decisions, in the platform's own transaction-type vocabulary.
 *
 * REBILL is granted on purpose: a rebill is a separate charge with its own
 * `trans_receipt`, and `grantAppAccess` upserts on `(user_id, app_slug)`, so a
 * renewal refreshes `expires_at` instead of stacking duplicate entitlements.
 */
const GRANTING_TYPES: readonly ZaxxaTransType[] = ['SALE', 'FIRST_BILL', 'REBILL'];

export async function handleZaxxaWebhook(
  req: Request,
  deps: ZaxxaWebhookDeps,
): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return json({ success: false, error: 'Method not allowed' }, 405);
  }

  let fields: WebhookFields;
  try {
    ({ fields } = await readWebhookBody(req));
  } catch (error: any) {
    console.error('Zaxxa webhook: unreadable body', error?.message ?? 'unknown');
    return json({ success: false, error: 'Unreadable request body' }, 400);
  }

  // Provider-correct authentication. Fails closed: an unconfigured API
  // signature answers 500 so the operator notices instead of the endpoint
  // silently granting access to anyone who finds the URL.
  const verification = verifyZaxxaZpn(fields, deps.apiSignature);
  if (!verification.ok) {
    const status = verification.reason === 'secret_not_configured' ? 500 : 401;
    console.error('Zaxxa webhook rejected:', verification.reason, verification.detail ?? '');
    return json({ success: false, error: 'Unauthorized' }, status);
  }

  const { transType } = verification;
  const eventId = zaxxaEventId(fields);
  const receipt = typeof fields.trans_receipt === 'string' ? fields.trans_receipt : 'unknown';

  const supabase = deps.createClient(deps.supabaseUrl, deps.supabaseServiceRoleKey);

  // The receipt number is only unique per charge, and Zaxxa reports the whole
  // history of a purchase through the same receipt (SALE then REBILL then
  // CANCELED then REFUND). The transaction type therefore has to be part of
  // the identity of a delivery, or a refund would be discarded as a duplicate
  // of the original sale.
  const ref: WebhookEventRef = {
    platform: ZAXXA_PLATFORM,
    eventId,
    match: eventId
      ? { trans_receipt: String(fields.trans_receipt ?? ''), trans_type: transType }
      : {},
    eventType: transType,
    payload: fields,
  };

  const claim = await claimWebhookEvent(supabase, ref);
  if (claim.duplicate) {
    console.log(`Zaxxa webhook ${eventId ?? 'unknown'} already processed, skipping`);
    return json({ success: true, message: 'Event already processed' }, 200);
  }

  let result: { success: boolean; error?: string; userId?: string };

  try {
    if (GRANTING_TYPES.includes(transType)) {
      const products = extractZaxxaProducts(fields);
      const purchase = toProcessedPurchase(fields, products);

      if (!purchase || !purchase.email) {
        result = { success: false, error: 'ZPN carried no customer email' };
      } else {
        result = await processPurchase(supabase, ZAXXA_PLATFORM, purchase, fields);
      }
    } else if (transType === 'CANCELED') {
      result = await handleCancelled(supabase, fields);
    } else {
      result = await handleRefund(supabase, fields);
    }
  } catch (error: any) {
    result = { success: false, error: error?.message ?? 'processing_failed' };
  }

  await finalizeWebhookEvent(
    supabase,
    claim.logId,
    result.success ? 'processed' : 'failed',
    result.error,
  );

  console.log(
    `Zaxxa webhook ${receipt} (${transType}) ${result.success ? 'processed' : 'failed'}`,
  );

  // A processing failure is retryable (the platform re-delivers), and the
  // pending audit row is what makes the retry safe.
  return json(result, result.success ? 200 : 500);
}

async function handleCancelled(supabase: any, fields: WebhookFields) {
  const products = extractZaxxaProducts(fields);
  const subscriptionId = products[0]?.recurringId ?? (fields as any).recurring_id;
  if (!subscriptionId) {
    return { success: true, message: 'No subscription id on cancellation' };
  }

  const { data: existingSub } = await supabase
    .from('subscription_status')
    .select('user_id')
    .eq('platform_subscription_id', subscriptionId)
    .maybeSingle();

  if (existingSub) {
    const now = new Date().toISOString();
    await supabase
      .from('subscription_status')
      .update({ status: 'cancelled', cancelled_at: now, updated_at: now })
      .eq('platform_subscription_id', subscriptionId);

    await supabase
      .from('user_app_access')
      .update({ is_active: false })
      .eq('user_id', existingSub.user_id)
      .eq('access_type', 'subscription');
  }

  return { success: true, message: 'Subscription cancelled' };
}

async function handleRefund(supabase: any, fields: WebhookFields) {
  const transactionId = typeof fields.trans_receipt === 'string' ? fields.trans_receipt : null;
  if (!transactionId) {
    return { success: true, message: 'No receipt number on refund' };
  }

  const { data: purchase } = await supabase
    .from('purchases')
    .select('id, user_id')
    .eq('platform_transaction_id', transactionId)
    .maybeSingle();

  if (purchase) {
    await supabase.from('purchases').update({ status: 'refunded' }).eq('id', purchase.id);
    await supabase
      .from('user_app_access')
      .update({ is_active: false })
      .eq('purchase_id', purchase.id);
  }

  return { success: true, message: 'Refund processed' };
}
