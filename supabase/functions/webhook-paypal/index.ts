import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient, SupabaseClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface ProcessedPurchase {
  email: string;
  productName: string;
  productSku?: string;
  amount: number;
  currency: string;
  transactionId: string;
  customerId?: string;
  subscriptionId?: string;
  isSubscription: boolean;
  purchaseDate: Date;
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

    const body = await req.json();

    await supabase.from("webhook_logs").insert({
      platform: "paypal",
      event_type: body.event_type || "unknown",
      webhook_payload: body,
      processing_status: "pending",
    });

    let result;
    const eventType = body.event_type;

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

    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 400,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("PayPal webhook error:", error);
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

async function processPurchase(
  supabase: SupabaseClient,
  platform: string,
  purchase: ProcessedPurchase,
  webhookData: any
): Promise<{ success: boolean; error?: string; userId?: string }> {
  try {
    const email = purchase.email.toLowerCase().trim();
    let userId: string | null = null;

    const { data: existingUser } = await supabase
      .from('admin_profiles')
      .select('user_id')
      .eq('email', email)
      .maybeSingle();

    if (existingUser) {
      userId = existingUser.user_id;
    } else {
      const tempPassword = generateSecurePassword();
      const { data: newUser, error: signUpError } = await supabase.auth.admin.createUser({
        email: email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          created_via: 'purchase_webhook',
          platform: platform,
        },
      });

      if (signUpError || !newUser.user) {
        console.error('Failed to create user:', signUpError);
        return { success: false, error: 'Failed to create user account' };
      }

      userId = newUser.user.id;
    }

    const productMatch = await matchProduct(supabase, purchase.productName, purchase.productSku);

    const { data: purchaseRecord, error: purchaseError } = await supabase
      .from('purchases')
      .insert({
        user_id: userId,
        email: email,
        platform: platform,
        platform_transaction_id: purchase.transactionId,
        platform_customer_id: purchase.customerId,
        product_id: productMatch?.productId,
        product_name: purchase.productName,
        product_sku: purchase.productSku,
        amount: purchase.amount,
        currency: purchase.currency,
        status: 'completed',
        subscription_id: purchase.subscriptionId,
        is_subscription: purchase.isSubscription,
        purchase_date: purchase.purchaseDate.toISOString(),
        webhook_data: webhookData,
        processed: false,
      })
      .select()
      .single();

    if (purchaseError) {
      console.error('Failed to create purchase record:', purchaseError);
      return { success: false, error: 'Failed to record purchase' };
    }

    if (productMatch && productMatch.appSlugs.length > 0) {
      await grantAppAccess(
        supabase,
        userId,
        productMatch.appSlugs,
        purchaseRecord.id,
        purchase.isSubscription
      );
    }

    await supabase
      .from('purchases')
      .update({ processed: true, processed_at: new Date().toISOString() })
      .eq('id', purchaseRecord.id);

    if (purchase.isSubscription && purchase.subscriptionId) {
      await createSubscriptionStatus(
        supabase,
        userId,
        purchaseRecord.id,
        platform,
        purchase.subscriptionId
      );
    }

    return { success: true, userId };
  } catch (error) {
    console.error('Error processing purchase:', error);
    return { success: false, error: error.message };
  }
}

async function matchProduct(
  supabase: SupabaseClient,
  productName: string,
  productSku?: string
): Promise<{ productId: string; appSlugs: string[] } | null> {
  if (productSku) {
    const { data: productBySku } = await supabase
      .from('products_catalog')
      .select('id, apps_granted')
      .eq('sku', productSku)
      .eq('is_active', true)
      .maybeSingle();

    if (productBySku) {
      return {
        productId: productBySku.id,
        appSlugs: productBySku.apps_granted || [],
      };
    }
  }

  const { data: platformMapping } = await supabase
    .from('platform_product_mappings')
    .select('product_id, products_catalog(id, apps_granted)')
    .ilike('platform_product_name', `%${productName}%`)
    .order('match_confidence', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (platformMapping && platformMapping.products_catalog) {
    return {
      productId: platformMapping.products_catalog.id,
      appSlugs: platformMapping.products_catalog.apps_granted || [],
    };
  }

  const normalizedName = productName.toLowerCase().replace(/[^a-z0-9]/g, '');
  const { data: productByName } = await supabase
    .from('products_catalog')
    .select('id, name, slug, apps_granted')
    .eq('is_active', true);

  if (productByName) {
    for (const product of productByName) {
      const normalizedProductName = product.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (normalizedProductName.includes(normalizedName) || normalizedName.includes(normalizedProductName)) {
        return {
          productId: product.id,
          appSlugs: product.apps_granted || [],
        };
      }
    }
  }

  return null;
}

async function grantAppAccess(
  supabase: SupabaseClient,
  userId: string,
  appSlugs: string[],
  purchaseId: string,
  isSubscription: boolean
): Promise<void> {
  const accessRecords = appSlugs.map((slug) => ({
    user_id: userId,
    app_slug: slug,
    purchase_id: purchaseId,
    access_type: isSubscription ? 'subscription' : 'lifetime',
    granted_at: new Date().toISOString(),
    expires_at: isSubscription ? getSubscriptionExpiry() : null,
    is_active: true,
  }));

  for (const record of accessRecords) {
    await supabase
      .from('user_app_access')
      .upsert(record, { onConflict: 'user_id,app_slug' });
  }
}

async function createSubscriptionStatus(
  supabase: SupabaseClient,
  userId: string,
  purchaseId: string,
  platform: string,
  subscriptionId: string
): Promise<void> {
  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  await supabase.from('subscription_status').insert({
    user_id: userId,
    purchase_id: purchaseId,
    platform: platform,
    platform_subscription_id: subscriptionId,
    status: 'active',
    current_period_start: now.toISOString(),
    current_period_end: periodEnd.toISOString(),
    cancel_at_period_end: false,
  });
}

function generateSecurePassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  for (let i = 0; i < 16; i++) {
    password += chars[array[i] % chars.length];
  }
  return password;
}

function getSubscriptionExpiry(): string {
  const expiry = new Date();
  expiry.setMonth(expiry.getMonth() + 1);
  return expiry.toISOString();
}

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
