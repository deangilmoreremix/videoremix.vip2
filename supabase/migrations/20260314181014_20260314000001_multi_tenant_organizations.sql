/*
  # Multi-Tenant Organization System

  ## Summary
  Adds full multi-tenancy support by introducing an organizations (tenants) layer.
  Each user can belong to one or more organizations. Data is isolated per tenant
  using Row Level Security policies.

  ## New Tables
  - organizations - tenant workspaces
  - organization_members - user membership within orgs
  - user_profiles - extended user profile with org context

  ## Security
  - RLS enabled on all new tables with restrictive policies
  - Auto-creation of personal org + profile on user signup via updated trigger
*/

-- ==========================================
-- UPDATED TIMESTAMP HELPER
-- ==========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- USER PROFILES TABLE (no foreign deps except auth.users)
-- ==========================================
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name text NOT NULL DEFAULT '',
  last_name text NOT NULL DEFAULT '',
  display_name text NOT NULL DEFAULT '',
  avatar_url text,
  default_organization_id uuid,
  onboarding_completed boolean NOT NULL DEFAULT false,
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Super admins can view all profiles"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
        AND role IN ('super_admin', 'admin')
    )
  );

-- ==========================================
-- ORGANIZATIONS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan text NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
  settings jsonb NOT NULL DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_organizations_owner_id ON organizations(owner_id);
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Simple ownership-based policy first (will be enhanced after org_members exists)
CREATE POLICY "Organization owners can view their organization"
  ON organizations FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "Organization owners can update their organization"
  ON organizations FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Authenticated users can create organizations"
  ON organizations FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

-- ==========================================
-- ORGANIZATION MEMBERS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS organization_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  invited_by uuid REFERENCES auth.users(id),
  joined_at timestamptz DEFAULT now(),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organization_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_org_members_user_id ON organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_org_id ON organization_members(organization_id);

ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own memberships"
  ON organization_members FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Org owners can view all memberships"
  ON organization_members FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Org owners can add members"
  ON organization_members FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Org owners can update members"
  ON organization_members FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    )
  );

-- Now add a member-based view policy for organizations
CREATE POLICY "Organization members can view their organizations"
  ON organizations FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- ==========================================
-- FK: user_profiles -> organizations
-- ==========================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'user_profiles_default_organization_id_fkey'
  ) THEN
    ALTER TABLE user_profiles
      ADD CONSTRAINT user_profiles_default_organization_id_fkey
      FOREIGN KEY (default_organization_id)
      REFERENCES organizations(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_user_profiles_default_org ON user_profiles(default_organization_id);

-- ==========================================
-- TRIGGERS FOR updated_at
-- ==========================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_organizations_updated_at'
  ) THEN
    CREATE TRIGGER update_organizations_updated_at
      BEFORE UPDATE ON organizations
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_org_members_updated_at'
  ) THEN
    CREATE TRIGGER update_org_members_updated_at
      BEFORE UPDATE ON organization_members
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_user_profiles_updated_at'
  ) THEN
    CREATE TRIGGER update_user_profiles_updated_at
      BEFORE UPDATE ON user_profiles
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- ==========================================
-- UPDATED handle_new_user TRIGGER FUNCTION
-- ==========================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id uuid;
  v_first_name text;
  v_last_name text;
  v_display_name text;
  v_org_slug text;
BEGIN
  v_first_name := COALESCE(NEW.raw_user_meta_data->>'first_name', '');
  v_last_name := COALESCE(NEW.raw_user_meta_data->>'last_name', '');
  v_display_name := TRIM(v_first_name || ' ' || v_last_name);
  IF v_display_name = '' THEN
    v_display_name := COALESCE(SPLIT_PART(NEW.email, '@', 1), NEW.id::text);
  END IF;

  -- Create user_roles entry
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (user_id) DO NOTHING;

  -- Create admin_profiles entry
  INSERT INTO public.admin_profiles (user_id, email, full_name)
  VALUES (NEW.id, COALESCE(NEW.email, ''), v_display_name)
  ON CONFLICT (user_id) DO NOTHING;

  -- Create user_profiles entry (without default_organization_id yet)
  INSERT INTO public.user_profiles (user_id, first_name, last_name, display_name)
  VALUES (NEW.id, v_first_name, v_last_name, v_display_name)
  ON CONFLICT (user_id) DO NOTHING;

  -- Generate a unique org slug
  v_org_slug := REGEXP_REPLACE(
    LOWER(COALESCE(SPLIT_PART(NEW.email, '@', 1), 'user')),
    '[^a-z0-9]', '-', 'g'
  );
  v_org_slug := v_org_slug || '-' || SUBSTRING(NEW.id::text, 1, 8);

  -- Create a personal organization
  INSERT INTO public.organizations (slug, name, owner_id, plan)
  VALUES (
    v_org_slug,
    COALESCE(v_display_name || '''s Workspace', 'My Workspace'),
    NEW.id,
    'free'
  )
  RETURNING id INTO v_org_id;

  -- Add user as owner of their org
  INSERT INTO public.organization_members (organization_id, user_id, role)
  VALUES (v_org_id, NEW.id, 'owner')
  ON CONFLICT (organization_id, user_id) DO NOTHING;

  -- Set default org on profile
  UPDATE public.user_profiles
  SET default_organization_id = v_org_id
  WHERE user_id = NEW.id;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'handle_new_user error for user %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;

-- Recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ==========================================
-- HELPER FUNCTION
-- ==========================================
CREATE OR REPLACE FUNCTION get_user_organization_id(p_user_id uuid DEFAULT auth.uid())
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT default_organization_id
  FROM user_profiles
  WHERE user_id = p_user_id
  LIMIT 1;
$$;

-- ==========================================
-- GRANTS
-- ==========================================
GRANT SELECT, INSERT, UPDATE ON organizations TO authenticated;
GRANT SELECT, INSERT, UPDATE ON organization_members TO authenticated;
GRANT SELECT, INSERT, UPDATE ON user_profiles TO authenticated;
