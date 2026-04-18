-- Add missing database functions for purchase access

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

-- Get user's purchased apps
CREATE OR REPLACE FUNCTION public.get_user_purchased_apps(user_uuid uuid)
RETURNS text[] AS $$
  SELECT ARRAY(
    SELECT DISTINCT app_slug 
    FROM user_app_access 
    WHERE user_id = user_uuid 
    AND is_active = true
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Get user's app access details
CREATE OR REPLACE FUNCTION public.get_user_app_access_details(user_uuid uuid)
RETURNS jsonb AS $$
  SELECT jsonb_agg(
    jsonb_build_object(
      'app_slug', app_slug,
      'access_type', access_type,
      'granted_at', granted_at,
      'expires_at', expires_at,
      'is_active', is_active
    )
  )
  FROM user_app_access 
  WHERE user_id = user_uuid;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Get all user purchases
CREATE OR REPLACE FUNCTION public.get_all_user_purchases(user_uuid uuid)
RETURNS jsonb AS $$
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', id,
      'product_name', product_name,
      'amount', amount,
      'currency', currency,
      'status', status,
      'purchase_date', purchase_date
    )
  )
  FROM purchases 
  WHERE user_id = user_uuid;
$$ LANGUAGE sql STABLE SECURITY DEFINER;
