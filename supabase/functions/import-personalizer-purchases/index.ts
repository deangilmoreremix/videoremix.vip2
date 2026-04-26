import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface CSVPurchase {
  no: string;
  date: string;
  productName: string;
  amount: string;
  paymentType: string;
  paymentStatus: string;
  buyerCountry: string;
  customerName: string;
  totalAmount: string;
  zaxxaTxnId: string;
  paypalTxnId: string;
  currency: string;
  paymentProcessor: string;
  customerEmail: string;
  paypalPreapprovalKey: string;
  startFrom: string;
  recurringPeriod: string;
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

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: csvData } = await req.json();

    if (!csvData || !Array.isArray(csvData)) {
      return new Response(
        JSON.stringify({ error: "Invalid CSV data format" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const results = {
      total: csvData.length,
      successful: 0,
      failed: 0,
      skipped: 0,
      usersCreated: 0,
      usersExisting: 0,
      accessGranted: 0,
      errors: [] as string[],
      details: [] as any[],
    };

    for (const row of csvData) {
      try {
        const purchase = parseCSVRow(row);

        if (!purchase.customerEmail || purchase.customerEmail === '-') {
          results.skipped++;
          results.details.push({
            row: row.NO,
            status: 'skipped',
            reason: 'No email address',
          });
          continue;
        }

        if (purchase.paymentStatus.toLowerCase() === 'refunded') {
          results.skipped++;
          results.details.push({
            row: row.NO,
            status: 'skipped',
            reason: 'Refunded transaction',
          });
          continue;
        }

        const result = await importPurchase(supabase, purchase);

        if (result.success) {
          results.successful++;
          if (result.userCreated) results.usersCreated++;
          if (result.userExisted) results.usersExisting++;
          if (result.appsGranted) results.accessGranted += result.appsGranted;

          results.details.push({
            row: row.NO,
            email: purchase.customerEmail,
            status: 'success',
            userId: result.userId,
            userCreated: result.userCreated,
            appsGranted: result.appsGranted,
            productName: purchase.productName,
          });
        } else {
          results.failed++;
          results.errors.push(`Row ${row.NO}: ${result.error}`);
          results.details.push({
            row: row.NO,
            email: purchase.customerEmail,
            status: 'failed',
            error: result.error,
            productName: purchase.productName,
          });
        }
      } catch (error) {
        results.failed++;
        results.errors.push(`Row ${row.NO}: ${error.message}`);
      }
    }

    return new Response(JSON.stringify(results), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Import error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

function parseCSVRow(row: any): CSVPurchase {
  return {
    no: row.NO || '',
    date: row.DATE || '',
    productName: row['PRODUCT NAME'] || '',
    amount: row.AMOUNT || '0',
    paymentType: row['PAYMENT TYPE'] || '',
    paymentStatus: row['PAYMENT STATUS'] || '',
    buyerCountry: row['BUYER COUNTRY'] || '',
    customerName: row['CUSTOMER NAME'] || '',
    totalAmount: row['TOTAL AMOUNT'] || '0',
    zaxxaTxnId: row['ZAXAA TXN ID'] || '',
    paypalTxnId: row['PAYPAL TXN ID'] || '',
    currency: row.CURRENCY || 'USD',
    paymentProcessor: row['PAYMENT PROCESSOR'] || 'paypal',
    customerEmail: row['CUSTOMER EMAIL'] || '',
    paypalPreapprovalKey: row['PAYPAL PREAPPROVAL KEY'] || '',
    startFrom: row['START FROM'] || '',
    recurringPeriod: row['RECURRING PERIOD'] || '',
  };
}

async function importPurchase(
  supabase: any,
  purchase: CSVPurchase
): Promise<{
  success: boolean;
  error?: string;
  userId?: string;
  userCreated?: boolean;
  userExisted?: boolean;
  appsGranted?: number;
}> {
  try {
    const email = purchase.customerEmail.toLowerCase().trim();
    let userId: string | null = null;
    let userCreated = false;
    let userExisted = false;

    // Check if user exists by fetching all users with pagination
    let allUsers = [];
    let page = 1;
    const perPage = 1000;
    let foundUser = null;

    while (!foundUser) {
      const { data: usersPage, error: listError } = await supabase.auth.admin.listUsers({ page, perPage });

      if (listError) {
        console.error('Error fetching users page', page, ':', listError);
        break;
      }

      if (!usersPage?.users || usersPage.users.length === 0) break;

      foundUser = usersPage.users.find((u: any) => u.email?.toLowerCase() === email.toLowerCase());

      if (usersPage.users.length < perPage) break;
      page++;
    }

    if (foundUser) {
      userId = foundUser.id;
      userExisted = true;
    } else {
      const tempPassword = generateSecurePassword();
      const { data: newUser, error: signUpError } = await supabase.auth.admin.createUser({
        email: email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          created_via: 'csv_import',
          customer_name: purchase.customerName,
        },
      });

      if (signUpError || !newUser.user) {
        console.error('Failed to create user:', signUpError);
        return { success: false, error: `Failed to create user: ${signUpError?.message || 'Unknown error'}` };
      }

      userId = newUser.user.id;
      userCreated = true;
    }

    const productMatch = await matchProductFromName(supabase, purchase.productName);

    const transactionId = purchase.paypalTxnId || purchase.zaxxaTxnId;
    // Generate transaction ID if missing (for CSV imports)
    let transactionId = purchase.paypalTxnId || purchase.zaxxaTxnId;
    if (!transactionId) {
      transactionId = `csv_import_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    const { data: existingPurchase } = await supabase
      .from('purchases')
      .select('id')
      .eq('platform_transaction_id', transactionId)
      .maybeSingle();

    if (existingPurchase) {
      return { success: false, error: 'Purchase already exists' };
    }

    const isSubscription = purchase.paymentType.toLowerCase() === 'subscription';
    const amount = parseFloat(purchase.amount.replace(/[^0-9.]/g, ''));
    const purchaseDate = parseDate(purchase.date);

    const { data: purchaseRecord, error: purchaseError } = await supabase
      .from('purchases')
      .insert({
        user_id: userId,
        email: email,
        platform: 'zaxxa',
        platform_transaction_id: transactionId,
        platform_customer_id: purchase.paypalPreapprovalKey || null,
        product_id: productMatch?.productId,
        product_name: purchase.productName,
        amount: amount,
        currency: purchase.currency,
        status: mapPaymentStatus(purchase.paymentStatus),
        subscription_id: isSubscription ? purchase.paypalPreapprovalKey : null,
        is_subscription: isSubscription,
        purchase_date: purchaseDate.toISOString(),
        webhook_data: { csv_import: true, original_row: purchase },
        processed: true,
        processed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (purchaseError) {
      console.error('Failed to create purchase record:', purchaseError);
      return { success: false, error: 'Failed to record purchase' };
    }

    let appsGranted = 0;
    if (productMatch && productMatch.appSlugs.length > 0 && purchase.paymentStatus.toLowerCase().includes('completed')) {
      await grantAppAccess(
        supabase,
        userId,
        productMatch.appSlugs,
        purchaseRecord.id,
        isSubscription,
        purchaseDate,
        purchase.recurringPeriod
      );
      appsGranted = productMatch.appSlugs.length;
    }

    if (isSubscription && purchase.paypalPreapprovalKey) {
      await createSubscriptionStatus(
        supabase,
        userId,
        purchaseRecord.id,
        purchase.paypalPreapprovalKey,
        purchaseDate,
        purchase.recurringPeriod,
        purchase.paymentStatus
      );
    }

    return { success: true, userId, userCreated, userExisted, appsGranted };
  } catch (error) {
    console.error('Error importing purchase:', error);
    return { success: false, error: error.message || 'Unknown error occurred' };
  }
}

async function matchProductFromName(
  supabase: any,
  productName: string
): Promise<{ productId: string; appSlugs: string[] } | null> {
  const normalizedName = productName.toLowerCase();

  let productSlug = null;

  if (normalizedName.includes('personalizer ai agency') && normalizedName.includes('monthly')) {
    productSlug = 'personalizer-monthly';
  } else if (normalizedName.includes('personalizer ai agency') && normalizedName.includes('yearly')) {
    productSlug = 'personalizer-yearly';
  } else if (normalizedName.includes('personalizer ai agency') && normalizedName.includes('lifetime')) {
    productSlug = 'personalizer-lifetime';
  } else if (normalizedName.includes('writing toolkit')) {
    productSlug = 'personalizer-writing-toolkit';
  } else if (normalizedName.includes('advanced text-video')) {
    productSlug = 'personalizer-text-video-editor';
  } else if (normalizedName.includes('url video generation')) {
    productSlug = 'personalizer-url-video';
  } else if (normalizedName.includes('interactive shopping')) {
    productSlug = 'personalizer-interactive-shopping';
  } else if (normalizedName.includes('video and image transformer')) {
    productSlug = 'personalizer-video-transformer';
  }

  if (!productSlug) {
    return null;
  }

  const { data: product } = await supabase
    .from('products_catalog')
    .select('id, apps_granted')
    .eq('slug', productSlug)
    .eq('is_active', true)
    .maybeSingle();

  if (product) {
    return {
      productId: product.id,
      appSlugs: product.apps_granted || [],
    };
  }

  return null;
}

async function grantAppAccess(
  supabase: any,
  userId: string,
  appSlugs: string[],
  purchaseId: string,
  isSubscription: boolean,
  purchaseDate: Date,
  recurringPeriod: string
): Promise<void> {
  const expiresAt = isSubscription ? calculateExpiryDate(purchaseDate, recurringPeriod) : null;

  const accessRecords = appSlugs.map((slug) => ({
    user_id: userId,
    app_slug: slug,
    purchase_id: purchaseId,
    access_type: isSubscription ? 'subscription' : 'lifetime',
    granted_at: purchaseDate.toISOString(),
    expires_at: expiresAt,
    is_active: true,
  }));

  for (const record of accessRecords) {
    await supabase
      .from('user_app_access')
      .upsert(record, { onConflict: 'user_id,app_slug' });
  }
}

async function createSubscriptionStatus(
  supabase: any,
  userId: string,
  purchaseId: string,
  subscriptionId: string,
  startDate: Date,
  recurringPeriod: string,
  paymentStatus: string
): Promise<void> {
  const periodEnd = calculateExpiryDate(startDate, recurringPeriod);

  const status = mapPaymentStatus(paymentStatus) === 'completed' ? 'active' : 'payment_failed';

  const { data: existing } = await supabase
    .from('subscription_status')
    .select('id')
    .eq('platform_subscription_id', subscriptionId)
    .maybeSingle();

  if (!existing) {
    await supabase.from('subscription_status').insert({
      user_id: userId,
      purchase_id: purchaseId,
      platform: 'zaxxa',
      platform_subscription_id: subscriptionId,
      status: status,
      current_period_start: startDate.toISOString(),
      current_period_end: periodEnd,
      cancel_at_period_end: false,
    });
  }
}

function calculateExpiryDate(startDate: Date, recurringPeriod: string): string {
  const expiry = new Date(startDate);
  const period = recurringPeriod.toLowerCase();

  if (period === 'monthly') {
    expiry.setMonth(expiry.getMonth() + 1);
  } else if (period === 'yearly') {
    expiry.setFullYear(expiry.getFullYear() + 1);
  } else {
    expiry.setMonth(expiry.getMonth() + 1);
  }

  return expiry.toISOString();
}

function parseDate(dateString: string): Date {
  const cleaned = dateString.replace(' ET', '').trim();
  const date = new Date(cleaned);

  if (isNaN(date.getTime())) {
    return new Date();
  }

  return date;
}

function mapPaymentStatus(status: string): string {
  const normalized = status.toLowerCase().trim();

  if (normalized === 'completed') return 'completed';
  if (normalized === 'pending') return 'pending';
  if (normalized === 'refunded') return 'refunded';

  return 'pending';
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
