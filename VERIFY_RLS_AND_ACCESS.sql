-- ============================================================================
-- VERIFICATION SCRIPT: RLS Policies and Access Control
-- ============================================================================
-- Purpose: Verify that RLS policies work correctly after admin role assignment
-- Run this AFTER executing SUPABASE_ADMIN_FIX.sql
-- ============================================================================

\echo '=== RLS POLICY VERIFICATION ==='
\echo ''

-- Check 1: Verify RLS is enabled on critical tables
\echo '1. RLS Status on apps table:'
SELECT
  tablename,
  rowsecurity,
  CASE rowsecurity WHEN true THEN 'ENABLED' ELSE 'DISABLED' END AS status
FROM pg_tables
WHERE tablename = 'apps' AND schemaname = 'public';
\echo ''

\echo '2. RLS Status on user_roles table:'
SELECT
  tablename,
  rowsecurity,
  CASE rowsecurity WHEN true THEN 'ENABLED' ELSE 'DISABLED' END AS status
FROM pg_tables
WHERE tablename = 'user_roles' AND schemaname = 'public';
\echo ''

-- Check 2: List all RLS policies on apps table
\echo '3. RLS Policies on apps table:'
SELECT
  p.policyname,
  p.cmd,
  p.qual,
  p.with_check
FROM pg_policies p
WHERE p.tablename = 'apps' AND p.schemaname = 'public'
ORDER BY p.policyname;
\echo ''

-- Check 3: List all RLS policies on user_roles table
\echo '4. RLS Policies on user_roles table:'
SELECT
  p.policyname,
  p.cmd,
  p.qual,
  p.with_check
FROM pg_policies p
WHERE p.tablename = 'user_roles' AND p.schemaname = 'public'
ORDER BY p.policyname;
\echo ''

-- Check 4: Verify the admin user role exists
\echo '5. Admin user role record:'
SELECT 
  ur.user_id,
  ur.role,
  t.slug AS tenant_slug,
  ur.created_at
FROM public.user_roles ur
JOIN public.tenants t ON ur.tenant_id = t.id
WHERE ur.user_id = '12d69594-82f1-4fff-ad9b-8d7ff2bfc7fd';
\echo ''

-- Check 5: Count apps by status (should be 204 total based on earlier info)
\echo '6. Apps summary:'
SELECT 
  COUNT(*) AS total_apps,
  COUNT(*) FILTER (WHERE is_active = true) AS active_apps,
  COUNT(*) FILTER (WHERE is_active = false) AS inactive_apps
FROM public.apps;
\echo ''

-- Check 6: Test policy evaluation via actual query simulation
-- This tests the RLS policy condition as it would be evaluated for the admin user
\echo '7. Simulated RLS evaluation for admin user (using SET ROLE would be needed for true test):'
\echo '   Expected: Admin should see ALL apps (active + inactive)'
\echo '   Actual query (as superuser bypassing RLS):'
SELECT COUNT(*) AS all_apps_count FROM public.apps;
\echo '   Note: In application with RLS active, admin user should also see this count.'
\echo ''

-- Check 7: user_roles table statistics
\echo '8. user_roles table contents (all roles):'
SELECT role, COUNT(*) AS count FROM public.user_roles GROUP BY role ORDER BY role;
\echo ''

\echo '=== VERIFICATION COMPLETE ==='
\echo ''
\echo 'MANUAL TESTING STEPS:'
\echo '1. Log into the application as admin user (email/password for user ID 12d69594...)'
\echo '2. Verify AdminContext loads successfully (no sign-out)'
\echo '3. Navigate to Dashboard - should see ALL apps (including any inactive ones)'
\echo '4. Check that app cards display full GTM info: description, benefits, features, use_cases'
\echo '5. For a locked app (not purchased), verify overlay shows with purchase prompt'
\echo '6. For an owned app, verify launch button works'
