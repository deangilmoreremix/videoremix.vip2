import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';
import Stripe from 'npm:stripe@14';
import { corsHeaders } from '../_shared/cors.ts';
import { processPurchase, ProcessedPurchase } from '../_shared/purchaseProcessor.ts';

const STRIPE_WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET') || '';
const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const signature = req.headers.get('stripe-signature');
    const body = await req.text();

    // Verify webhook signature FIRST before any processing
    if (!STRIPE_WEBHOOK_SECRET || !signature) {
      console.error('Missing Stripe webhook secret or signature');
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid webhook configuration' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let event: Stripe.Event;
    try {
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error('Stripe webhook signature verification failed:', err);
      
      // Log failed attempts for security monitoring
      await supabase.from('webhook_logs').insert({
        platform: 'stripe',
        event_type: 'signature_failed',
        webhook_payload: { raw_body_length: body.length, signature },
        processing_status: 'failed',
        error_message: err.message,
      });
      
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid signature' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log verified webhook
    await supabase.from('webhook_logs').insert({
      platform: 'stripe',
      event_type: event.type,
      webhook_payload: event,
      processing_status: 'pending',
      stripe_event_id: event.id,
    });

    // Check for idempotency - don't process same event twice
    const { data: existingEvent } = await supabase
      .from('webhook_logs')
      .select('id')
      .eq('stripe_event_id', event.id)
      .eq('processing_status', 'completed')
      .maybeSingle();

    if (existingEvent) {
      console.log(`Event ${event.id} already processed, skipping`);
      return new Response(
        JSON.stringify({ success: true, message: 'Event already processed' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let result;

    switch (event.type) {
      case 'checkout.session.completed':
        result = await handleCheckoutCompleted(supabase, event);
        break;
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        result = await handleSubscriptionUpdate(supabase, event);
        break;
      case 'customer.subscription.deleted':
        result = await handleSubscriptionCancelled(supabase, event);
        break;
      case 'charge.refunded':
        result = await handleRefund(supabase, event);
        break;
      case 'invoice.payment_failed':
        result = await handlePaymentFailed(supabase, event);
        break;
      case 'entitlements.active_entitlement_summary.updated':
        result = await handleEntitlementUpdate(supabase, event);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
        result = { success: true, message: 'Event type not processed' };
    }

    // Mark event as processed
    await supabase
      .from('webhook_logs')
      .update({ 
        processing_status: result.success ? 'completed' : 'failed',
        error_message: result.error || null,
        completed_at: new Date().toISOString()
      })
      .eq('stripe_event_id', event.id)
      .order('created_at', { ascending: false })
      .limit(1);

    return new Response(
      JSON.stringify(result),
      {
        status: result.success ? 200 : 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Stripe webhook error:', error);
    
    // Log the error
    try {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );
      
      await supabase.from('webhook_logs').insert({
        platform: 'stripe',
        event_type: 'error',
        processing_status: 'failed',
        error_message: error.message,
      });
    } catch (logError) {
      console.error('Failed to log webhook error:', logError);
    }
    
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});

async function handleCheckoutCompleted(supabase: any, event: any) {
  const session = event.data.object;

  const purchase: ProcessedPurchase = {
    email: session.customer_details?.email || session.customer_email,
    productName: session.line_items?.data?.[0]?.description || session.metadata?.appName || 'Unknown Product',
    amount: session.amount_total / 100,
    currency: session.currency.toUpperCase(),
    transactionId: session.id,
    customerId: session.customer,
    subscriptionId: session.subscription,
    isSubscription: !!session.subscription,
    purchaseDate: new Date(session.created * 1000),
  };

  const result = await processPurchase(supabase, 'stripe', purchase, event);

  if (result.success && session.metadata?.appId && session.metadata?.userId) {
    try {
      const { data: purchaseRecord } = await supabase
        .from('purchases')
        .select('id')
        .eq('platform_transaction_id', session.id)
        .maybeSingle();

      if (purchaseRecord) {
        await supabase.from('user_app_access').insert({
          user_id: session.metadata.userId,
          app_slug: session.metadata.appId,
          purchase_id: purchaseRecord.id,
          access_type: 'lifetime',
          is_active: true,
          granted_at: new Date().toISOString(),
        });

        console.log(`Granted access to app ${session.metadata.appId} for user ${session.metadata.userId}`);
      }
    } catch (error) {
      console.error('Error granting app access:', error);
    }
  }

  return result;
}

async function handleSubscriptionUpdate(supabase: any, event: any) {
  const subscription = event.data.object;

  const { data: existingSub } = await supabase
    .from('subscription_status')
    .select('*')
    .eq('platform_subscription_id', subscription.id)
    .maybeSingle();

  if (existingSub) {
    await supabase
      .from('subscription_status')
      .update({
        status: subscription.status === 'active' ? 'active' : 'cancelled',
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        cancel_at_period_end: subscription.cancel_at_period_end,
        updated_at: new Date().toISOString(),
      })
      .eq('platform_subscription_id', subscription.id);

    if (subscription.status !== 'active') {
      await supabase
        .from('user_app_access')
        .update({ is_active: false })
        .eq('user_id', existingSub.user_id)
        .eq('access_type', 'subscription');
    } else {
      await supabase
        .from('user_app_access')
        .update({
          is_active: true,
          expires_at: new Date(subscription.current_period_end * 1000).toISOString(),
        })
        .eq('user_id', existingSub.user_id)
        .eq('access_type', 'subscription');
    }
  }

  return { success: true, message: 'Subscription updated' };
}

async function handleSubscriptionCancelled(supabase: any, event: any) {
  const subscription = event.data.object;

  const { data: existingSub } = await supabase
    .from('subscription_status')
    .select('user_id')
    .eq('platform_subscription_id', subscription.id)
    .maybeSingle();

  if (existingSub) {
    await supabase
      .from('subscription_status')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('platform_subscription_id', subscription.id);

    await supabase
      .from('user_app_access')
      .update({ is_active: false })
      .eq('user_id', existingSub.user_id)
      .eq('access_type', 'subscription');
  }

  return { success: true, message: 'Subscription cancelled' };
}

async function handleRefund(supabase: any, event: any) {
  const charge = event.data.object;

  const { data: purchase } = await supabase
    .from('purchases')
    .select('id, user_id')
    .eq('platform_transaction_id', charge.payment_intent)
    .maybeSingle();

  if (purchase) {
    await supabase
      .from('purchases')
      .update({ status: 'refunded' })
      .eq('id', purchase.id);

    await supabase
      .from('user_app_access')
      .update({ is_active: false })
      .eq('purchase_id', purchase.id);
  }

  return { success: true, message: 'Refund processed' };
}

async function handlePaymentFailed(supabase: any, event: any) {
  const invoice = event.data.object;

  const { data: existingSub } = await supabase
    .from('subscription_status')
    .select('user_id')
    .eq('platform_subscription_id', invoice.subscription)
    .maybeSingle();

  if (existingSub) {
    await supabase
      .from('subscription_status')
      .update({
        status: 'payment_failed',
        updated_at: new Date().toISOString(),
      })
      .eq('platform_subscription_id', invoice.subscription);
  }

  return { success: true, message: 'Payment failure recorded' };
}

async function handleEntitlementUpdate(supabase: any, event: any) {
  const summary = event.data.object;
  const stripeCustomerId = summary.customer;

  const { data: userProfile } = await supabase
    .from('admin_profiles')
    .select('user_id, email')
    .eq('email', summary.customer_email)
    .maybeSingle();

  if (!userProfile) {
    console.log(`No user found for Stripe customer: ${stripeCustomerId}`);
    return { success: false, message: 'User not found' };
  }

  for (const entitlement of summary.entitlements.data || []) {
    await supabase.from('stripe_entitlements').upsert(
      {
        user_id: userProfile.user_id,
        stripe_customer_id: stripeCustomerId,
        feature_id: entitlement.feature,
        lookup_key: entitlement.lookup_key,
        entitlement_id: entitlement.id,
        is_active: entitlement.livemode ? true : false,
        last_synced_at: new Date().toISOString(),
      },
      { onConflict: 'entitlement_id' }
    );

    if (entitlement.lookup_key) {
      await supabase.from('user_app_access').upsert(
        {
          user_id: userProfile.user_id,
          app_slug: entitlement.lookup_key,
          access_type: 'subscription',
          is_active: true,
          granted_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,app_slug' }
      );
    }
  }

  return { success: true, message: 'Entitlements updated' };
}
