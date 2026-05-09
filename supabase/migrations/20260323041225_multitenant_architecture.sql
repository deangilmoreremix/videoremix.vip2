-- =============================================================================
-- MULTI-TENANT DATABASE ARCHITECTURE
-- Project: bzxohkrxcwodllketcpz
-- =============================================================================
-- This architecture supports:
-- - Multiple applications (e.g., videoremixvip, other apps)
-- - Each application has its own distinct users
-- - Proper isolation with RLS policies
-- - Cross-application data leakage prevention
-- - Shared infrastructure capabilities
-- =============================================================================

-- =============================================================================
-- 1. CORE MULTI-TENANT TABLES
-- =============================================================================

-- Tenants table (organizations/companies that own apps)
CREATE TABLE IF NOT EXISTS tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text DEFAULT '',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
-- Add description column to tenants table if it does not exist
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS description text DEFAULT '';

-- Apps table (applications owned by tenants)
ALTER TABLE apps ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id);
ALTER TABLE apps ADD COLUMN IF NOT EXISTS app_type text DEFAULT 'standalone';
ALTER TABLE apps ADD COLUMN IF NOT EXISTS is_multi_tenant boolean DEFAULT false;

-- =============================================================================
-- 2. USER TO APPLICATION MAPPING
-- =============================================================================

-- User App Access (maps users to apps they can access)
-- This is the primary table for multi-tenant user isolation
ALTER TABLE user_app_access ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id);
ALTER TABLE user_app_access ADD COLUMN IF NOT EXISTS invited_by uuid REFERENCES auth.users(id);
ALTER TABLE user_app_access ADD COLUMN IF NOT EXISTS invitation_token text;
ALTER TABLE user_app_access ADD COLUMN IF NOT EXISTS invitation_expires_at timestamptz;

-- User Profiles with tenant context
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS primary_app_id uuid REFERENCES apps(id);

-- =============================================================================
-- 3. ROLE-BASED ACCESS PATTERNS
-- =============================================================================

-- Extend user_roles to include tenant context
ALTER TABLE user_roles ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id);
ALTER TABLE user_roles ADD COLUMN IF NOT EXISTS app_id uuid REFERENCES apps(id);

-- Create role within app context (e.g., app_admin, app_user)
CREATE TYPE user_app_role AS ENUM ('owner', 'admin', 'member', 'viewer');

CREATE TABLE IF NOT EXISTS app_user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  app_id uuid REFERENCES apps(id) ON DELETE CASCADE NOT NULL,
  role user_app_role NOT NULL DEFAULT 'viewer',
  tenant_id uuid REFERENCES tenants(id),
  granted_by uuid REFERENCES auth.users(id),
  granted_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  is_active boolean DEFAULT true,
  UNIQUE(user_id, app_id)
);

-- =============================================================================
-- 4. SUBSCRIPTIONS & PURCHASES WITH TENANT CONTEXT
-- =============================================================================

ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id);
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id);

-- =============================================================================
-- 5. INDEXES FOR PERFORMANCE
-- =============================================================================

-- Tenant-based indexes
CREATE INDEX IF NOT EXISTS idx_apps_tenant_id ON apps(tenant_id);
CREATE INDEX IF NOT EXISTS idx_apps_slug ON apps(slug);
CREATE INDEX IF NOT EXISTS idx_user_app_access_tenant_id ON user_app_access(tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_app_access_user_tenant ON user_app_access(user_id, tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_app_access_app_tenant ON user_app_access(app_slug, tenant_id);
CREATE INDEX IF NOT EXISTS idx_profiles_tenant_id ON profiles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_tenant_id ON user_roles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_app_user_roles_app ON app_user_roles(app_id);
CREATE INDEX IF NOT EXISTS idx_app_user_roles_user_app ON app_user_roles(user_id, app_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_tenant_id ON subscriptions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_purchases_tenant_id ON purchases(tenant_id);

-- =============================================================================
-- 6. RLS POLICIES FOR MULTI-TENANT ISOLATION
-- =============================================================================

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_user_roles ENABLE ROW LEVEL SECURITY;

-- Tenants: Only super admins can manage
CREATE POLICY "Super admins can manage tenants" ON tenants
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'super_admin'
  )
);

-- App User Roles: Users can view their own roles
CREATE POLICY "Users can view own app roles" ON app_user_roles
FOR SELECT USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role IN ('super_admin', 'admin')
  )
);

-- App User Roles: Admins can manage
CREATE POLICY "Admins can manage app roles" ON app_user_roles
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role IN ('super_admin', 'admin')
  )
);

-- =============================================================================
-- 7. HELPER FUNCTIONS FOR MULTI-TENANT ACCESS
-- =============================================================================

-- Get user's current tenant
CREATE OR REPLACE FUNCTION public.get_current_tenant_id()
RETURNS uuid AS $$
  SELECT tenant_id FROM user_roles 
  WHERE user_id = auth.uid() 
  ORDER BY created_at DESC 
  LIMIT 1;
$$ LANGUAGE sql STABLE;

-- Get user's accessible apps
CREATE OR REPLACE FUNCTION public.get_user_app_ids()
RETURNS uuid[] AS $$
  SELECT ARRAY(
    SELECT id FROM apps 
    WHERE slug IN (
      SELECT app_slug FROM user_app_access 
      WHERE user_id = auth.uid() 
      AND is_active = true
    )
  );
$$ LANGUAGE sql STABLE;

