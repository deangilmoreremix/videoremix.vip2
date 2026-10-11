import { SupabaseClient } from 'npm:@supabase/supabase-js@2';
import { normalizeEmail, resolveVerifiedIdentity } from './identity.ts';

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

export interface ProcessPurchaseResult {
  success: boolean;
  error?: string;
  userId?: string;
}

/**
 * Record a purchase and grant the entitlements its catalog product defines.
 *
 * IDENTITY CONTRACT (Clerk as customer IdP - do not regress):
 *   The purchase MUST resolve to a verified Clerk identity via
 *   public.clerk_identities (see _shared/identity.ts). Temporary Supabase-auth
 *   customers are NEVER created: a UUID user id can never match a Clerk user,
 *   so grants keyed by one land on an identity the purchaser cannot reach.
 *   When identity cannot be verified this function fails CLOSED: the purchase
 *   row is kept for reconciliation with user_id = NULL and status 'pending'
 *   (no product grant, no subscription row). A later webhook re-delivery (or
 *   scripts/migration-reconcile.mjs) completes it once the buyer has a
 *   verified identity.
 *
 * Entitlement matching stays exact-match only (matchProduct below).
 */
export async function processPurchase(
  supabase: SupabaseClient,
  platform: string,
  purchase: ProcessedPurchase,
  webhookData: any
): Promise<ProcessPurchaseResult> {
  try {
    const email = normalizeEmail(purchase.email);

    // A purchase without an email can never be resolved to an identity - and
    // without email the purchase itself cannot be reconciled either. Record
    // nothing (the webhook layer already logged the raw event).
    if (!email) {
      console.error('processPurchase: purchase has no email; refusing to record');
      return { success: false, error: 'missing_email' };
    }

    // FIRST: Check for existing purchase (idempotency check)
    // This prevents race conditions from duplicate webhooks
    const { data: existingPurchase } = await supabase
      .from('purchases')
      .select('id, user_id, processed')
      .eq('platform', platform)
      .eq('platform_transaction_id', purchase.transactionId)
      .maybeSingle();

    if (existingPurchase) {
      if (existingPurchase.processed) {
        console.log(`Purchase ${purchase.transactionId} already exists, skipping`);
        return { success: true, userId: existingPurchase.user_id };
      }

      // A previous delivery recorded the purchase but could not complete it
      // (identity unverified at the time, or a grant failure). Retry the
      // identity resolution now - the buyer may have signed up via Clerk
      // since. If still unverified, stay pending and fail closed.
      console.log(`Purchase ${purchase.transactionId} exists but is not processed; retrying`);
      const retryIdentity = await resolveVerifiedIdentity(supabase, email);
      if (retryIdentity.status !== 'verified') {
        return { success: false, error: 'identity_unverified' };
      }

      const retryUserId = retryIdentity.identity.clerkUserId;
      // Attach (or re-key) the purchase to the verified Clerk sub. A row may
      // carry a legacy Supabase UUID user_id from before the Clerk migration;
      // the verified identity is authoritative because its provenance was
      // checked (svix-verified webhook or Clerk Backend API), never guessed.
      if (existingPurchase.user_id !== retryUserId) {
        const { error: attachError } = await supabase
          .from('purchases')
          .update({ user_id: retryUserId, status: 'completed' })
          .eq('id', existingPurchase.id);
        if (attachError) {
          console.error('Failed to attach identity to existing purchase:', attachError.message);
          return { success: false, error: 'Failed to record purchase' };
        }
      }
      const productMatch = await matchProduct(supabase, purchase.productName, purchase.productSku);

      if (productMatch && productMatch.appSlugs.length > 0) {
        const grant = await grantAppAccess(
          supabase,
          retryUserId,
          productMatch.appSlugs,
          existingPurchase.id,
          purchase.isSubscription
        );
        if (!grant.ok) {
          return { success: false, error: 'Failed to grant app access' };
        }
      }

      await supabase
        .from('purchases')
        .update({ processed: true, processed_at: new Date().toISOString() })
        .eq('id', existingPurchase.id);

      if (purchase.isSubscription && purchase.subscriptionId) {
        await createSubscriptionStatus(
          supabase,
          retryUserId,
          existingPurchase.id,
          platform,
          purchase.subscriptionId
        );
      }

      return { success: true, userId: retryUserId };
    }

    // Use advisory lock to prevent race conditions on concurrent webhook
    // deliveries for the same purchaser (duplicate purchase rows, double
    // grant attempts).
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

    // NOTE: supabase-js JSON-serializes RPC params; JSON.stringify throws on
    // BigInt ("Do not know how to serialize a BigInt"), which would fail the
    // entire webhook. pg_advisory_lock accepts the decimal string form.
    const lockKeyParam = lockKey.toString();

    await supabase.rpc('pg_advisory_lock', { key: lockKeyParam });

    let verifiedUserId: string | null = null;
    try {
      // Resolve the buyer's verified Clerk identity. Fail closed: if this is
      // not 'verified', no entitlement is granted and the purchase stays
      // 'pending' with user_id NULL for reconciliation.
      const identity = await resolveVerifiedIdentity(supabase, email);
      if (identity.status === 'verified') {
        verifiedUserId = identity.identity.clerkUserId;
      } else {
        console.warn(
          `processPurchase: identity not verified for purchase ${purchase.transactionId} (${identity.status === 'unverified' ? identity.reason : 'unknown'}) - purchase recorded as pending, no access granted`
        );
      }
    } finally {
      // Always release the lock
      await supabase.rpc('pg_advisory_unlock', { key: lockKeyParam });
    }

    const productMatch = await matchProduct(supabase, purchase.productName, purchase.productSku);

    // Use upsert with unique constraint to prevent duplicate purchases
    const { data: purchaseRecord, error: purchaseError } = await supabase
      .from('purchases')
      .insert({
        user_id: verifiedUserId,
        email: email,
        platform: platform,
        platform_transaction_id: purchase.transactionId,
        platform_customer_id: purchase.customerId,
        product_id: productMatch?.productId,
        product_name: purchase.productName,
        product_sku: purchase.productSku,
        amount: purchase.amount,
        currency: purchase.currency,
        // An unverified-identity purchase is recorded as 'pending' (allowed by
        // the purchases_status_check constraint) so it never masquerades as a
        // completed grant. user_app_access is untouched in that case.
        status: verifiedUserId ? 'completed' : 'pending',
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

    // Fail closed: without a verified identity there is no grant, no
    // subscription row, and the purchase stays unprocessed.
    if (!verifiedUserId) {
      return { success: false, error: 'identity_unverified' };
    }

    if (productMatch && productMatch.appSlugs.length > 0) {
      const grant = await grantAppAccess(
        supabase,
        verifiedUserId,
        productMatch.appSlugs,
        purchaseRecord.id,
        purchase.isSubscription
      );
      if (!grant.ok) {
        console.error(
          `Failed to grant app access for purchase ${purchase.transactionId}: ${grant.error ?? 'unknown'}`
        );
        return { success: false, error: 'Failed to grant app access' };
      }
    }

    await supabase
      .from('purchases')
      .update({ processed: true, processed_at: new Date().toISOString() })
      .eq('id', purchaseRecord.id);

    if (purchase.isSubscription && purchase.subscriptionId) {
      await createSubscriptionStatus(
        supabase,
        verifiedUserId,
        purchaseRecord.id,
        platform,
        purchase.subscriptionId
      );
    }

    return { success: true, userId: verifiedUserId };
  } catch (error: any) {
    console.error('Error processing purchase:', error?.message ?? error);
    return { success: false, error: error?.message ?? 'Unknown error' };
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
    // supabase-js types embedded resources as arrays; PostgREST returns an
    // object for to-one embeds. Normalize so both shapes work.
    const embedded = platformMapping.products_catalog;
    const catalog = Array.isArray(embedded) ? embedded[0] : embedded;
    if (catalog) {
      return {
        productId: catalog.id,
        appSlugs: catalog.apps_granted || [],
      };
    }
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

/**
 * Grant app access for the verified Clerk user. upsert on
 * (user_id, app_slug) makes retries idempotent. user_id is a Clerk sub and
 * requires public.user_app_access.user_id to be TEXT (phase-2 re-key); if the
 * column is still UUID the write fails and the caller reports grant failure
 * (fail closed - no silent entitlement loss).
 */
async function grantAppAccess(
  supabase: SupabaseClient,
  userId: string,
  appSlugs: string[],
  purchaseId: string,
  isSubscription: boolean
): Promise<{ ok: true } | { ok: false; error?: string }> {
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
    const { error } = await supabase
      .from('user_app_access')
      .upsert(record, { onConflict: 'user_id,app_slug' });
    if (error) {
      return { ok: false, error: error.message };
    }
  }

  return { ok: true };
}

async function createSubscriptionStatus(
  supabase: SupabaseClient,
  userId: string,
  purchaseId: string,
  platform: string,
  subscriptionId: string
): Promise<void> {
  // Guard against duplicates on webhook re-delivery: subscription_status has
  // no unique constraint on platform_subscription_id, so check first.
  const { data: existing } = await supabase
    .from('subscription_status')
    .select('id')
    .eq('platform_subscription_id', subscriptionId)
    .maybeSingle();

  if (existing) {
    return;
  }

  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  const { error } = await supabase.from('subscription_status').insert({
    user_id: userId,
    purchase_id: purchaseId,
    platform: platform,
    platform_subscription_id: subscriptionId,
    status: 'active',
    current_period_start: now.toISOString(),
    current_period_end: periodEnd.toISOString(),
    cancel_at_period_end: false,
  });

  if (error) {
    // Log and continue: the purchase is already granted and processed; the
    // subscription row is reconcilable from the platform's API.
    console.error('Failed to create subscription status:', error.message);
  }
}

function getSubscriptionExpiry(): string {
  const expiry = new Date();
  expiry.setMonth(expiry.getMonth() + 1);
  return expiry.toISOString();
}
