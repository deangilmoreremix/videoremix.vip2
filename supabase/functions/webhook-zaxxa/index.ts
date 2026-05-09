import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { processPurchase, ProcessedPurchase } from '../_shared/purchaseProcessor.ts';

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

    const body = await req.json();

    await supabase.from('webhook_logs').insert({
      platform: 'zaxxa',
      event_type: body.event || body.type || 'unknown',
      webhook_payload: body,
      processing_status: 'pending',
    });

    let result;

    const eventType = body.event || body.type;

    switch (eventType) {
      case 'sale.completed':
      case 'payment.success':
        result = await handlePaymentSuccess(supabase, body);
        break;
      case 'subscription.created':
      case 'subscription.renewed':
        result = await handleSubscriptionCreated(supabase, body);
        break;
      case 'subscription.updated':
        result = await handleSubscriptionUpdated(supabase, body);
        break;
      case 'subscription.cancelled':
      case 'subscription.suspended':
        result = await handleSubscriptionCancelled(supabase, body);
        break;
      case 'payment.failed':
      case 'subscription.payment_failed':
        result = await handlePaymentFailed(supabase, body);
        break;
      case 'refund.completed':
        result = await handleRefund(supabase, body);
        break;
      default:
        console.log(`Unhandled Zaxxa event: ${eventType}`);
        result = { success: true, message: 'Event type not processed' };
    }

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
    console.error('Zaxxa webhook error:', error);
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

async function handlePaymentSuccess(supabase: any, data: any) {
  const customerData = data.customer || data.buyer || {};
  const productData = data.product || data.item || {};

  const purchase: ProcessedPurchase = {
    email: customerData.email || data.email,
    productName: productData.name || data.product_name || 'Unknown Product',
    productSku: productData.sku || data.sku,
    amount: parseFloat(data.amount || data.total || '0'),
    currency: data.currency || 'USD',
    transactionId: data.transaction_id || data.id,
    customerId: customerData.id || data.customer_id,
    subscriptionId: data.subscription_id,
    isSubscription: !!data.subscription_id || data.is_subscription,
    purchaseDate: data.completed_at ? new Date(data.completed_at) : new Date(),
  };

  return await processPurchase(supabase, 'zaxxa', purchase, data);
}

async function handleSubscriptionCreated(supabase: any, data: any) {
  return await handlePaymentSuccess(supabase, {
    ...data,
    subscription_id: data.subscription_id || data.id,
    is_subscription: true,
  });
}

async function handleSubscriptionCancelled(supabase: any, data: any) {
  const subscriptionId = data.subscription_id || data.id;

  const { data: existingSub } = await supabase
    .from('subscription_status')
    .select('user_id')
    .eq('platform_subscription_id', subscriptionId)
    .maybeSingle();

  if (existingSub) {
    await supabase
      .from('subscription_status')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('platform_subscription_id', subscriptionId);

    await supabase
      .from('user_app_access')
      .update({ is_active: false })
      .eq('user_id', existingSub.user_id)
      .eq('access_type', 'subscription');
  }

  return { success: true, message: 'Subscription cancelled' };
}

async function handleSubscriptionUpdated(supabase: any, data: any) {
  const subscriptionId = data.subscription_id || data.id;

  const { data: existingSub } = await supabase
    .from('subscription_status')
    .select('*')
    .eq('platform_subscription_id', subscriptionId)
    .maybeSingle();

  if (existingSub) {
    const isActive = data.status === 'active' || data.status === 'ACTIVE';

    await supabase
      .from('subscription_status')
      .update({
        status: isActive ? 'active' : 'suspended',
        updated_at: new Date().toISOString(),
      })
      .eq('platform_subscription_id', subscriptionId);

    await supabase
      .from('user_app_access')
      .update({ is_active: isActive })
      .eq('user_id', existingSub.user_id)
      .eq('access_type', 'subscription');
  }

  return { success: true, message: 'Subscription updated' };
}

async function handlePaymentFailed(supabase: any, data: any) {
  const subscriptionId = data.subscription_id || data.id;

  const { data: existingSub } = await supabase
    .from('subscription_status')
    .select('user_id')
    .eq('platform_subscription_id', subscriptionId)
    .maybeSingle();

  if (existingSub) {
    await supabase
      .from('subscription_status')
      .update({
        status: 'payment_failed',
        updated_at: new Date().toISOString(),
      })
      .eq('platform_subscription_id', subscriptionId);

    console.log(`Payment failed for subscription ${subscriptionId}. Grace period will be applied.`);
  }

  return { success: true, message: 'Payment failure recorded' };
}

async function handleRefund(supabase: any, data: any) {
  const transactionId = data.transaction_id || data.original_transaction_id;

  const { data: purchase } = await supabase
    .from('purchases')
    .select('id, user_id')
    .eq('platform_transaction_id', transactionId)
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
