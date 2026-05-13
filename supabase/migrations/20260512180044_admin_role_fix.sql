-- Migration: Assign Super Admin role to user 12d69594-82f1-4fff-ad9b-8d7ff2bfc7fd
-- The user_profiles.role has CHECK constraint allowing: owner, admin, member, viewer
-- The user_roles.role_id references roles.id (system roles like Super Admin)

-- Step 1: Create user_profiles entry (if not exists)
INSERT INTO public.user_profiles (id, tenant_id, email, full_name, role, is_tenant_admin)
SELECT 
  '12d69594-82f1-4fff-ad9b-8d7ff2bfc7fd'::uuid,
  'f948089b-50bc-445d-9137-85b580574455'::uuid,  -- VideoRemix tenant
  'admin@videoremix.vip',
  'Admin User',
  'admin',  -- Valid value: owner, admin, member, viewer
  true
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_profiles 
  WHERE id = '12d69594-82f1-4fff-ad9b-8d7ff2bfc7fd'::uuid
);

-- Step 2: Assign Super Admin role in user_roles (if not exists)
INSERT INTO public.user_roles (user_id, role_id, tenant_id, granted_by, granted_at)
SELECT 
  '12d69594-82f1-4fff-ad9b-8d7ff2bfc7fd'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,  -- Super Admin role ID
  'f948089b-50bc-445d-9137-85b580574455'::uuid,  -- VideoRemix tenant
  '12d69594-82f1-4fff-ad9b-8d7ff2bfc7fd'::uuid,  -- granted_by (self)
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_roles 
  WHERE user_id = '12d69594-82f1-4fff-ad9b-8d7ff2bfc7fd'::uuid
);
