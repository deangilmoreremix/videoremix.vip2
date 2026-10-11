// supabase/functions/webhook-paykickstart/handler.ts
//
// PayKickstart IPN webhook handler.
//
// Kept free of Deno-only imports so the whole request path can be driven by the
// vitest suite in tests/webhook-paykickstart.test.ts. `index.ts` is the thin
// Deno bootstrap that wires this to `serve()` and real environment secrets.

import { corsHeaders } from '../_shared/cors.ts';
import { processPurchase } from '../_shared/purchaseProcessor.ts';
import {
  WebhookEventRef,
  WebhookFields,
  checkReplayWindow,
  claimWebhookEvent,
  finalizeWebhookEvent,
  parseUnixSeconds,
  readWebhookBody,
} from '../_shared/webhookGuard.ts';
import {
  DEFAULT_REPLAY_WINDOW_MINUTES,
  PAYKICKSTART_CANCELLING_EVENTS,
  PAYKICKSTART_GRANTING_EVENTS,
  PAYKICKSTART_PLATFORM,
  PAYKICKSTART_REFUNDING_EVENTS,
  paykickstartEventId,
  paykickstartSubscriptionId,
  readPaykickstartMode,
  toProcessedPurchase,
  verifyPaykickstartIpn,
} from './verify.ts';

export interface PaykickstartWebhookDeps {
  /** Configured per-campaign secrets. Empty/undefined fails closed. */
  secrets: Map<string, string> | null;
  /** Replay window in minutes. 0 disables the check. */
  replayWindowMinutes: number;
  supabaseUrl: string;
  supabaseServiceRoleKey: string;
  /** Injected so the handler can be exercised without a live project. */
  createClient: (url: string, key: string) => any;
  /** Injectable clock for deterministic tests. */
  now?: () => Date;
}

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

export async function handlePaykickstartWebhook(
  req: Request,
  deps: PaykickstartWebhookDeps,
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
    console.error('PayKickstart webhook: unreadable body', error?.message ?? 'unknown');
    return json({ success: false, error: 'Unreadable request body' }, 400);
  }

  // Provider-correct authentication. The per-campaign secret has to exist and
  // match, otherwise nothing is granted.
  const verification = await verifyPaykickstartIpn(fields, deps.secrets);
  if (!verification.ok) {
    const status = verification.reason === 'secret_not_configured' ? 500 : 401;
    console.error('PayKickstart webhook rejected:', verification.reason, verification.detail ?? '');
    return json({ success: false, error: 'Unauthorized' }, status);
  }

  const { event } = verification;

  // `transaction_time` is one of the signed values, so a stale delivery cannot
  // be replayed with a forged timestamp. Zaxxa has no equivalent control.
  const replayWindowMinutes = deps.replayWindowMinutes ?? DEFAULT_REPLAY_WINDOW_MINUTES;
  const now = (deps.now?.() ?? new Date()).getTime();
  const replay = checkReplayWindow(
    parseUnixSeconds(fields.transaction_time),
    Math.floor(now / 1000),
    replayWindowMinutes,
  );
  if (!replay.ok) {
    console.error('PayKickstart webhook rejected: stale transaction_time', replay.reason);
    return json({ success: false, error: 'Unauthorized' }, 401);
  }

  const eventId = paykickstartEventId(fields);
  const supabase = deps.createClient(deps.supabaseUrl, deps.supabaseServiceRoleKey);

  const ref: WebhookEventRef = {
    platform: PAYKICKSTART_PLATFORM,
    eventId,
    match: eventId ? { transaction_id: String(fields.transaction_id ?? ''), event: String(fields.event ?? '') } : {},
    eventType: event,
    payload: fields,
  };

  const claim = await claimWebhookEvent(supabase, ref);
  if (claim.duplicate) {
    console.log(`PayKickstart webhook ${eventId ?? 'unknown'} already processed, skipping`);
    return json({ success: true, message: 'Event already processed' }, 200);
  }

  let result: { success: boolean; error?: string; userId?: string; message?: string };

  try {
    if (PAYKICKSTART_GRANTING_EVENTS.includes(event)) {
      const purchase = toProcessedPurchase(fields, event);

      if (!purchase || !purchase.email) {
        result = { success: false, error: 'IPN carried no buyer email' };
      } else {
        result = await processPurchase(supabase, PAYKICKSTART_PLATFORM, purchase, fields);
      }
    } else if (PAYKICKSTART_CANCELLING_EVENTS.includes(event)) {
      result = await handleCancelled(supabase, fields);
    } else if (PAYKICKSTART_REFUNDING_EVENTS.includes(event)) {
      result = await handleRefund(supabase, fields);
    } else {
      // Documented events that never grant anything (leads, fulfilment states,
      // reminders, trial expiry...). They are logged and acknowledged.
      console.log(`PayKickstart webhook ${event} is not a grant/cancel/refund event, recording only`);
      result = { success: true, message: `Event ${event} not processed` };
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

  const mode = readPaykickstartMode(fields);
  console.log(
    `PayKickstart webhook ${eventId ?? 'unknown'} (${event}, mode: ${mode ?? 'unknown'}) ${
      result.success ? 'processed' : 'failed'
    }`,
  );

  // A processing failure is retryable (the platform re-delivers), and the
  // pending audit row is what makes the retry safe.
  return json(result, result.success ? 200 : 500);
}

async function handleCancelled(supabase: any, fields: WebhookFields) {
  const subscriptionId = paykickstartSubscriptionId(fields);
  if (!subscriptionId) {
    return { success: true, message: 'No invoice id on cancellation' };
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
  const transactionId = typeof fields.transaction_id === 'string' ? fields.transaction_id : null;
  if (!transactionId) {
    return { success: true, message: 'No transaction id on refund' };
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
