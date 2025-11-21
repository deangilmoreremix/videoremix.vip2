-- ============================================
-- VideoRemix.vip - User Removal SQL Queries
-- ============================================
-- Use these queries in Supabase SQL Editor

-- ============================================
-- SECTION 1: FIND USERS
-- ============================================

-- Find user by email
SELECT id, email, created_at, last_sign_in_at
FROM auth.users
WHERE email = 'user@example.com';

-- Find all users with their details
SELECT
    u.id,
    u.email,
    u.created_at,
    u.last_sign_in_at,
    ur.role,
    COUNT(DISTINCT uaa.id) as active_apps,
    COUNT(DISTINCT p.id) as total_purchases
FROM auth.users u
LEFT JOIN user_roles ur ON ur.user_id = u.id
LEFT JOIN user_app_access uaa ON uaa.user_id = u.id AND uaa.is_active = true
LEFT JOIN purchases p ON p.user_id = u.id
GROUP BY u.id, u.email, u.created_at, u.last_sign_in_at, ur.role
ORDER BY u.created_at DESC;

-- Find test accounts
SELECT id, email, created_at
FROM auth.users
WHERE email LIKE '%test%'
   OR email LIKE '%demo%'
   OR email LIKE '%+test%'
ORDER BY created_at DESC;

-- Find users without purchases (older than 7 days)
SELECT
    u.id,
    u.email,
    u.created_at
FROM auth.users u
LEFT JOIN purchases p ON p.user_id = u.id
WHERE p.id IS NULL
AND u.created_at < now() - interval '7 days'
ORDER BY u.created_at DESC;

-- Find inactive users (no login in 6 months)
SELECT
    u.id,
    u.email,
    u.last_sign_in_at,
    u.created_at
FROM auth.users u
WHERE u.last_sign_in_at < now() - interval '6 months'
   OR (u.last_sign_in_at IS NULL AND u.created_at < now() - interval '6 months')
ORDER BY u.last_sign_in_at NULLS FIRST;

-- Find users with refunded purchases
SELECT DISTINCT
    u.id,
    u.email,
    COUNT(p.id) as refunded_purchases
FROM auth.users u
JOIN purchases p ON p.user_id = u.id
WHERE p.status = 'refunded'
GROUP BY u.id, u.email
ORDER BY refunded_purchases DESC;

-- ============================================
-- SECTION 2: VIEW USER DETAILS
-- ============================================

-- Get complete user information
SELECT
    u.id,
    u.email,
    u.created_at,
    u.last_sign_in_at,
    ur.role,
    COUNT(DISTINCT uaa.id) FILTER (WHERE uaa.is_active = true) as active_apps,
    COUNT(DISTINCT p.id) as total_purchases,
    COALESCE(SUM(CASE WHEN p.status = 'completed' THEN p.amount ELSE 0 END), 0) as total_spent
FROM auth.users u
LEFT JOIN user_roles ur ON ur.user_id = u.id
LEFT JOIN user_app_access uaa ON uaa.user_id = u.id
LEFT JOIN purchases p ON p.user_id = u.id
WHERE u.email = 'user@example.com'  -- Replace with actual email
GROUP BY u.id, u.email, u.created_at, u.last_sign_in_at, ur.role;

-- View user's app access
SELECT
    uaa.app_slug,
    uaa.access_type,
    uaa.granted_at,
    uaa.expires_at,
    uaa.is_active,
    CASE
        WHEN uaa.expires_at IS NULL THEN 'Never expires'
        WHEN uaa.expires_at > now() THEN 'Active'
        ELSE 'Expired'
    END as status
FROM user_app_access uaa
JOIN auth.users u ON u.id = uaa.user_id
WHERE u.email = 'user@example.com'  -- Replace with actual email
ORDER BY uaa.granted_at DESC;

-- View user's purchases
SELECT
    p.platform,
    p.product_name,
    p.amount,
    p.currency,
    p.status,
    p.purchase_date,
    p.is_subscription
FROM purchases p
JOIN auth.users u ON u.id = p.user_id
WHERE u.email = 'user@example.com'  -- Replace with actual email
ORDER BY p.purchase_date DESC;

