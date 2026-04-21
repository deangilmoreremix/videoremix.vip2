# Stripe Customer Sync & Entitlements Guide

## New Features Added ✨

### 1. Stripe Entitlements Integration
- Tracks Stripe Entitlements for feature-based access control
- Automatically syncs entitlements with your app access system
- Supports Stripe's `entitlements.active_entitlement_summary.updated` webhook

### 2. One-Click Stripe Customer Import
- Import ALL your existing Stripe customers with one button click
- Automatically fetches all charges and subscriptions
- Creates user accounts for customers who don't have one yet
- Background job processing with real-time progress updates

### 3. Enhanced Database Schema
- **stripe_entitlements** table - Links Stripe features to user access
- **sync_jobs** table - Tracks bulk import progress and errors
- Enhanced **purchases** table with Stripe-specific fields

---

## Setup Instructions

### 1. Configure Stripe Webhook (Updated)

Add endpoint: `https://your-project.supabase.co/functions/v1/webhook-stripe`

**Select these 7 events** (one more than before):
1. ✅ `checkout.session.completed`
2. ✅ `customer.subscription.created`
3. ✅ `customer.subscription.updated`
4. ✅ `customer.subscription.deleted`
5. ✅ `charge.refunded`
6. ✅ `invoice.payment_failed`
7. ✅ **`entitlements.active_entitlement_summary.updated`** ⭐ NEW

**After creating the webhook:**
- Copy the webhook signing secret: `whsec_...`
- This will be used for signature verification (optional enhancement)

### 2. Get Your Stripe API Keys

You need TWO keys from Stripe Dashboard → Developers → API Keys:

#### Webhook Secret (for webhook verification)
```
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

#### Secret Key (for customer sync API calls)
```
# For Production
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxx

# For Testing
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxx
```

### 3. Set Environment Variables in Supabase

These environment variables are used by your Edge Functions:

1. Go to Supabase Dashboard → Project Settings → Edge Functions
2. Add these secrets:
   - `STRIPE_WEBHOOK_SECRET` - For verifying webhook signatures
   - `STRIPE_SECRET_KEY` - For making API calls to Stripe

---

## Using One-Click Stripe Sync

### Step 1: Access Admin Dashboard
1. Log in to your admin dashboard
2. Navigate to the "Purchases Management" tab
3. Look for the purple "Sync Stripe" button

### Step 2: Start the Sync
1. Click the **"Sync Stripe"** button
2. A background job will start immediately
3. You'll see a progress banner showing:
   - Total customers processed
   - Successful imports
   - Failed imports

### Step 3: Monitor Progress
The sync runs in the background and:
- Updates every 3 seconds
- Processes 100 customers at a time
- Shows real-time progress
- Automatically refreshes the purchases list when complete

### What Gets Imported

For each Stripe customer, the system imports:

1. **Customer Profile**
   - Creates user account if doesn't exist
   - Links Stripe customer ID to user

2. **All Successful Charges**
   - One-time payments
   - Product details from charge description or metadata
   - Amount, currency, date

3. **Active Subscriptions**
   - Subscription status
   - Current period dates
   - Associated products
   - Billing cycle information

4. **Stripe Entitlements** (if configured)
   - Feature-based access grants
   - Lookup keys for app mapping

### What Gets Skipped

- Customers without email addresses
- Failed or refunded charges
- Duplicate transactions already in the system

---

## Stripe Entitlements Setup

Stripe Entitlements allow you to grant access to specific features/apps based on product purchases.

### 1. Configure Products in Stripe

In Stripe Dashboard → Products:

1. **Create or Edit a Product**
2. Scroll to **"Entitlements"** section
3. Add features with lookup keys matching your app slugs

**Example:**
```
Product: AI Video Creator Pro
Lookup Key: video-creator
```

### 2. How Entitlements Map to Apps

The webhook automatically creates records in both:
- `stripe_entitlements` table (tracks Stripe features)
- `user_app_access` table (grants app access)

**Example Mapping:**
```
Stripe Feature Lookup Key: "video-creator"
↓
Your App Slug: "video-creator"
↓
User gets access to the Video Creator app
```

### 3. Testing Entitlements

1. Create a test purchase in Stripe with entitlements enabled
2. Check `stripe_entitlements` table:
   ```sql
   SELECT * FROM stripe_entitlements WHERE stripe_customer_id = 'cus_xxx';
   ```
3. Verify app access was granted:
   ```sql
   SELECT * FROM user_app_access WHERE user_id = 'xxx';
   ```

---

## Monitoring and Troubleshooting

### Check Sync Job Status

View all sync jobs:
```sql
SELECT * FROM sync_jobs ORDER BY created_at DESC LIMIT 10;
```

View a specific job with errors:
```sql
SELECT
  id,
  status,
  total_records,
  successful_records,
  failed_records,
  error_log
