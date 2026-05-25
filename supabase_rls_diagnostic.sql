-- Check RLS policies and performance
-- Run this in Supabase SQL Editor to diagnose RLS issues

-- 1. Check which tables have RLS enabled
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- 2. Check RLS policies
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 3. Check for missing indexes on commonly queried columns
SELECT
  t.tablename,
  i.indexname,
  i.indexdef
FROM pg_indexes i
JOIN pg_tables t ON i.tablename = t.tablename
WHERE t.schemaname = 'public'
  AND t.tablename IN ('user_app_access', 'user_roles', 'user_dashboard_preferences', 'user_achievements')
ORDER BY t.tablename, i.indexname;

-- 4. Check query performance for common auth-related queries
-- (Run these individually to see execution plans)

-- EXPLAIN ANALYZE SELECT * FROM user_app_access WHERE user_id = 'some-user-id' AND is_active = true;
-- EXPLAIN ANALYZE SELECT * FROM user_roles WHERE user_id = 'some-user-id';
-- EXPLAIN ANALYZE SELECT * FROM user_dashboard_preferences WHERE user_id = 'some-user-id';</content>
<parameter name="filePath">supabase_rls_diagnostic.sql