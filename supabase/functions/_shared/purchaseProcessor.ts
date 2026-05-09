import { SupabaseClient } from 'npm:@supabase/supabase-js@2';

export interface ProcessedPurchase {
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

export async function processPurchase(
  supabase: SupabaseClient,
  platform: string,
  purchase: ProcessedPurchase,
  webhookData: any
): Promise<{ success: boolean; error?: string; userId?: string }> {
  try {
    const email = purchase.email.toLowerCase().trim();

    let userId: string | null = null;
    let userExists = false;

    const { data: existingUser } = await supabase
      .from('admin_profiles')
      .select('user_id')
      .eq('email', email)
      .maybeSingle();

    if (existingUser) {
      userId = existingUser.user_id;
      userExists = true;
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

      await sendWelcomeEmail(email, tempPassword);
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

async function sendWelcomeEmail(email: string, password: string): Promise<void> {
  console.log(`TODO: Send welcome email to ${email} with password: ${password}`);
}