FROM sync_jobs
WHERE id = 'job-id-here';
```

### Common Issues

#### Issue: Sync keeps failing
**Solution:**
- Check `STRIPE_SECRET_KEY` is set correctly
- Verify the API key has read permissions for customers and charges
- Check error_log in sync_jobs table for specific failures

#### Issue: Customers imported but no app access granted
**Solution:**
- Products may not be matched in your catalog
- Check `purchases` where `product_id IS NULL`
- Create product mappings in `platform_product_mappings` table
- Re-run access provisioning:
  ```sql
  UPDATE purchases SET processed = false WHERE product_id IS NULL;
  ```

#### Issue: Entitlements not syncing
**Solution:**
- Verify webhook event `entitlements.active_entitlement_summary.updated` is selected
- Check webhook logs: `SELECT * FROM webhook_logs WHERE platform = 'stripe' AND event_type LIKE '%entitlement%'`
- Test webhook in Stripe Dashboard → Webhooks → Send test webhook

### View Imported Purchases

See all Stripe purchases imported via sync:
```sql
SELECT
  email,
  product_name,
  amount,
  currency,
  purchase_date,
  synced_from_stripe
FROM purchases
WHERE synced_from_stripe = true
ORDER BY purchase_date DESC;
```

### Check Customer's Full Access

See everything a customer has access to:
```sql
SELECT
  u.email,
  uaa.app_slug,
  uaa.access_type,
  uaa.is_active,
  uaa.expires_at,
  p.product_name,
  p.platform
FROM user_app_access uaa
JOIN auth.users u ON uaa.user_id = u.id
JOIN purchases p ON uaa.purchase_id = p.id
WHERE u.email = 'customer@example.com';
```

---

## Performance Considerations

### Sync Speed
- Processes ~100 customers every 10-15 seconds
- 1,000 customers = ~2-3 minutes
- 10,000 customers = ~20-30 minutes

### Rate Limiting
The Stripe API has rate limits:
- 100 requests per second (read operations)
- Current implementation stays well within limits
- Batches 100 customers per request

### Database Load
- Uses upsert operations to avoid duplicates
- Indexes on stripe_customer_id for fast lookups
- Background job won't block webhook processing

---

## Best Practices

### 1. Initial Setup
1. Configure webhooks first (real-time going forward)
2. Run one-click sync for historical data
3. Map any unmatched products
4. Verify a few customer accounts manually

### 2. Regular Maintenance
- Run sync occasionally to catch any missed webhooks
- Review sync_jobs table monthly for patterns in failures
- Keep platform_product_mappings updated as you add products

### 3. Before Launching to Production
- Test with Stripe test mode first
- Import a small batch of test customers
- Verify app access is granted correctly
- Test subscription cancellation and renewal flows

---

## API Endpoints

### Start Sync
```bash
POST https://your-project.supabase.co/functions/v1/stripe-sync?action=start
Headers:
  Authorization: Bearer YOUR_ADMIN_TOKEN
```

### Check Sync Status
```bash
GET https://your-project.supabase.co/functions/v1/stripe-sync?action=status&job_id=JOB_ID
Headers:
  Authorization: Bearer YOUR_ADMIN_TOKEN
```

### List Recent Sync Jobs
```bash
GET https://your-project.supabase.co/functions/v1/stripe-sync?action=status
Headers:
  Authorization: Bearer YOUR_ADMIN_TOKEN
```

---

## What's Next?

After completing the Stripe sync:

1. **Map Products**: Review unmatched purchases and create product mappings
2. **Test Access**: Log in as a test customer and verify app access
3. **Configure Entitlements**: Set up lookup keys in Stripe products
4. **Enable Email**: Implement welcome email sending
5. **Process Existing Purchases**: Run access provisioning for historical purchases
