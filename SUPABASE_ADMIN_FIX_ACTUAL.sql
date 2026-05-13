-- Admin role assignment for ACTUAL database schema
-- The database uses a normalized roles table with role_id FK, not a text 'role' column

-- Step 1: Get the Super Admin role ID (it already exists)
-- Super Admin role ID is typically: 00000000-0000-0000-0000-000000000001
-- But we'll query it dynamically to be safe

-- Step 2: Get the tenant ID for 'videoremix' (already exists)
WITH tenant AS (
  SELECT id FROM public.tenants WHERE slug = 'videoremix' LIMIT 1
),
role AS (
  SELECT id FROM public.roles WHERE name = 'Super Admin' LIMIT 1
)
-- Step 3: Insert the user_roles assignment
INSERT INTO public.user_roles (user_id, role_id, tenant_id, granted_by, granted_at)
SELECT 
  '12d69594-82f1-4fff-ad9b-8d7ff2bfc7fd'::uuid,
  r.id,
  t.id,
  '12d69594-82f1-4fff-ad9b-8d7ff2bfc7fd'::uuid,  -- granted_by = self (or could be NULL/system)
  now()
FROM tenant t, role r
ON CONFLICT (user_id, tenant_id) DO UPDATE SET
  role_id = EXCLUDED.role_id,
  granted_by = EXCLUDED.granted_by,
  granted_at = now();

-- Step 4: Verify the assignment
SELECT 
  ur.user_id,
  ur.role_id,
  r.name AS role_name,
  ur.tenant_id,
  t.slug AS tenant_slug,
  t.name AS tenant_name,
  ur.granted_at
FROM public.user_roles ur
JOIN public.tenants t ON ur.tenant_id = t.id
JOIN public.roles r ON ur.role_id = r.id
WHERE ur.user_id = '12d69594-82f1-4fff-ad9b-8d7ff2bfc7fd';
