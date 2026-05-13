-- ============================================================================
-- ADMIN ROLE ASSIGNMENT FIX
-- ============================================================================
-- Purpose: Grant admin privileges to user ID 12d69594-82f1-4fff-ad9b-8d7ff2bfc7fd
-- This resolves the issue where the admin user cannot view all apps (including
-- inactive ones) because they lack an entry in the user_roles table.
--
-- Execution: Run this SQL in the Supabase SQL Editor (web interface)
-- Navigate to: https://supabase.com/dashboard/project/<your-project>/sql
-- Paste and execute the entire script.
-- ============================================================================

-- Enable client-side messages for verification
\echo '=== ADMIN ROLE ASSIGNMENT START ==='

-- Step 1: Ensure the 'videoremix' tenant exists
-- This uses INSERT ... ON CONFLICT to avoid errors if tenant already exists
INSERT INTO public.tenants (id, name, slug, domain, is_active)
VALUES (
  gen_random_uuid(),
  'VideoRemix',
  'videoremix',
  'videoremix.vip',
  true
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  domain = EXCLUDED.domain,
  is_active = EXCLUDED.is_active
RETURNING id AS tenant_id;
\echo 'Tenant ensured (see result above)'

-- Step 2: Get the tenant ID (must exist after Step 1)
-- We use a CTE to fetch the tenant_id for use in the INSERT
WITH tenant_cte AS (
  SELECT id
  FROM public.tenants
  WHERE slug = 'videoremix'
  LIMIT 1
)
-- Step 3: Insert or update the admin role for the target user
-- The UNIQUE constraint on user_roles(user_id) ensures one row per user.
-- ON CONFLICT DO UPDATE changes the role to 'admin' if a record already exists.
INSERT INTO public.user_roles (user_id, role, tenant_id)
SELECT 
  '12d69594-82f1-4fff-ad9b-8d7ff2bfc7fd'::uuid,
  'admin',
  t.id
FROM tenant_cte t
ON CONFLICT (user_id) DO UPDATE SET
  role = 'admin',
  tenant_id = EXCLUDED.tenant_id,
  updated_at = now();
\echo 'Admin role assignment attempted (check verification query below)'

-- Step 4: Verification - confirm the admin role is properly assigned
\echo '=== VERIFICATION QUERY ==='
SELECT 
  ur.user_id,
  ur.role,
  ur.tenant_id,
  t.slug AS tenant_slug,
  t.name AS tenant_name,
  ur.created_at,
  ur.updated_at
FROM public.user_roles ur
JOIN public.tenants t ON ur.tenant_id = t.id
WHERE ur.user_id = '12d69594-82f1-4fff-ad9b-8d7ff2bfc7fd';

\echo '=== ADMIN ROLE ASSIGNMENT COMPLETE ==='
\echo 'If the verification query above returned a row with role = "admin", the fix succeeded.'
\echo 'If no rows returned, the assignment failed - check that the user ID is correct.'
