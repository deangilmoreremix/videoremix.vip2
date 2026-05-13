-- Step 1: Ensure the 'videoremix' tenant exists
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

-- Step 2: Assign admin role to user
WITH tenant_cte AS (
  SELECT id FROM public.tenants WHERE slug = 'videoremix' LIMIT 1
)
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

-- Step 3: Verify the assignment
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
