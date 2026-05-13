-- Fix admin user role assignment
-- This script assigns the admin role to the admin user so they can see all apps (including inactive) in the dashboard

-- First, ensure the tenant exists (should already exist)
INSERT INTO tenants (id, name, slug, domain, is_active) 
VALUES (gen_random_uuid(), 'VideoRemix', 'videoremix', 'videoremix.vip', true)
ON CONFLICT (slug) DO NOTHING;

-- Get the tenant ID
WITH tenant AS (
  SELECT id FROM tenants WHERE slug = 'videoremix' LIMIT 1
)
-- Insert admin role for the user (replace user_id with actual admin user ID)
INSERT INTO user_roles (user_id, role, tenant_id)
SELECT '12d69594-82f1-4fff-ad9b-8d7ff2bfc7fd', 'admin', id
FROM tenant
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';

-- Verify the assignment
SELECT ur.user_id, ur.role, t.name as tenant_name
FROM user_roles ur
JOIN tenants t ON ur.tenant_id = t.id
WHERE ur.user_id = '12d69594-82f1-4fff-ad9b-8d7ff2bfc7fd';
