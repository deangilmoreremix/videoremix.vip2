-- Complete Admin Fix for Actual Database Schema
-- User: 12d69594-82f1-4fff-ad9b-8d7ff2bfc7fd

-- Step 1: Ensure user profile exists in user_profiles
-- The user_roles table has FK to user_profiles(id)
INSERT INTO public.user_profiles (id, tenant_id, email, full_name, role)
SELECT 
  '12d69594-82f1-4fff-ad9b-8d7ff2bfc7fd'::uuid,
  'f948089b-50bc-445d-9137-85b580574455'::uuid,  -- VideoRemix tenant
  'admin@videoremix.vip',  -- Admin email
  'Admin User',
  'Super Admin'
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_profiles 
  WHERE id = '12d69594-82f1-4fff-ad9b-8d7ff2bfc7fd'::uuid
)
RETURNING id, email, role;

-- Step 2: Assign Super Admin role in user_roles
-- Get the Super Admin role ID (should be 00000000-0000-0000-0000-000000000001)
INSERT INTO public.user_roles (user_id, role_id, tenant_id, granted_by, granted_at)
SELECT 
  '12d69594-82f1-4fff-ad9b-8d7ff2bfc7fd'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,  -- Super Admin role
  'f948089b-50bc-445d-9137-85b580574455'::uuid,  -- VideoRemix tenant
  '12d69594-82f1-4fff-ad9b-8d7ff2bfc7fd'::uuid,  -- granted_by (self)
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_roles 
  WHERE user_id = '12d69594-82f1-4fff-ad9b-8d7ff2bfc7fd'::uuid
)
RETURNING user_id, role_id, tenant_id, granted_at;

-- Step 3: Verify the complete setup
SELECT 
  up.id AS user_id,
  up.email,
  up.role AS profile_role,
  ur.role_id,
  r.name AS role_name,
  ur.tenant_id,
  t.slug AS tenant_slug,
  ur.granted_at
FROM public.user_profiles up
LEFT JOIN public.user_roles ur ON up.id = ur.user_id
LEFT JOIN public.roles r ON ur.role_id = r.id
LEFT JOIN public.tenants t ON ur.tenant_id = t.id
WHERE up.id = '12d69594-82f1-4fff-ad9b-8d7ff2bfc7fd';
EOF'

npx supabase db query --file ADMIN_FIX_COMPLETE.sql --linked --output table