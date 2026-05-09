# Remove Unauthorized Users - Complete Guide

## Overview
This guide explains how to remove users who shouldn't have access to your VideoRemix.vip platform. You have multiple options depending on your needs.

---

## Table of Contents
1. [Quick Reference](#quick-reference)
2. [Method 1: Remove User Access Only](#method-1-remove-user-access-only)
3. [Method 2: Revoke App Access](#method-2-revoke-app-access)
4. [Method 3: Delete User Completely](#method-3-delete-user-completely)
5. [Method 4: Bulk User Removal](#method-4-bulk-user-removal)
6. [Method 5: Using Admin Dashboard](#method-5-using-admin-dashboard)
7. [Verification Steps](#verification-steps)

---

## Quick Reference

**What you need:**
- Super admin access to Supabase dashboard
- User's email address or user ID

**Database location:**
- Supabase Dashboard → SQL Editor

---

## Method 1: Remove User Access Only
**Use this when:** You want to disable access but keep the user account for records.

### Step 1: Find the user's ID
```sql
-- Find user by email
SELECT id, email, created_at
FROM auth.users
WHERE email = 'user@example.com';
```

### Step 2: Revoke all app access
```sql
-- Disable all app access for a specific user
UPDATE user_app_access
SET is_active = false,
    updated_at = now()
WHERE user_id = 'USER_ID_HERE';
```

### Step 3: Mark purchases as inactive (optional)
```sql
-- Mark their purchases as processed/inactive
UPDATE purchases
SET processed = false,
    updated_at = now()
WHERE user_id = 'USER_ID_HERE';
```

---

## Method 2: Revoke App Access
**Use this when:** You want to remove access to specific apps only.

### View current app access
```sql
-- See what apps a user has access to
SELECT
    uaa.app_slug,
    uaa.access_type,
    uaa.granted_at,
    uaa.expires_at,
    uaa.is_active
FROM user_app_access uaa
JOIN auth.users u ON u.id = uaa.user_id
WHERE u.email = 'user@example.com'
ORDER BY uaa.granted_at DESC;
```

### Revoke specific app access
```sql
-- Remove access to a specific app
DELETE FROM user_app_access
WHERE user_id = 'USER_ID_HERE'
AND app_slug = 'app-slug-here';

-- OR disable it without deleting
UPDATE user_app_access
SET is_active = false,
    updated_at = now()
WHERE user_id = 'USER_ID_HERE'
AND app_slug = 'app-slug-here';
```

### Revoke all app access
```sql
-- Remove all app access for a user
DELETE FROM user_app_access
WHERE user_id = 'USER_ID_HERE';
```

---

## Method 3: Delete User Completely
**Use this when:** You want to permanently remove a user and all their data.

### ⚠️ WARNING
This is **permanent** and will delete:
- User account
- All purchases
- All app access
- All subscriptions
- All user preferences

### Step 1: Verify user first
```sql
-- Double-check you have the right user
SELECT
    u.id,
    u.email,
    u.created_at,
    ur.role,
    COUNT(DISTINCT uaa.id) as app_access_count,
    COUNT(DISTINCT p.id) as purchase_count
FROM auth.users u
LEFT JOIN user_roles ur ON ur.user_id = u.id
LEFT JOIN user_app_access uaa ON uaa.user_id = u.id
LEFT JOIN purchases p ON p.user_id = u.id
WHERE u.email = 'user@example.com'
GROUP BY u.id, u.email, u.created_at, ur.role;
```

### Step 2: Delete the user
```sql
-- This will cascade delete related data
DELETE FROM auth.users
WHERE id = 'USER_ID_HERE';

-- Verify deletion
SELECT COUNT(*) FROM auth.users WHERE id = 'USER_ID_HERE';
-- Should return 0
```

---

## Method 4: Bulk User Removal
**Use this when:** You need to remove multiple unauthorized users at once.

### Example: Remove all users without purchases
```sql
-- Find users who have no purchases (test accounts, etc.)
SELECT
    u.id,
    u.email,
    u.created_at
FROM auth.users u
LEFT JOIN purchases p ON p.user_id = u.id
WHERE p.id IS NULL
AND u.created_at < now() - interval '7 days'  -- Only users older than 7 days
ORDER BY u.created_at DESC;

-- After verifying the list, delete them
DELETE FROM auth.users
WHERE id IN (
    SELECT u.id
    FROM auth.users u
    LEFT JOIN purchases p ON p.user_id = u.id
    WHERE p.id IS NULL
    AND u.created_at < now() - interval '7 days'
);
```

### Example: Remove users with expired access
```sql
-- Find users whose access has expired
SELECT
    u.id,
    u.email,
    MAX(uaa.expires_at) as last_expiry
FROM auth.users u
JOIN user_app_access uaa ON uaa.user_id = u.id
WHERE uaa.expires_at < now()
AND uaa.is_active = true
GROUP BY u.id, u.email
HAVING MAX(uaa.expires_at) < now() - interval '30 days';

-- Revoke their access
UPDATE user_app_access
SET is_active = false,
    updated_at = now()
WHERE user_id IN (
    SELECT u.id
    FROM auth.users u
    JOIN user_app_access uaa ON uaa.user_id = u.id
    WHERE uaa.expires_at < now()
    AND uaa.is_active = true
    GROUP BY u.id
    HAVING MAX(uaa.expires_at) < now() - interval '30 days'
);
```

### Example: Remove users from specific email domains
```sql
-- Find users from unwanted domains
SELECT id, email, created_at
FROM auth.users
WHERE email LIKE '%@spam-domain.com'
OR email LIKE '%@test-domain.com';

-- Delete them
DELETE FROM auth.users
WHERE email LIKE '%@spam-domain.com'
OR email LIKE '%@test-domain.com';
```

---

## Method 5: Using Admin Dashboard
**Use this when:** You prefer a GUI interface.

### Access the Admin Dashboard
1. Navigate to: `https://your-domain.com/admin`
2. Log in with super admin credentials
3. Go to "Users Management" tab

### Remove User via Dashboard
1. Search for user by email
2. Click on the user row
3. Options available:
   - **Revoke Access** - Disables all app access
   - **Delete User** - Permanently removes user
   - **View Details** - See purchases and access history

### Bulk Actions via Dashboard
1. Select multiple users using checkboxes
2. Click "Bulk Actions" dropdown
3. Choose action:
   - Revoke All Access
   - Delete Selected Users
   - Export User List

---

## Verification Steps

### After Removing Access
```sql
-- Verify user has no active app access
SELECT * FROM user_app_access
WHERE user_id = 'USER_ID_HERE'
AND is_active = true;
-- Should return 0 rows
```

### After Deleting User
```sql
-- Verify user is deleted from auth
SELECT * FROM auth.users WHERE id = 'USER_ID_HERE';
-- Should return 0 rows

-- Verify cascading deletions worked
SELECT * FROM user_app_access WHERE user_id = 'USER_ID_HERE';
SELECT * FROM purchases WHERE user_id = 'USER_ID_HERE';
SELECT * FROM user_roles WHERE user_id = 'USER_ID_HERE';
-- All should return 0 rows
```

### Check Active User Count
```sql
-- See total active users with access
SELECT COUNT(DISTINCT user_id) as active_users
FROM user_app_access
WHERE is_active = true
AND (expires_at IS NULL OR expires_at > now());
```

---

## Common Scenarios

### Scenario 1: Test Accounts Cleanup
```sql
-- Remove all test accounts
DELETE FROM auth.users
WHERE email LIKE '%test%@%'
OR email LIKE '%demo%@%'
OR email LIKE '%+test@%';
```

### Scenario 2: Refunded Customers
```sql
-- Find users with refunded purchases
SELECT DISTINCT u.email, u.id
FROM auth.users u
JOIN purchases p ON p.user_id = u.id
WHERE p.status = 'refunded';

-- Revoke their access
UPDATE user_app_access
SET is_active = false,
    updated_at = now()
WHERE user_id IN (
    SELECT DISTINCT u.id
    FROM auth.users u
    JOIN purchases p ON p.user_id = u.id
    WHERE p.status = 'refunded'
);
```

### Scenario 3: Inactive Users (No Login in 6 Months)
```sql
-- Find inactive users
SELECT
    u.id,
    u.email,
    u.last_sign_in_at,
    u.created_at
FROM auth.users u
WHERE u.last_sign_in_at < now() - interval '6 months'
OR (u.last_sign_in_at IS NULL AND u.created_at < now() - interval '6 months')
ORDER BY u.last_sign_in_at NULLS FIRST;

-- Revoke access for inactive users
UPDATE user_app_access
SET is_active = false,
    updated_at = now()
WHERE user_id IN (
    SELECT u.id
    FROM auth.users u
    WHERE u.last_sign_in_at < now() - interval '6 months'
    OR (u.last_sign_in_at IS NULL AND u.created_at < now() - interval '6 months')
);
```

---

## Safety Checklist

Before removing users, always:

- [ ] **Backup your database** (Supabase → Database → Backups)
- [ ] **Verify the user email/ID** is correct
- [ ] **Check if user has active subscription** (avoid refund issues)
- [ ] **Review purchase history** (ensure not a paying customer)
- [ ] **Test on ONE user first** before bulk operations
- [ ] **Document the reason** for removal
- [ ] **Export user data** if needed for records

---

## Rollback / Undo

### If you made a mistake:

**Restore from backup:**
1. Go to Supabase Dashboard → Database → Backups
2. Select the most recent backup before your changes
3. Click "Restore"

**Re-grant access manually:**
```sql
-- Re-enable app access if you disabled it by mistake
UPDATE user_app_access
SET is_active = true,
    updated_at = now()
WHERE user_id = 'USER_ID_HERE';
```

---

## Need Help?

**Check user details first:**
```sql
-- Complete user information
SELECT
    u.id,
    u.email,
    u.created_at,
    u.last_sign_in_at,
    ur.role,
    COUNT(DISTINCT uaa.id) as active_apps,
    COUNT(DISTINCT p.id) as total_purchases,
    SUM(CASE WHEN p.status = 'completed' THEN p.amount ELSE 0 END) as total_spent
FROM auth.users u
LEFT JOIN user_roles ur ON ur.user_id = u.id
LEFT JOIN user_app_access uaa ON uaa.user_id = u.id AND uaa.is_active = true
LEFT JOIN purchases p ON p.user_id = u.id
WHERE u.email = 'user@example.com'
GROUP BY u.id, u.email, u.created_at, u.last_sign_in_at, ur.role;
```

---

## Important Notes

1. **Super Admin Protection**: You cannot delete super admin accounts using these methods (safety feature)
2. **Active Subscriptions**: Check for active subscriptions before removal to avoid payment disputes
3. **Data Retention**: Consider your legal obligations for data retention before permanent deletion
4. **Audit Trail**: All operations are logged in Supabase audit logs
5. **Rate Limits**: Be careful with bulk operations - test on small batches first

---

## Quick Commands Reference

### Find user by email
```sql
SELECT id, email FROM auth.users WHERE email = 'user@example.com';
```

### Disable all access
```sql
UPDATE user_app_access SET is_active = false WHERE user_id = 'USER_ID';
```

### Delete user completely
```sql
DELETE FROM auth.users WHERE id = 'USER_ID';
```

### Count active users
```sql
SELECT COUNT(DISTINCT user_id) FROM user_app_access WHERE is_active = true;
```

---

**Last Updated:** 2025-01-21
**Version:** 1.0
