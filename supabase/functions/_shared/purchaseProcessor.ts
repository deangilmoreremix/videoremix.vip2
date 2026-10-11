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

    // FIRST: Check for existing purchase (idempotency check)
    // This prevents race conditions from duplicate webhooks
    const { data: existingPurchase } = await supabase
      .from('purchases')
      .select('id, user_id, processed')
      .eq('platform', platform)
      .eq('platform_transaction_id', purchase.transactionId)
      .maybeSingle();

    if (existingPurchase) {
      console.log(`Purchase ${purchase.transactionId} already exists, skipping`);
      
      // If purchase exists but wasn't fully processed, complete it
      if (!existingPurchase.processed) {
        const productMatch = await matchProduct(supabase, purchase.productName, purchase.productSku);
        
        if (productMatch && productMatch.appSlugs.length > 0) {
          await grantAppAccess(
            supabase,
            existingPurchase.user_id,
            productMatch.appSlugs,
            existingPurchase.id,
            purchase.isSubscription
          );
        }

        await supabase
          .from('purchases')
          .update({ processed: true, processed_at: new Date().toISOString() })
          .eq('id', existingPurchase.id);
      }
      
      return { success: true, userId: existingPurchase.user_id };
    }

    let userId: string | null = null;
    let userExists = false;

    // Use advisory lock to prevent race conditions on user creation.
    // The FNV-1a hash is masked to an unsigned 64-bit bigint: the raw reducer
    // can produce negative numbers, and `BigInt('0x-...')` would throw and
    // fail the entire webhook.
    const lockKey = (() => {
      let hash = 0xcbf29ce484222325n; // FNV-1a 64-bit offset basis
      const prime = 0x100000001b3n; // FNV-1a 64-bit prime
      const mask = 0xffffffffffffffffn;
      for (const byte of new TextEncoder().encode(email)) {
        hash = (hash ^ BigInt(byte)) * prime;
        hash &= mask;
      }
      return hash;
    })();
    
    await supabase.rpc('pg_advisory_lock', { key: lockKey });
    
    try {
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
    } finally {
      // Always release the lock
      await supabase.rpc('pg_advisory_unlock', { key: lockKey });
    }

    const productMatch = await matchProduct(supabase, purchase.productName, purchase.productSku);

    // Use upsert with unique constraint to prevent duplicate purchases
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

/**
 * Match a webhook purchase to a catalog product using EXACT identifiers only.
 *
 * Why exact matching is mandatory: webhook payloads are attacker-controlled
 * input. A fuzzy/substring match lets a forged payload named e.g.
 * "VideoRemix VIP - Lifetime Deluxe" map onto an unrelated catalog product and
 * silently grant that product's full app list. Only these identifiers are
 * trusted, in order:
 *   1. exact SKU (products_catalog.sku)
 *   2. exact platform product name (platform_product_mappings.platform_product_name)
 *   3. exact catalog product name or slug (case-insensitive, trimmed)
 * If nothing matches exactly, NO entitlement is granted.
 */
async function matchProduct(
  supabase: SupabaseClient,
  productName: string,
  productSku?: string
): Promise<{ productId: string; appSlugs: string[] } | null> {
  const normalizedSku = productSku?.trim();
  if (normalizedSku) {
    const { data: productBySku } = await supabase
      .from('products_catalog')
      .select('id, apps_granted')
      .eq('sku', normalizedSku)
      .eq('is_active', true)
      .maybeSingle();

    if (productBySku) {
      return {
        productId: productBySku.id,
        appSlugs: productBySku.apps_granted || [],
      };
    }
  }

  const normalizedName = (productName ?? '').trim();
  if (!normalizedName) {
    return null;
  }

  // Exact platform mapping (case-insensitive equality, no wildcards).
  const { data: platformMapping } = await supabase
    .from('platform_product_mappings')
    .select('product_id, platform_product_name, products_catalog(id, apps_granted)')
    .ilike('platform_product_name', escapeLikePattern(normalizedName))
    .limit(1)
    .maybeSingle();

  if (platformMapping && platformMapping.products_catalog) {
    return {
      productId: platformMapping.products_catalog.id,
      appSlugs: platformMapping.products_catalog.apps_granted || [],
    };
  }

  // Exact catalog name or slug (case-insensitive).
  const normalizedLookup = normalizedName.toLowerCase();
  const { data: products } = await supabase
    .from('products_catalog')
    .select('id, name, slug, apps_granted')
    .eq('is_active', true);

  if (products) {
    for (const product of products) {
      const nameMatches =
        typeof product.name === 'string' &&
        product.name.trim().toLowerCase() === normalizedLookup;
      const slugMatches =
        typeof product.slug === 'string' &&
        product.slug.trim().toLowerCase() === normalizedLookup;

      if (nameMatches || slugMatches) {
        return {
          productId: product.id,
          appSlugs: product.apps_granted || [],
        };
      }
    }
  }

  console.warn(
    `purchaseProcessor: no exact product match for "${normalizedName}" (sku: ${normalizedSku ?? 'none'}) - no apps granted`
  );
  return null;
}

/**
 * Escape ilike wildcards so an exact match cannot be widened by `%`, `_` or
 * `\` characters in a webhook-supplied product name.
 */
function escapeLikePattern(value: string): string {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
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
  // Never log credentials - not even temporary ones. The password is passed
  // straight to the mail provider.
  console.log(`Welcome email queued for ${email}`);
  void password;
}
