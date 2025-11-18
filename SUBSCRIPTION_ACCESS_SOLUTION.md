# How Monthly Subscriptions Will Work

## Current Situation

**Problem**: You imported 50 users from CSV, but there's **no system to track if monthly subscribers are still paying**.

Right now:
- ✅ Users exist in Supabase auth
- ❌ No purchase records
- ❌ No app access grants
- ❌ No subscription status tracking
- ❌ No way to expire access when payments stop

**This means monthly subscribers like Larry Lawrence and Truman Cole have accounts, but no access control.**

---

## The Solution: Purchase Management System

You need to apply the database migrations that create these tables:

### 1. **products_catalog**
Defines what products you sell and which apps they grant access to:
- Personalizer AI Agency (Monthly) → grants 7 core apps
- Personalizer AI Agency (Lifetime) → grants all 12 apps
- Individual toolkits → grant specific apps

### 2. **purchases**
Records every transaction from your CSV:
- Who bought it (user_id + email)
- What they bought (product_name)
- When they bought it (purchase_date)
- Payment status (completed/pending/refunded)
- Is it a subscription? (is_subscription = true/false)

### 3. **user_app_access**
Controls who can access which apps:
- `user_id`: The user
- `app_slug`: Which app (e.g., "voice-coach")
- `access_type`: "subscription" or "lifetime"
- `expires_at`: When subscription access ends (NULL for lifetime)
- `is_active`: Currently has access? (true/false)

### 4. **subscription_status**
Tracks subscription lifecycle:
- `status`: "active", "cancelled", "expired", "payment_failed"
- `current_period_end`: When current billing cycle ends
- `cancel_at_period_end`: Will auto-cancel?

---

## How Access Control Works

### For Lifetime Buyers
```
User purchases "Personalizer AI Agency (Lifetime)" for $499
↓
Create purchase record (is_subscription = false)
↓
Grant access to all 12 apps
↓
Set access_type = "lifetime", expires_at = NULL
↓
User has permanent access ✅
```

### For Monthly Subscribers
```
User subscribes to "Personalizer AI Agency (Monthly)" for $29/month
↓
Create purchase record (is_subscription = true)
↓
Create subscription_status (status = "active")
↓
Grant access to 7 core apps
↓
Set access_type = "subscription", expires_at = +30 days
↓
User has access until expires_at ✅
↓
Every month: Webhook from PayPal/Stripe → Extend expires_at by 30 days
↓
If payment fails: Set status = "payment_failed", revoke access ❌
If cancelled: Set status = "cancelled", revoke access ❌
```

### Access Check in Your App
```javascript
// When user tries to access "voice-coach" app:
const { data } = await supabase
  .from('user_app_access')
  .select('*')
  .eq('user_id', userId)
  .eq('app_slug', 'voice-coach')
  .eq('is_active', true)
  .maybeSingle();

if (!data) {
  // No access - redirect to purchase page
  return <PurchaseRequired />;
}

if (data.access_type === 'subscription') {
  if (new Date() > new Date(data.expires_at)) {
    // Subscription expired - update is_active = false
    return <SubscriptionExpired />;
  }
}

// User has valid access!
return <VoiceCoachApp />;
```

---

## What Happens to Your Monthly Users

### Current Monthly Subscribers from CSV:
1. **Larry Lawrence** (larrylawrence1@gmail.com) - 11 payments from Nov 2024 - Aug 2025
2. **Truman Cole** (trcole3@theritegroup.com) - 11 payments from Oct 2024 - Aug 2025
3. **Edward Owens** (ejo1ed@gmail.com) - 9 payments from Nov 2024 - Jun 2025
4. **Michael Nunns** (mobileman712@gmail.com) - 3 payments from Jan - Feb 2025
5. **Darren Paramore** (4dparamore@gmail.com) - 4 payments from Oct 2024 - Apr 2025
6. **Scott** (scstate88@yahoo.com) - 1 payment in Nov 2024

### After Applying Migrations and Processing CSV:

**They will get:**
1. Purchase records for each monthly payment
2. Subscription status records with:
   - `status`: Check most recent payment to determine
   - `current_period_end`: Last payment date + 30 days
3. App access grants for 7 core Personalizer apps
4. Access will be marked as EXPIRED if last payment > 30 days ago

### Example: Larry Lawrence
- Last payment: **Aug 13, 2025**
- Period ends: **Sep 13, 2025**
- Current date: **Oct 7, 2025**
- **Status**: EXPIRED ❌ (22 days past due)
- **Action**: Subscription marked as "expired", `is_active` = false

### Example: Truman Cole
- Last payment: **Aug 1, 2025**
- Period ends: **Sep 1, 2025**
- Current date: **Oct 7, 2025**
- **Status**: EXPIRED ❌ (36 days past due)
- **Action**: Subscription marked as "expired", `is_active` = false

---

## Going Forward: Webhook Integration

Once migrations are applied, webhooks will handle new payments:

### When PayPal sends "Payment Completed" webhook:
```javascript
1. Find user by email
2. Find subscription by platform_subscription_id
3. Update subscription_status:
   - status = "active"
   - current_period_end = now() + 30 days
4. Update user_app_access:
   - is_active = true
   - expires_at = now() + 30 days
```

### When PayPal sends "Subscription Cancelled" webhook:
```javascript
1. Find subscription
2. Update subscription_status:
   - status = "cancelled"
   - cancel_at_period_end = true
   - cancelled_at = now()
3. Access remains active until current_period_end
4. After period_end, automatic checker revokes access
```

---

## Next Steps to Get This Working

### Step 1: Apply Database Migrations
Go to Supabase Dashboard → SQL Editor and run:
1. `supabase/migrations/20251003151741_create_purchase_management_system.sql`
2. `supabase/migrations/20251007000001_setup_personalizer_products.sql`
3. `supabase/migrations/20251007000002_subscription_expiration_checker.sql`

### Step 2: Import Purchase Data from CSV
Run a script to:
1. Parse the CSV file
2. Create purchase records for each transaction
3. Link to the appropriate product_id
4. Set is_subscription based on product type

### Step 3: Grant App Access
For each purchase:
1. Look up which apps the product grants
2. Create user_app_access records
3. Set access_type and expires_at based on product type

### Step 4: Set Up Subscription Tracking
For subscription purchases:
1. Create subscription_status records
2. Calculate current_period_end based on last payment
3. Set status based on whether period has expired

### Step 5: Enable Automatic Expiration Checker
Set up a cron job (daily) that:
1. Finds all subscriptions where current_period_end < now()
2. Marks subscription status as "expired"
3. Sets user_app_access.is_active = false

---

## Summary

**Right now:** Users exist but have no access control

**After migrations:** Complete subscription management system

**Monthly users will:**
- Have access granted based on their last payment
- Get 30 days from last payment date
- Have access auto-revoked if expired
- Get access auto-renewed when webhook receives new payment

**Lifetime users will:**
- Have permanent access with no expiration
- Never need to worry about renewals

This system ensures you can properly track who's paying and who should have access!
