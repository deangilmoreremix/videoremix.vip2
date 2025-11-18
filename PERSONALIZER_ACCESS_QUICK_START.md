# Quick Start: Grant Personalizer Access

This is a quick reference for granting access to all Personalizer purchasers from your CSV data.

## 🚀 Fastest Method: Run SQL in Supabase

### Step 1: Open Supabase SQL Editor
1. Go to your Supabase Dashboard: https://app.supabase.com
2. Select your project
3. Click "SQL Editor" in the left sidebar
4. Create a new query

### Step 2: Copy and Run the SQL Script
Open the file `grant-personalizer-access.sql` and follow these steps:

1. **Review what will be processed** (Copy STEP 1 queries)
2. **Check product mappings** (Copy STEP 2 queries)
3. **Check which users exist** (Copy STEP 3 queries)
4. **Grant access** (Copy STEP 4 - the main function call)
5. **Verify results** (Copy STEP 5 queries)

### Step 3: Results
You should see output like:
```
processed_count: 109
success_count: 85
failed_count: 24
```

The failed records are users who haven't created accounts yet.

## 📊 What Gets Granted

### From Your CSV (109 total purchases):

| Product | Count | Apps Granted |
|---------|-------|-------------|
| Personalizer AI Agency (Lifetime) | 47 | All 12 Personalizer tools |
| Personalizer AI Agency (Monthly) | 42 | 7 core tools |
| Personalizer AI Agency (Yearly) | 8 | 10 tools |
| AI Writing Toolkit | 5 | 2 writing tools |
| Text-Video Editor | 4 | 2 editor tools |
| URL Video Generation | 1 | 1 video tool |
| Interactive Shopping | 1 | 1 shopping tool |
| Video & Image Transformer | 1 | 2 transform tools |

### Apps Included by Product:

**Personalizer AI Agency (Monthly)** - 7 apps:
- voice-coach
- resume-amplifier
- personalizer-recorder
- personalizer-profile
- thumbnail-generator
- ai-skills-monetizer
- ai-signature

**Personalizer AI Agency (Yearly)** - 10 apps (Monthly + 3 more):
- All Monthly apps PLUS:
- personalizer-text-ai-editor
- personalizer-advanced-text-video-editor
- personalizer-writing-toolkit

**Personalizer AI Agency (Lifetime)** - 12 apps (All):
- All Yearly apps PLUS:
- personalizer-video-image-transformer
- personalizer-url-video-generation

## 🔍 Common Issues

### Issue: "User not found"
**Cause**: User hasn't created an account with that email yet
**Solution**: They need to sign up. Access will auto-grant when they do.

### Issue: "Product not found in catalog"
**Cause**: Product isn't in the `products_catalog` table
**Solution**: Add it to the catalog first

### Issue: "No access after running script"
**Cause**: RLS policies or app slug mismatch
**Solution**: Check the verification queries in STEP 5

## ✅ Verification Checklist

After running the script:

- [ ] Check total access grants: Should be ~500-600 individual grants (multiple apps per user)
- [ ] Check unique users: Should be ~40-50 unique users (some purchased multiple times)
- [ ] Check lifetime vs subscription: Lifetime should be majority
- [ ] Test login as a purchaser: They should see their apps in dashboard
- [ ] Check import status: All should be "processed"

## 📝 Next Steps

1. **Notify users**: Send email to purchasers that access is now available
2. **Monitor**: Check which apps are being used
3. **Automate**: Set up webhooks for future purchases
4. **Support**: Handle users who need help accessing tools

## 🆘 Need Help?

If something goes wrong:

1. Check Supabase logs for errors
2. Run the verification queries (STEP 5 in SQL script)
3. Test with a single known user first
4. Review the detailed guide: `GRANT_PERSONALIZER_ACCESS.md`

## 📧 Users Who Need Accounts

Run this query to see which purchasers need to sign up:

```sql
WITH csv_emails AS (
  SELECT DISTINCT LOWER(TRIM(customer_email)) as email
  FROM import_user_records
  WHERE LOWER(product_name) LIKE '%personalizer%'
)
SELECT ce.email
FROM csv_emails ce
LEFT JOIN auth.users au ON LOWER(au.email) = ce.email
WHERE au.id IS NULL
ORDER BY ce.email;
```

Send these users an invitation to create their account!
