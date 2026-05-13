-- Admin Role Assignment for ACTUAL Database Schema
-- User: 12d69594-82f1-4fff-ad9b-8d7ff2bfc7fd

-- Step 1: Verify roles table has Super Admin
SELECT 'Roles available:' AS info, id, name FROM public.roles ORDER BY name;

-- Step 2: Verify tenant exists
SELECT 'Tenant:' AS info, id, name, slug FROM public.tenants WHERE slug = 'videoremix';

-- Step 3: Insert admin role (table is empty, no conflict expected)
INSERT INTO public.user_roles (user_id, role_id, tenant_id, granted_by, granted_at)
VALUES (
  '12d69594-82f1-4fff-ad9b-8d7ff2bfc7fd'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,  -- Super Admin role
  'f948089b-50bc-445d-9137-85b580574455'::uuid,  -- VideoRemix tenant
  '12d69594-82f1-4fff-ad9b-8d7ff2bfc7fd'::uuid,  -- granted_by (self)
  now()
)
RETURNING user_id, role_id, tenant_id, granted_at;

-- Step 4: Verify the assignment
SELECT 
  ur.user_id,
  r.name AS role_name,
  t.slug AS tenant_slug,
  t.name AS tenant_name,
  ur.granted_at
FROM public.user_roles ur
JOIN public.roles r ON ur.role_id = r.id
JOIN public.tenants t ON ur.tenant_id = t.id
WHERE ur.user_id = '12d69594-82f1-4fff-ad9b-8d7ff2bfc7fd';