-- ============================================
-- SECTION 3: REVOKE ACCESS (SAFE)
-- ============================================

-- Revoke all app access for a specific user
UPDATE user_app_access
SET is_active = false,
    updated_at = now()
WHERE user_id = (
    SELECT id FROM auth.users WHERE email = 'user@example.com'
);

-- Revoke specific app access
UPDATE user_app_access
SET is_active = false,
    updated_at = now()
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'user@example.com')
AND app_slug = 'app-slug-here';

-- Revoke access for multiple users with refunds
UPDATE user_app_access
SET is_active = false,
    updated_at = now()
WHERE user_id IN (
    SELECT DISTINCT u.id
    FROM auth.users u
    JOIN purchases p ON p.user_id = u.id
    WHERE p.status = 'refunded'
);

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

-- ============================================
-- SECTION 4: DELETE USERS (PERMANENT)
-- ============================================

-- ⚠️ WARNING: These operations are PERMANENT!
-- Always backup your database first!

-- Delete a single user (cascades to all related data)
DELETE FROM auth.users
WHERE id = 'USER_ID_HERE';

-- Delete a user by email
DELETE FROM auth.users
WHERE email = 'user@example.com';

-- Delete all test accounts
DELETE FROM auth.users
WHERE email LIKE '%test%@%'
   OR email LIKE '%demo%@%'
   OR email LIKE '%+test@%';

-- Delete users without purchases (older than 7 days)
DELETE FROM auth.users
WHERE id IN (
    SELECT u.id
    FROM auth.users u
    LEFT JOIN purchases p ON p.user_id = u.id
    WHERE p.id IS NULL
    AND u.created_at < now() - interval '7 days'
);

-- Delete inactive users (no login in 1 year)
DELETE FROM auth.users
WHERE (
    last_sign_in_at < now() - interval '1 year'
    OR (last_sign_in_at IS NULL AND created_at < now() - interval '1 year')
)
AND id NOT IN (
    SELECT user_id FROM user_roles WHERE role IN ('super_admin', 'admin')
);

-- ============================================
-- SECTION 5: VERIFICATION
-- ============================================

-- Verify user has no active access
SELECT * FROM user_app_access
WHERE user_id = 'USER_ID_HERE'
AND is_active = true;
-- Should return 0 rows if access revoked

-- Verify user is deleted
SELECT * FROM auth.users WHERE id = 'USER_ID_HERE';
-- Should return 0 rows if deleted

-- Check total active users
SELECT COUNT(DISTINCT user_id) as active_users
FROM user_app_access
WHERE is_active = true
AND (expires_at IS NULL OR expires_at > now());

-- Check users by role
SELECT
    COALESCE(ur.role, 'no_role') as role,
    COUNT(*) as user_count
FROM auth.users u
LEFT JOIN user_roles ur ON ur.user_id = u.id
GROUP BY ur.role
ORDER BY user_count DESC;

-- ============================================
-- SECTION 6: AUDIT & MONITORING
-- ============================================

-- Users created in last 7 days
SELECT
    u.email,
    u.created_at,
    COUNT(DISTINCT uaa.id) as apps_accessed,
    COUNT(DISTINCT p.id) as purchases
FROM auth.users u
LEFT JOIN user_app_access uaa ON uaa.user_id = u.id
LEFT JOIN purchases p ON p.user_id = u.id
WHERE u.created_at > now() - interval '7 days'
GROUP BY u.id, u.email, u.created_at
ORDER BY u.created_at DESC;

-- Users with expired access
SELECT
    u.email,
    uaa.app_slug,
    uaa.expires_at,
    uaa.is_active
FROM auth.users u
JOIN user_app_access uaa ON uaa.user_id = u.id
WHERE uaa.expires_at < now()
AND uaa.is_active = true
ORDER BY uaa.expires_at DESC;

-- Recent purchases without user accounts
SELECT
    p.email,
    p.product_name,
    p.amount,
    p.purchase_date,
    p.platform
