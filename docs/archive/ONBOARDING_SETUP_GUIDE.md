# Multi-Platform User Onboarding System - Setup Guide

## Overview
This system automatically processes purchases from PayKickstart, Stripe, and Zaxxa, creates user accounts, and grants appropriate app access based on product mappings.

## What Was Built

### 1. Database Schema ✅
Created comprehensive tables for:
- `products_catalog` - Master product list with app access mappings
- `platform_product_mappings` - Links payment platform products to your catalog
- `purchases` - All transactions from all platforms
- `user_app_access` - Tracks which apps each user can access
- `subscription_status` - Manages subscription lifecycle
- `webhook_logs` - Debugging and webhook replay

### 2. Webhook Edge Functions ✅
Three webhook receivers that process real-time purchase events:
- `/functions/v1/webhook-stripe` - Stripe webhooks
- `/functions/v1/webhook-paykickstart` - PayKickstart webhooks
- `/functions/v1/webhook-zaxxa` - Zaxxa webhooks

### 3. Admin Dashboard Integration ✅
- New "Purchases Management" tab in your existing admin dashboard
- View all purchases across platforms with filters
- CSV import tool for existing customers
- Purchase detail modal with full transaction info
- Real-time stats: total purchases, revenue, platform breakdown

### 4. Automatic Features ✅
- **User Account Creation**: Automatically creates accounts for new purchasers
- **Product Matching**: Intelligently matches SKUs and product names to apps
- **Access Provisioning**: Grants app access immediately upon purchase
- **Subscription Management**: Handles renewals, cancellations, and expirations
- **Email Notifications**: Welcome emails with credentials (TODO: implement email provider)

---

## Setup Instructions

### Step 1: Seed Your Product Catalog

You need to populate the `products_catalog` table with your 35+ apps. Here's an example SQL to insert one product:

\`\`\`sql
INSERT INTO products_catalog (name, slug, sku, description, product_type, apps_granted, is_active)
VALUES
  ('AI Video Creator', 'ai-video-creator', 'AVC-001', 'Transform text into professional videos', 'one_time', '["video-creator"]', true),
  ('Promo Generator', 'promo-generator', 'PG-001', 'Generate promotional videos', 'one_time', '["promo-generator"]', true),
  ('Landing Page Creator', 'landing-page', 'LPC-001', 'Create landing pages in 60 seconds', 'one_time', '["landing-page"]', true);
\`\`\`

**Bundle Example** (one purchase grants multiple apps):
\`\`\`sql
INSERT INTO products_catalog (name, slug, sku, description, product_type, apps_granted, is_active)
VALUES
  ('Video Suite Bundle', 'video-suite-bundle', 'VSB-001', 'Complete video creation toolkit', 'one_time',
   '["video-creator", "promo-generator", "ai-image-tools", "text-to-speech"]', true);
\`\`\`

### Step 2: Configure Webhook URLs

Set up webhooks in each payment platform pointing to your Supabase Edge Functions:

#### Stripe Webhooks
1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://your-project.supabase.co/functions/v1/webhook-stripe`
3. Select events to listen to:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `charge.refunded`
   - `invoice.payment_failed`
4. Copy the webhook signing secret
5. Set environment variable: `STRIPE_WEBHOOK_SECRET=whsec_...`

#### PayKickstart Webhooks
1. Go to PayKickstart → Settings → Webhooks
2. Add webhook URL: `https://your-project.supabase.co/functions/v1/webhook-paykickstart`
3. Enable events:
   - Order Success
   - Subscription Created
   - Subscription Cancelled
   - Refund

#### Zaxxa Webhooks
1. Go to Zaxxa → Settings → Webhooks
2. Add webhook URL: `https://your-project.supabase.co/functions/v1/webhook-zaxxa`
3. Enable events:
   - Sale Completed
   - Subscription Created
   - Subscription Cancelled
   - Refund Completed

### Step 3: Map Platform Products to Your Catalog

After receiving your first webhooks, you'll see unmatched products in the admin dashboard. Create mappings:

\`\`\`sql
-- Example: Map Stripe product to your catalog
INSERT INTO platform_product_mappings (product_id, platform, platform_product_id, platform_product_name, manually_verified)
VALUES
  ((SELECT id FROM products_catalog WHERE sku = 'AVC-001'),
   'stripe',
   'prod_StripeProductID123',
   'AI Video Creator - Lifetime Access',
   true);

-- Example: Map PayKickstart product
INSERT INTO platform_product_mappings (product_id, platform, platform_product_id, platform_product_name, manually_verified)
VALUES
  ((SELECT id FROM products_catalog WHERE sku = 'AVC-001'),
   'paykickstart',
   'pk_product_456',
   'VideoCreator Pro',
   true);
\`\`\`

### Step 4: Import Existing Customers

For customers who purchased before this system was implemented:

#### Option 1: Use Admin Dashboard Import
1. Go to Admin Dashboard → Purchases Management tab
2. Click "Download Template" to get CSV format
3. Fill in your customer data:
   \`\`\`csv
   email,product_name,amount,platform,transaction_id
   user1@example.com,AI Video Creator,99.00,stripe,existing_001
   user2@example.com,Landing Page Creator,49.00,paykickstart,existing_002
   \`\`\`
4. Click "Import" and paste the CSV data
5. System will:
   - Match products by name/SKU
   - Create user accounts if needed
   - Grant appropriate app access

#### Option 2: Direct SQL Import
\`\`\`sql
-- Import a batch of existing purchases
INSERT INTO purchases (email, product_name, product_sku, amount, currency, platform, platform_transaction_id, status, is_subscription, purchase_date, processed)
VALUES
  ('user1@example.com', 'AI Video Creator', 'AVC-001', 99.00, 'USD', 'stripe', 'historical_001', 'completed', false, '2024-01-15', false),
  ('user2@example.com', 'Video Suite Bundle', 'VSB-001', 299.00, 'USD', 'paykickstart', 'historical_002', 'completed', false, '2024-02-20', false);

-- Then process them (grants access)
-- You'll need to run a processing script or manually update user_app_access
\`\`\`

### Step 5: Testing the System

#### Test Webhook Processing
1. Make a test purchase in Stripe/PayKickstart/Zaxxa test mode
2. Check `webhook_logs` table to see the webhook was received:
   \`\`\`sql
   SELECT * FROM webhook_logs ORDER BY created_at DESC LIMIT 10;
   \`\`\`
3. Verify purchase was created:
   \`\`\`sql
   SELECT * FROM purchases ORDER BY created_at DESC LIMIT 5;
   \`\`\`
4. Check that app access was granted:
   \`\`\`sql
   SELECT * FROM user_app_access WHERE user_id = 'user-id-here';
   \`\`\`

#### Test Product Matching
The system matches products in this priority order:
1. Exact SKU match
2. Platform product mapping
3. Fuzzy product name matching

Test by purchasing products with different names to see how the matching works.

---

## Admin Dashboard Features

### Purchases Management Tab
- **View All Purchases**: See every transaction across all platforms
- **Filter by Platform**: Stripe, PayKickstart, Zaxxa, or all
- **Filter by Status**: Completed, Pending, Refunded, Failed
- **Export to CSV**: Download purchase data for analysis
- **Import Purchases**: Bulk import historical customer data
- **Purchase Details**: Click eye icon to see full transaction details

### Stats Dashboard
- Total Purchases count
- Total Revenue
- Purchases by Platform breakdown

### Users Management (Enhanced)
The existing Users Management tab now shows:
- Which apps each user has access to (coming in next update)
- Purchase history per user (coming in next update)

---

## Monitoring and Maintenance

### Check Webhook Health
\`\`\`sql
-- See webhook success rate
SELECT
  platform,
  processing_status,
  COUNT(*) as count
FROM webhook_logs
GROUP BY platform, processing_status;
\`\`\`

### Find Unprocessed Purchases
\`\`\`sql
SELECT * FROM purchases WHERE processed = false;
\`\`\`

### Review Unmatched Products
\`\`\`sql
-- Purchases without product match
SELECT DISTINCT product_name, product_sku, platform
FROM purchases
WHERE product_id IS NULL;
\`\`\`

### Check Subscription Status
\`\`\`sql
SELECT
  u.email,
  ss.platform,
  ss.status,
  ss.current_period_end
FROM subscription_status ss
JOIN admin_profiles ap ON ss.user_id = ap.user_id
JOIN auth.users u ON ap.user_id = u.id
WHERE ss.status = 'active';
\`\`\`

---

## Next Steps / TODOs

1. **Implement Email Provider**: Currently emails are logged but not sent
   - Connect SendGrid, Mailgun, or AWS SES
   - Update \`sendWelcomeEmail\` function in \`purchaseProcessor.ts\`

2. **Create Admin API Endpoints**: Build Edge Functions for:
   - \`/functions/v1/admin-purchases\` - List purchases
   - \`/functions/v1/admin-purchases/import\` - Bulk import
   - \`/functions/v1/admin-products\` - Manage product catalog

3. **Add Access Checking Middleware**:
   - Check \`user_app_access\` before allowing app usage
   - Redirect to upgrade page if no access

4. **Build Product Mapping UI**:
   - Interface in admin dashboard to map unmatched products
   - Confidence score display for automatic matches

5. **Set Up Monitoring**:
   - Alerts for webhook failures
   - Daily reconciliation job
   - Payment failure notifications

---

## Support

For issues or questions about this system:
1. Check `webhook_logs` table for webhook processing errors
2. Review `purchases` table to ensure data is being captured
3. Verify RLS policies aren't blocking access
4. Check Supabase Edge Function logs for detailed error messages

## Architecture Diagram

\`\`\`
Payment Platforms (Stripe/PayKickstart/Zaxxa)
    ↓ (webhook)
Supabase Edge Functions (webhook receivers)
    ↓
Purchase Processor (purchaseProcessor.ts)
    ↓
├─ Match Product (SKU/Name matching)
├─ Create User Account (if needed)
├─ Record Purchase (purchases table)
├─ Grant App Access (user_app_access table)
└─ Send Welcome Email (if new user)
\`\`\`
