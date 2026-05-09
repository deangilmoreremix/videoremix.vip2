# Personalizer Purchase Import Guide

## Overview
This guide explains how to import your Personalizer purchase data from the CSV file into the system.

## What We Built For Your CSV Data

We created a complete automated system to process your Personalizer purchase list:

### 1. **Product Catalog**
The system recognizes these products from your CSV:
- ✅ Personalizer AI Agency (Monthly) - $29/month
- ✅ Personalizer AI Agency (Lifetime) - $170-$499
- ✅ Personalizer AI Agency (Yearly) - $199/year
- ✅ Personalizer AI Writing Toolkit - $49
- ✅ Personalizer Advanced Text-Video AI Editor - $99
- ✅ Personalizer URL Video Generation Templates & Editor - $99
- ✅ Personalizer Interactive Shopping - $99
- ✅ Personalizer AI Video and Image Transformer - $199/year

### 2. **Automatic User Creation**
For each purchase in your CSV:
- Creates user accounts for customers who don't exist
- Links purchases to existing users by email
- Generates secure temporary passwords

### 3. **Access Grants**
Based on purchase type:
- **Monthly subscriptions**: Core personalizer apps with monthly expiration
- **Lifetime purchases**: All personalizer apps permanently
- **Individual toolkits**: Specific apps for that product

### 4. **Subscription Tracking**
- Recognizes PayPal preapproval keys as subscription IDs
- Calculates expiration dates based on purchase date + recurring period
- Marks "Pending" status purchases appropriately

---

## Step-by-Step Import Process

### STEP 1: Apply Database Migrations

First, you need to apply the new database migrations:

```bash
# Navigate to your project directory
cd /tmp/cc-agent/57975023/project

# Apply migrations using Supabase CLI
supabase db push

# Or manually apply each migration in order:
# 1. supabase/migrations/20251007000001_setup_personalizer_products.sql
# 2. supabase/migrations/20251007000002_subscription_expiration_checker.sql
```

These migrations will:
- Create the products_catalog table with all Personalizer products
- Set up platform mappings for Zaxxa
- Create the subscription expiration checker function
- Add the access_revocation_log table

### STEP 2: Deploy the Import Edge Function

Deploy the CSV import function:

```bash
# This would normally be done via Supabase CLI, but since you're using MCP tools:
# The import function is located at:
# supabase/functions/import-personalizer-purchases/index.ts

# You'll need to deploy it through your Supabase dashboard or CLI
```

### STEP 3: Access the Admin Dashboard

1. Navigate to your admin dashboard: `/admin`
2. Log in with your super admin credentials
3. Click on the **"Import Purchases"** tab

### STEP 4: Upload Your CSV File

1. Click the upload area
2. Select your file: `src/data/personalizer .csv`
3. Wait for processing (this may take 1-2 minutes for 109 records)

### STEP 5: Review Import Results

The system will show you:
- **Total**: 109 purchases
- **Successful**: Number of purchases imported successfully
- **Failed**: Any purchases that couldn't be processed
- **Skipped**: Refunded transactions and those without email addresses

You'll see a detailed table showing:
- Each row number from the CSV
- Customer email
- Import status (success/failed/skipped)
- User ID created
- Any error messages

---

## What Happens During Import

### For Each Row in Your CSV:

1. **Email Check**:
   - Skips if no email or email is "-"
   - Converts email to lowercase

2. **Refund Check**:
   - Skips if status is "Refunded"

3. **User Creation/Lookup**:
   - Finds existing user by email, OR
   - Creates new user account with secure random password

4. **Product Matching**:
   - Matches product name to catalog
   - Example: "Personalizer AI Agency (Monthly)" → personalizer-monthly

5. **Purchase Recording**:
   - Creates purchase record in database
   - Links to user and product
   - Stores Zaxxa transaction ID and PayPal transaction ID
   - Marks status (completed/pending)

6. **Access Granting**:
   - For "Completed" purchases: Grants immediate access to apps
   - For "Pending" purchases: Creates purchase record but doesn't grant access

7. **Subscription Setup** (for recurring):
   - Creates subscription_status record
   - Uses PayPal preapproval key as subscription ID
   - Calculates next billing date based on recurring period

---

## Understanding Your CSV Data

### Purchase Types in Your List:

1. **Monthly Subscriptions** (29 subscribers)
   - Larry Lawrence - Active since Nov 2024
   - Truman Cole - Active since Oct 2024
   - Edward Owens - Active since Nov 2024
   - Darren Paramore - Active since Oct 2024
   - And others...