-- Check if user has access to specific app
CREATE OR REPLACE FUNCTION public.user_has_app_access(app_slug text)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_app_access 
    WHERE user_id = auth.uid() 
    AND app_slug = app_slug 
    AND is_active = true
  );
$$ LANGUAGE sql STABLE;

-- Get user's role in specific app
CREATE OR REPLACE FUNCTION public.get_user_app_role(app_slug text)
RETURNS text AS $$
  SELECT role::text FROM app_user_roles 
  WHERE user_id = auth.uid() 
  AND app_id = (SELECT id FROM apps WHERE slug = app_slug LIMIT 1)
  AND is_active = true
  LIMIT 1;
$$ LANGUAGE sql STABLE;

-- Check if user is admin of app
CREATE OR REPLACE FUNCTION public.user_is_app_admin(app_slug text)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM app_user_roles 
    WHERE user_id = auth.uid() 
    AND app_id = (SELECT id FROM apps WHERE slug = app_slug LIMIT 1)
    AND role IN ('owner', 'admin')
    AND is_active = true
  );
$$ LANGUAGE sql STABLE;

-- =============================================================================
-- 8. APPLICATION ONBOARDING FUNCTIONS
-- =============================================================================

-- Create new tenant (organization)
CREATE OR REPLACE FUNCTION public.create_tenant(
  p_name text,
  p_slug text,
  p_description text DEFAULT ''
)
RETURNS uuid AS $$
  DECLARE
    v_tenant_id uuid;
  BEGIN
    -- Only super admins can create tenants
    IF NOT EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'super_admin'
    ) THEN
      RAISE EXCEPTION 'Only super admins can create tenants';
    END IF;
    
    INSERT INTO tenants (name, slug, description)
    VALUES (p_name, p_slug, p_description)
    RETURNING id INTO v_tenant_id;
    
    RETURN v_tenant_id;
  END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create new application under tenant
CREATE OR REPLACE FUNCTION public.create_app(
  p_name text,
  p_slug text,
  p_description text DEFAULT '',
  p_tenant_id uuid DEFAULT NULL,
  p_is_multi_tenant boolean DEFAULT false
)
RETURNS uuid AS $$
  DECLARE
    v_app_id uuid;
  BEGIN
    -- Only admins can create apps
    IF NOT EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('super_admin', 'admin')
    ) THEN
      RAISE EXCEPTION 'Only admins can create applications';
    END IF;
    
    INSERT INTO apps (
      name, slug, description, tenant_id, 
      is_multi_tenant, is_active, is_public,
      created_at, updated_at
    )
    VALUES (
      p_name, p_slug, p_description, p_tenant_id,
      p_is_multi_tenant, true, false,
      now(), now()
    )
    RETURNING id INTO v_app_id;
    
    RETURN v_app_id;
  END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Invite user to application
CREATE OR REPLACE FUNCTION public.invite_user_to_app(
   p_app_id uuid,
   p_email text,
   p_role user_app_role DEFAULT 'viewer',
   pExpiresInDays int DEFAULT 7
)
RETURNS uuid AS $$
   DECLARE
     v_invitation_token text;
     v_invitation_id uuid;
     v_user_id uuid;
   BEGIN
     -- Only app admins can invite users
     IF NOT public.user_is_app_access(p_app_id) THEN
       RAISE EXCEPTION 'You do not have access to this application';
     END IF;
     
     -- Generate invitation token
     v_invitation_token := encode(gen_random_bytes(32), 'hex');
     
     -- Check if user exists
     SELECT id INTO v_user_id FROM auth.users WHERE email = p_email;
     
     -- Create invitation record
     INSERT INTO user_app_access (
       user_id, app_id, status, invited_by,
       invitation_token, invitation_expires_at,
       created_at, updated_at
     )
     VALUES (
       v_user_id, p_app_id, 'pending', auth.uid(),
       v_invitation_token, now() + (pExpiresInDays || ' days')::interval,
       now(), now()
     )
     RETURNING id INTO v_invitation_id;
     
     RETURN v_invitation_id;
   END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Accept invitation and join app
CREATE OR REPLACE FUNCTION public.accept_app_invitation(
   p_invitation_token text
)
RETURNS void AS $$
   BEGIN
     UPDATE user_app_access
     SET status = 'active',
         invitation_token = NULL,
         updated_at = now()
     WHERE invitation_token = p_invitation_token
       AND invitation_expires_at > now()
       AND user_id = auth.uid();
       
     IF NOT FOUND THEN
       RAISE EXCEPTION 'Invalid or expired invitation';
     END IF;
   END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- 9. SEED DEFAULT TENANT FOR VIDEREMIXVIP
-- =============================================================================

INSERT INTO tenants (id, name, slug, description, is_active, created_at, updated_at)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'VideoRemix Organization', 'videoremix', 'Parent organization for VideoRemix applications', true, now(), now())
ON CONFLICT (id) DO NOTHING;

-- Update videoremixvip app to use this tenant
UPDATE apps SET tenant_id = '00000000-0000-0000-0000-000000000001' 
WHERE slug = 'videoremixvip';

-- =============================================================================
-- CONFIRMATION
-- =============================================================================

SELECT 'Multi-tenant architecture configured!' as status;
SELECT 'Tables updated: tenants, apps, user_app_access, profiles, user_roles, app_user_roles, subscriptions, purchases' as updated_components;
SELECT name, slug, id FROM tenants;
SELECT name, slug, tenant_id FROM apps WHERE slug = 'videoremixvip';