FROM purchases p
WHERE p.user_id IS NULL
AND p.purchase_date > now() - interval '30 days'
ORDER BY p.purchase_date DESC;

-- ============================================
-- SECTION 7: CLEANUP OPERATIONS
-- ============================================

-- Clean up old webhook logs (older than 90 days)
DELETE FROM webhook_logs
WHERE created_at < now() - interval '90 days';

-- Clean up failed purchases (older than 30 days)
DELETE FROM purchases
WHERE status = 'failed'
AND purchase_date < now() - interval '30 days';

-- Expire old access
UPDATE user_app_access
SET is_active = false,
    updated_at = now()
WHERE expires_at < now()
AND is_active = true;

-- ============================================
-- SECTION 8: SAFETY CHECKS
-- ============================================

-- Count super admins (should always be at least 1)
SELECT COUNT(*) as super_admin_count
FROM user_roles
WHERE role = 'super_admin';

-- List all super admins
SELECT
    u.email,
    u.created_at,
    u.last_sign_in_at
FROM auth.users u
JOIN user_roles ur ON ur.user_id = u.id
WHERE ur.role = 'super_admin'
ORDER BY u.created_at;

-- Check for orphaned records
-- Orphaned app access (user doesn't exist)
SELECT COUNT(*) as orphaned_access
FROM user_app_access uaa
LEFT JOIN auth.users u ON u.id = uaa.user_id
WHERE u.id IS NULL;

-- Orphaned purchases (user doesn't exist)
SELECT COUNT(*) as orphaned_purchases
FROM purchases p
WHERE p.user_id IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p.user_id);

-- ============================================
-- SECTION 9: STATISTICS
-- ============================================

-- User growth by month
SELECT
    DATE_TRUNC('month', created_at) as month,
    COUNT(*) as new_users
FROM auth.users
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month DESC
LIMIT 12;

-- Active vs inactive users
SELECT
    CASE
        WHEN last_sign_in_at > now() - interval '7 days' THEN '< 7 days'
        WHEN last_sign_in_at > now() - interval '30 days' THEN '< 30 days'
        WHEN last_sign_in_at > now() - interval '90 days' THEN '< 90 days'
        ELSE '> 90 days or never'
    END as last_active,
    COUNT(*) as user_count
FROM auth.users
GROUP BY
    CASE
        WHEN last_sign_in_at > now() - interval '7 days' THEN '< 7 days'
        WHEN last_sign_in_at > now() - interval '30 days' THEN '< 30 days'
        WHEN last_sign_in_at > now() - interval '90 days' THEN '< 90 days'
        ELSE '> 90 days or never'
    END
ORDER BY user_count DESC;

-- Revenue by user
SELECT
    u.email,
    COUNT(DISTINCT p.id) as purchase_count,
    SUM(CASE WHEN p.status = 'completed' THEN p.amount ELSE 0 END) as total_spent,
    MAX(p.purchase_date) as last_purchase
FROM auth.users u
LEFT JOIN purchases p ON p.user_id = u.id
GROUP BY u.id, u.email
HAVING SUM(CASE WHEN p.status = 'completed' THEN p.amount ELSE 0 END) > 0
ORDER BY total_spent DESC
LIMIT 50;

-- ============================================
-- NOTES
-- ============================================

/*
IMPORTANT REMINDERS:

1. ALWAYS backup your database before running DELETE operations
2. Test queries with SELECT before running UPDATE or DELETE
3. Super admins cannot be deleted with these queries (safety feature)
4. Deleting a user cascades to:
   - user_roles
   - user_app_access
   - purchases (if ON DELETE CASCADE)
   - admin_profiles
   - subscription_status
   - user_dashboard_preferences
   - user_achievements

5. For production use, consider:
   - Soft deletes instead of hard deletes
   - Audit logging for all deletions
   - Data retention policies
   - GDPR compliance

6. Rate limits:
   - Be careful with bulk operations
   - Add delays between operations if needed
   - Monitor database performance

7. Recovery:
   - Supabase keeps backups for 7 days
   - Use Point-in-Time Recovery if available
   - Export user list before bulk deletions
*/
