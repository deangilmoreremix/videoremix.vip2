-- =============================================================================
-- Multi-Tenant RLS Policies for VideoRemixVIP
-- Project: bzxohkrxcwodllketcpz
-- App Slug: videoremixvip
-- =============================================================================

-- =============================================================================
-- 1. CREATE OR UPDATE APP RECORD
-- =============================================================================

INSERT INTO apps (slug, name, description, category, is_active, is_public, price_monthly, price_yearly, created_at, updated_at)
VALUES ('videoremixvip', 'VideoRemix VIP', 'Premium Video Creation Platform', 'standalone', true, true, 97, 970, now(), now())
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  is_active = EXCLUDED.is_active,
  is_public = EXCLUDED.is_public,
  price_monthly = EXCLUDED.price_monthly,
  price_yearly = EXCLUDED.price_yearly,
  updated_at = now();

-- =============================================================================
-- 2. ADD APP_ID TO TABLES THAT NEED MULTI-TENANT FILTERING
-- =============================================================================

-- Add app_id to purchases table if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'purchases' AND column_name = 'app_id') THEN
    ALTER TABLE purchases ADD COLUMN app_id uuid REFERENCES apps(id);
  END IF;
END $$;

-- Add app_id to subscriptions table if not exists  
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscriptions' AND column_name = 'app_id') THEN
    ALTER TABLE subscriptions ADD COLUMN app_id uuid REFERENCES apps(id);
  END IF;
END $$;

-- =============================================================================
-- 3. CREATE FUNCTION TO GET CURRENT APP ID
-- =============================================================================

CREATE OR REPLACE FUNCTION public.get_current_app_id()
RETURNS uuid AS $$
  SELECT id FROM apps WHERE slug = 'videoremixvip' LIMIT 1;
$$ LANGUAGE sql STABLE;

-- =============================================================================
-- 4. RLS POLICIES FOR PURCHASES
-- =============================================================================

DROP POLICY IF EXISTS "Users can view their own purchases for current app" ON purchases;
DROP POLICY IF EXISTS "Admins can view all purchases for current app" ON purchases;

-- Users can only see their own purchases for videoremixvip
CREATE POLICY "Users can view their own purchases for current app" ON purchases
FOR SELECT USING (
  user_id = auth.uid() 
  AND app_id = public.get_current_app_id()
);

-- Admins can view all purchases for the app
CREATE POLICY "Admins can view all purchases for current app" ON purchases
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role IN ('super_admin', 'admin')
  )
  AND app_id = public.get_current_app_id()
);

-- =============================================================================
-- 5. RLS POLICIES FOR SUBSCRIPTIONS
-- =============================================================================

DROP POLICY IF EXISTS "Users can view their own subscriptions for current app" ON subscriptions;
DROP POLICY IF EXISTS "Admins can view all subscriptions for current app" ON subscriptions;

CREATE POLICY "Users can view their own subscriptions for current app" ON subscriptions
FOR SELECT USING (
  user_id = auth.uid()
  AND app_id = public.get_current_app_id()
);

CREATE POLICY "Admins can view all subscriptions for current app" ON subscriptions
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role IN ('super_admin', 'admin')
  )
  AND app_id = public.get_current_app_id()
);

-- =============================================================================
-- 6. RLS POLICIES FOR USER_APP_ACCESS
-- =============================================================================

DROP POLICY IF EXISTS "Users can view their own app access" ON user_app_access;
DROP POLICY IF EXISTS "Admins can manage app access" ON user_app_access;

CREATE POLICY "Users can view their own app access" ON user_app_access
FOR SELECT USING (
  user_id = auth.uid()
  AND app_id = public.get_current_app_id()
);

CREATE POLICY "Admins can manage app access" ON user_app_access
FOR USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role IN ('super_admin', 'admin')
  )
);

-- =============================================================================
-- 7. CREATE FUNCTION TO CHECK USER PURCHASE ACCESS
-- =============================================================================

CREATE OR REPLACE FUNCTION public.user_has_purchased(app_slug text)
RETURNS boolean AS $$
  DECLARE
    app_uuid uuid;
    user_uuid uuid;
    has_access boolean;
  BEGIN
    SELECT id INTO app_uuid FROM apps WHERE slug = app_slug LIMIT 1;
    user_uuid := auth.uid();
    
    IF app_uuid IS NULL OR user_uuid IS NULL THEN
      RETURN false;
    END IF;
    
    SELECT EXISTS (
      SELECT 1 FROM user_app_access
      WHERE user_id = user_uuid
        AND app_id = app_uuid
        AND status = 'active'
    ) INTO has_access;
    
    RETURN has_access;
  END;
$$ LANGUAGE plpgsql STABLE;

-- =============================================================================
-- 8. CREATE FUNCTION TO CHECK SUBSCRIPTION ACCESS
-- =============================================================================

CREATE OR REPLACE FUNCTION public.user_has_active_subscription(app_slug text)
RETURNS boolean AS $$
  DECLARE
    app_uuid uuid;
    user_uuid uuid;
    has_subscription boolean;
  BEGIN
    SELECT id INTO app_uuid FROM apps WHERE slug = app_slug LIMIT 1;
    user_uuid := auth.uid();
    
    IF app_uuid IS NULL OR user_uuid IS NULL THEN
      RETURN false;
    END IF;
    
    SELECT EXISTS (
      SELECT 1 FROM subscriptions
      WHERE user_id = user_uuid
        AND app_id = app_uuid
        AND status = 'active'
        AND current_period_end > now()
    ) INTO has_subscription;
    
    RETURN has_subscription;
  END;
$$ LANGUAGE plpgsql STABLE;

-- =============================================================================
-- 9. CONFIRMATION
-- =============================================================================

SELECT 'Multi-tenant RLS policies configured for videoremixvip!' as status;