2. **Lifetime Purchases** (Multiple price points)
   - $499: One-time payment, all apps forever
   - $399: Discounted lifetime (special offer)
   - $300: Coupon code discount (Kenneth SApp - KEN1990FF)
   - $170-$225: Installment plans

3. **Individual Toolkits**
   - Writing Toolkit: $49
   - Advanced Text-Video Editor: $99
   - URL Video Generation: $99

4. **Special Cases**:
   - Kingdom Life Fellowship: 3-payment installment plan ($170 × 3)
   - A Rohlehr: $29.99 subscription (Stripe)
   - Darlene Rogers: $29.99 subscription (Stripe)

### Payment Statuses:

- **Completed**: Will grant immediate access ✅
- **Pending**: Creates record but no access (3 instances: Larry Lawrence on Jul 19 & Jun 13, Mark Umiker on Nov 27)
- **Refunded**: Will be skipped (7 instances including Barry Siddy, Eric Hodgson, Steven Barrett, etc.)

---

## After Import: What Happens Next?

### Immediate Effects:
1. ✅ All customers get user accounts
2. ✅ Completed purchases grant instant app access
3. ✅ Subscriptions are tracked with expiration dates
4. ✅ Pending purchases are recorded but access is held

### Ongoing Automation:

#### Daily at 2 AM UTC:
The system automatically runs `check_and_revoke_expired_subscriptions()` which:

1. **Checks Monthly Subscriptions**:
   - Looks at current_period_end date
   - If past due without renewal → Revokes access

2. **Handles Payment Failures**:
   - 3-day grace period before revocation
   - Logs the reason in access_revocation_log

3. **Processes Cancellations**:
   - Respects cancel_at_period_end setting
   - Immediate revocation if subscription cancelled

#### Real-time Webhook Updates:
When PayPal/Zaxxa sends notifications:

- **Successful Payment**: Updates period_end, keeps access active
- **Payment Failed**: Marks as payment_failed, starts grace period
- **Subscription Cancelled**: Marks cancelled, schedules access revocation
- **Subscription Renewed**: Extends period, ensures access remains

---

## Manual Management

### View Subscriptions:
Go to Admin Dashboard → **Subscriptions** tab to:
- See all active/expired/failed subscriptions
- Check expiration dates
- Run manual expiration check
- Restore access for customer support cases

### Manual Actions:

#### Restore Access (Customer Support):
```sql
SELECT restore_subscription_access(
  'user-uuid-here',
  'app-slug-here'
);
```

#### Run Expiration Check Manually:
Click "Run Expiration Check" button in Subscriptions tab

#### Check User Access:
```sql
SELECT * FROM user_app_access
WHERE user_id = 'user-uuid-here';
```

---

## Troubleshooting

### Import Issues:

**"Failed to create user account"**
- User email might be invalid
- Check if user already exists with different email format

**"No transaction ID found"**
- Row is missing both PayPal and Zaxxa transaction IDs
- Cannot import without unique identifier

**"Purchase already exists"**
- This transaction was already imported
- Safe to skip

**"Failed to record purchase"**
- Database permission issue
- Check Supabase service role key

### Access Issues:

**User can't see apps after import:**
1. Check purchase status was "Completed"
2. Verify user_app_access has is_active = true
3. Check subscription hasn't expired

**Subscription shows expired immediately:**
1. Check if current_period_end is in the past
2. May need to calculate from last payment date
3. Installment plans might need manual adjustment

---

## Expected Results from Your CSV

Based on your 109 purchases:

### Should Import Successfully:
- ~90-95 purchases (those with "Completed" status and valid emails)
- Creates ~30-40 unique user accounts

### Will Be Skipped:
- ~7 refunded transactions
- ~3 pending transactions (can be imported later when completed)

### Active Subscriptions Expected:
- ~25-30 monthly subscribers
- ~5-10 yearly subscribers
- ~50-60 lifetime access users

---

## Next Steps

1. ✅ Apply database migrations
2. ✅ Deploy import edge function
3. ✅ Upload your CSV through admin dashboard
4. ✅ Review import results
5. ✅ Check subscription statuses
6. ✅ Set up webhook endpoints for Zaxxa (if not already done)
7. ✅ Test with a few sample users

---

## Support Contact

If you encounter issues during import:
1. Check the browser console for errors
2. Review the import results table for specific failures
3. Check Supabase logs for backend errors
4. Refer to the error messages in the import results

The system is designed to be fault-tolerant - if some rows fail, others will still import successfully.
