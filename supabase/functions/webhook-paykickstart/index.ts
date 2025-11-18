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
      platform: 'paykickstart',
      event_type: body.event_type || 'unknown',
      webhook_payload: body,
      processing_status: 'pending',
    });

    let result;

    switch (body.event_type) {
      case 'order_success':
      case 'sale_success':
        result = await handleSaleSuccess(supabase, body);
        break;
      case 'subscription_created':
        result = await handleSubscriptionCreated(supabase, body);
        break;
      case 'subscription_cancelled':
        result = await handleSubscriptionCancelled(supabase, body);
        break;
      case 'refund':
        result = await handleRefund(supabase, body);
        break;
      default:
        console.log(`Unhandled PayKickstart event: ${body.event_type}`);
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
    console.error('PayKickstart webhook error:', error);
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

async function handleSaleSuccess(supabase: any, data: any) {
  const purchase: ProcessedPurchase = {
    email: data.customer?.email || data.email,
    productName: data.product?.name || data.product_name,
    productSku: data.product?.sku || data.sku,
    amount: parseFloat(data.amount || data.total || '0'),
    currency: data.currency || 'USD',
    transactionId: data.transaction_id || data.order_id,
    customerId: data.customer?.id || data.customer_id,
    subscriptionId: data.subscription_id,
    isSubscription: !!data.subscription_id,
    purchaseDate: data.created_at ? new Date(data.created_at) : new Date(),
  };

  return await processPurchase(supabase, 'paykickstart', purchase, data);
}

async function handleSubscriptionCreated(supabase: any, data: any) {
  return await handleSaleSuccess(supabase, { ...data, subscription_id: data.subscription_id || data.id });
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

async function handleRefund(supabase: any, data: any) {
  const transactionId = data.transaction_id || data.order_id;

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
