import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from '../_shared/cors.ts';
import { processPurchase, ProcessedPurchase } from '../_shared/purchaseProcessor.ts';
import { Buffer } from "node:buffer";

const PAYPAL_WEBHOOK_ID = Deno.env.get('PAYPAL_WEBHOOK_ID') || '';
const PAYPAL_CLIENT_ID = Deno.env.get('PAYPAL_CLIENT_ID') || '';
const PAYPAL_CLIENT_SECRET = Deno.env.get('PAYPAL_CLIENT_SECRET') || '';

async function verifyPayPalWebhook(req: Request, body: string): Promise<boolean> {
  try {
    const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
    const response = await fetch('https://api-m.paypal.com/v1/notifications/verify-webhook-signature', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        auth_algo: req.headers.get('paypal-auth-algo'),
        cert_url: req.headers.get('paypal-cert-url'),
        transmission_id: req.headers.get('paypal-transmission-id'),
        transmission_sig: req.headers.get('paypal-transmission-sig'),
        transmission_time: req.headers.get('paypal-transmission-time'),
        webhook_id: PAYPAL_WEBHOOK_ID,
        webhook_event: JSON.parse(body),
      }),
    });

    const verification = await response.json();
    return verification.verification_status === 'SUCCESS';
  } catch (error) {
    console.error('PayPal verification error:', error);
    return false;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const body = await req.text();
    
    // Verify webhook signature
    const isValid = await verifyPayPalWebhook(req, body);
    
    if (!isValid) {
      console.error('PayPal webhook signature verification failed');
      
      await supabase.from('webhook_logs').insert({
        platform: 'paypal',
        event_type: 'signature_failed',
        processing_status: 'failed',
      });
      
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid signature' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const event = JSON.parse(body);
    const eventId = req.headers.get('paypal-transmission-id') || event.id;

    // Idempotency check
    const { data: existingEvent } = await supabase
      .from('webhook_logs')
      .select('id')
      .eq('paypal_event_id', eventId)
      .eq('processing_status', 'completed')
      .maybeSingle();

    if (existingEvent) {
      console.log(`PayPal event ${eventId} already processed`);
      return new Response(
        JSON.stringify({ success: true, message: 'Event already processed' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log verified webhook
    await supabase.from("webhook_logs").insert({
      platform: "paypal",
      event_type: event.event_type || "unknown",
      webhook_payload: event,
      processing_status: "pending",
      paypal_event_id: eventId,
    });

    let result;
    const eventType = event.event_type;

    switch (eventType) {
      case "PAYMENT.CAPTURE.COMPLETED":
      case "PAYMENT.SALE.COMPLETED":
        result = await handlePaymentCompleted(supabase, body);
        break;
      case "PAYMENT.CAPTURE.REFUNDED":
      case "PAYMENT.SALE.REFUNDED":
        result = await handleRefund(supabase, body);
        break;
      case "BILLING.SUBSCRIPTION.CREATED":
      case "BILLING.SUBSCRIPTION.ACTIVATED":
        result = await handleSubscriptionCreated(supabase, body);
        break;
      case "BILLING.SUBSCRIPTION.CANCELLED":
      case "BILLING.SUBSCRIPTION.SUSPENDED":
      case "BILLING.SUBSCRIPTION.EXPIRED":
        result = await handleSubscriptionCancelled(supabase, body);
        break;
      case "BILLING.SUBSCRIPTION.UPDATED":
        result = await handleSubscriptionUpdated(supabase, body);
        break;
      case "PAYMENT.CAPTURE.DENIED":
      case "PAYMENT.SALE.DENIED":
        result = await handlePaymentFailed(supabase, body);
        break;
      default:
        console.log(`Unhandled PayPal event: ${eventType}`);
        result = { success: true, message: "Event type not processed" };
    }

    // Mark event as processed
    await supabase
      .from('webhook_logs')
      .update({ 
        processing_status: result.success ? 'completed' : 'failed',
        error_message: result.error || null,
        completed_at: new Date().toISOString()
      })
      .eq('paypal_event_id', eventId)
      .order('created_at', { ascending: false })
      .limit(1);

    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 400,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("PayPal webhook error:", error);
    
    try {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
      );
      
      await supabase.from('webhook_logs').insert({
        platform: 'paypal',
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
          "Content-Type": "application/json",
        },
      }
    );
  }
});

async function handlePaymentCompleted(supabase: any, data: any) {
  const resource = data.resource;
  const amount = resource.amount || resource.seller_receivable_breakdown?.gross_amount;
  const payerInfo = resource.payer || {};

  const purchase: ProcessedPurchase = {
    email: payerInfo.email_address || payerInfo.payer_info?.email,
    productName: resource.custom_id || resource.description || "PayPal Purchase",
    productSku: resource.invoice_id || resource.custom_id,
    amount: parseFloat(amount?.value || "0"),
    currency: amount?.currency_code || "USD",
    transactionId: resource.id || data.id,
    customerId: payerInfo.payer_id || payerInfo.payer_info?.payer_id,
    subscriptionId: resource.billing_agreement_id,
    isSubscription: !!resource.billing_agreement_id,
    purchaseDate: resource.create_time ? new Date(resource.create_time) : new Date(),
  };

  return await processPurchase(supabase, "paypal", purchase, data);
}

async function handleRefund(supabase: any, data: any) {
  const resource = data.resource;
  const transactionId = resource.id || resource.sale_id || resource.capture_id;

  const { data: purchase } = await supabase
    .from("purchases")
    .select("id, user_id")
    .eq("platform_transaction_id", transactionId)
    .maybeSingle();

  if (purchase) {
    await supabase
      .from("purchases")
      .update({ status: "refunded" })
      .eq("id", purchase.id);

    await supabase
      .from("user_app_access")
      .update({ is_active: false })
      .eq("purchase_id", purchase.id);
  }

  return { success: true, message: "Refund processed" };
}

async function handleSubscriptionCreated(supabase: any, data: any) {
  const resource = data.resource;

  const purchase: ProcessedPurchase = {
    email: resource.subscriber?.email_address || resource.custom_id,
    productName: resource.plan_id || "PayPal Subscription",
    productSku: resource.plan_id,
    amount: parseFloat(resource.billing_info?.last_payment?.amount?.value || "0"),
    currency: resource.billing_info?.last_payment?.amount?.currency_code || "USD",
    transactionId: resource.id,
    customerId: resource.subscriber?.payer_id,
    subscriptionId: resource.id,
    isSubscription: true,
    purchaseDate: resource.create_time ? new Date(resource.create_time) : new Date(),
  };

  return await processPurchase(supabase, "paypal", purchase, data);
}

async function handleSubscriptionUpdated(supabase: any, data: any) {
  const resource = data.resource;
  const subscriptionId = resource.id;

  const { data: existingSub } = await supabase
    .from("subscription_status")
    .select("*")
    .eq("platform_subscription_id", subscriptionId)
    .maybeSingle();

  if (existingSub) {
    const isActive = resource.status === "ACTIVE";

    await supabase
      .from("subscription_status")
      .update({
        status: isActive ? "active" : "suspended",
        updated_at: new Date().toISOString(),
      })
      .eq("platform_subscription_id", subscriptionId);

    await supabase
      .from("user_app_access")
      .update({ is_active: isActive })
      .eq("user_id", existingSub.user_id)
      .eq("access_type", "subscription");
  }

  return { success: true, message: "Subscription updated" };
}

async function handleSubscriptionCancelled(supabase: any, data: any) {
  const resource = data.resource;
  const subscriptionId = resource.id;

  const { data: existingSub } = await supabase
    .from("subscription_status")
    .select("user_id")
    .eq("platform_subscription_id", subscriptionId)
    .maybeSingle();

  if (existingSub) {
    await supabase
      .from("subscription_status")
      .update({
        status: "cancelled",
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("platform_subscription_id", subscriptionId);

    await supabase
      .from("user_app_access")
      .update({ is_active: false })
      .eq("user_id", existingSub.user_id)
      .eq("access_type", "subscription");
  }

  return { success: true, message: "Subscription cancelled" };
}

async function handlePaymentFailed(supabase: any, data: any) {
  const resource = data.resource;
  console.log(`Payment failed for transaction: ${resource.id}`);
  return { success: true, message: "Payment failure recorded" };
}
