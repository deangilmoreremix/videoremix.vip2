
/*
  # Fix mutable search_path on functions and fix SECURITY DEFINER view

  ## Summary
  Functions with a mutable search_path are vulnerable to search_path injection
  attacks where a malicious user could create objects in a schema that shadows
  intended objects. All functions are recreated with `SET search_path = public`
  to pin the search path.

  The apps_with_features view is recreated without SECURITY DEFINER so it
  executes with the calling user's permissions instead of the definer's.

  ## Affected Functions
  - update_app_feature_count (trigger)
  - update_app_included_features (trigger)
  - user_has_feature_access (security definer)
  - check_and_revoke_expired_subscriptions (security definer)
  - restore_subscription_access (security definer)
  - update_updated_at_column (trigger)

  ## Affected Views
  - apps_with_features (SECURITY DEFINER removed)
*/

-- ============================================================
-- update_updated_at_column
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ============================================================
-- update_app_feature_count
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_app_feature_count()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  UPDATE apps
  SET feature_count = (
    SELECT COUNT(*)
    FROM app_feature_links
    WHERE app_feature_links.app_id = COALESCE(NEW.app_id, OLD.app_id)
  )
  WHERE id = COALESCE(NEW.app_id, OLD.app_id);

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- ============================================================
-- update_app_included_features
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_app_included_features()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  UPDATE apps
  SET included_feature_ids = (
    SELECT COALESCE(jsonb_agg(feature_id ORDER BY sort_order), '[]'::jsonb)
    FROM app_feature_links
    WHERE app_feature_links.app_id = COALESCE(NEW.app_id, OLD.app_id)
  )
  WHERE id = COALESCE(NEW.app_id, OLD.app_id);

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- ============================================================
-- user_has_feature_access
-- ============================================================
CREATE OR REPLACE FUNCTION public.user_has_feature_access(
  user_id_param uuid,
  feature_id_param uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  feature_parent_id uuid;
  has_access boolean;
BEGIN
  SELECT parent_app_id INTO feature_parent_id
  FROM apps
  WHERE id = feature_id_param;

  IF feature_parent_id IS NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM user_app_access
      WHERE user_id = user_id_param
        AND app_id = feature_id_param
        AND (expires_at IS NULL OR expires_at > now())
    ) INTO has_access;
    RETURN has_access;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM user_app_access
    WHERE user_id = user_id_param
      AND app_id = feature_parent_id
      AND (expires_at IS NULL OR expires_at > now())
  ) INTO has_access;

  RETURN has_access;
END;
$$;

-- ============================================================
-- restore_subscription_access
-- ============================================================
CREATE OR REPLACE FUNCTION public.restore_subscription_access(
  p_user_id uuid,
  p_app_slug text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE user_app_access
  SET
    is_active = true,
    updated_at = now()
  WHERE user_id = p_user_id
    AND app_slug = p_app_slug
    AND access_type = 'subscription';

  RETURN FOUND;
END;
$$;

-- ============================================================
-- check_and_revoke_expired_subscriptions
-- ============================================================
CREATE OR REPLACE FUNCTION public.check_and_revoke_expired_subscriptions()
RETURNS TABLE(revoked_count integer, grace_period_count integer, details jsonb)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_revoked_count integer := 0;
  v_grace_period_count integer := 0;
  v_details jsonb := '[]'::jsonb;
  v_grace_period_days integer := 3;
  v_now timestamptz := now();
BEGIN
  WITH expired_subs AS (
    SELECT
      ss.id as subscription_id,
      ss.user_id,
      ss.platform_subscription_id,
      uaa.app_slug,
      uaa.id as access_id,
      ss.current_period_end
    FROM subscription_status ss
    JOIN user_app_access uaa ON uaa.user_id = ss.user_id
    WHERE ss.status IN ('active', 'expired')
      AND ss.current_period_end < v_now
      AND uaa.access_type = 'subscription'
      AND uaa.is_active = true
  )
  INSERT INTO access_revocation_log (user_id, app_slug, reason, subscription_id, revoked_at)
  SELECT user_id, app_slug, 'expired', subscription_id, v_now
  FROM expired_subs
  RETURNING 1 INTO v_revoked_count;

  UPDATE subscription_status
  SET status = 'expired', updated_at = v_now
  WHERE status = 'active'
    AND current_period_end < v_now;

  UPDATE user_app_access
  SET is_active = false, updated_at = v_now
  WHERE id IN (
    SELECT uaa.id
    FROM user_app_access uaa
    JOIN subscription_status ss ON ss.user_id = uaa.user_id
    WHERE ss.status = 'expired'
      AND ss.current_period_end < v_now
      AND uaa.access_type = 'subscription'
      AND uaa.is_active = true
  );

  WITH failed_payments AS (
    SELECT
      ss.id as subscription_id,
      ss.user_id,
      ss.platform_subscription_id,
      ss.updated_at as failure_date,
      uaa.app_slug,
      uaa.id as access_id,
      (ss.updated_at + (v_grace_period_days || ' days')::interval) as grace_end
    FROM subscription_status ss
    JOIN user_app_access uaa ON uaa.user_id = ss.user_id
    WHERE ss.status = 'payment_failed'
      AND uaa.access_type = 'subscription'
      AND uaa.is_active = true
  ),
  past_grace AS (
    SELECT * FROM failed_payments WHERE grace_end < v_now
  ),
  in_grace AS (
    SELECT * FROM failed_payments WHERE grace_end >= v_now
  )
  INSERT INTO access_revocation_log (user_id, app_slug, reason, subscription_id, grace_period_end, revoked_at)
  SELECT user_id, app_slug, 'payment_failed', subscription_id, grace_end, v_now
  FROM past_grace
  RETURNING 1 INTO v_revoked_count;

  SELECT COUNT(*) INTO v_grace_period_count
  FROM (
    SELECT ss.id
    FROM subscription_status ss
    JOIN user_app_access uaa ON uaa.user_id = ss.user_id
    WHERE ss.status = 'payment_failed'
      AND (ss.updated_at + (v_grace_period_days || ' days')::interval) >= v_now
      AND uaa.access_type = 'subscription'
      AND uaa.is_active = true
  ) sub;

  UPDATE user_app_access
  SET is_active = false, updated_at = v_now
  WHERE id IN (
    SELECT uaa.id
    FROM user_app_access uaa
    JOIN subscription_status ss ON ss.user_id = uaa.user_id
    WHERE ss.status = 'payment_failed'
      AND (ss.updated_at + (v_grace_period_days || ' days')::interval) < v_now
      AND uaa.access_type = 'subscription'
      AND uaa.is_active = true
  );

  WITH cancelled_subs AS (
    SELECT
      ss.id as subscription_id,
      ss.user_id,
      uaa.app_slug,
      uaa.id as access_id
    FROM subscription_status ss
    JOIN user_app_access uaa ON uaa.user_id = ss.user_id
    WHERE ss.status = 'cancelled'
      AND (ss.cancel_at_period_end = false OR ss.current_period_end < v_now)
      AND uaa.access_type = 'subscription'
      AND uaa.is_active = true
  )
  INSERT INTO access_revocation_log (user_id, app_slug, reason, subscription_id, revoked_at)
  SELECT user_id, app_slug, 'cancelled', subscription_id, v_now
  FROM cancelled_subs
  RETURNING 1 INTO v_revoked_count;

  UPDATE user_app_access
  SET is_active = false, updated_at = v_now
  WHERE id IN (
    SELECT uaa.id
    FROM user_app_access uaa
    JOIN subscription_status ss ON ss.user_id = uaa.user_id
    WHERE ss.status = 'cancelled'
      AND (ss.cancel_at_period_end = false OR ss.current_period_end < v_now)
      AND uaa.access_type = 'subscription'
      AND uaa.is_active = true
  );

  SELECT jsonb_build_object(
    'revoked_count', v_revoked_count,
    'grace_period_count', v_grace_period_count,
    'checked_at', v_now,
    'grace_period_days', v_grace_period_days
  ) INTO v_details;

  RETURN QUERY SELECT v_revoked_count, v_grace_period_count, v_details;
END;
$$;

-- ============================================================
-- apps_with_features view — remove SECURITY DEFINER
-- ============================================================
DROP VIEW IF EXISTS public.apps_with_features;

CREATE VIEW public.apps_with_features
WITH (security_invoker = true)
AS
SELECT
  a.id,
  a.slug,
  a.name,
  a.description,
  a.category,
  a.item_type,
  a.parent_app_id,
  a.is_suite,
  a.feature_count,
  a.included_feature_ids,
  a.popular,
  a.new,
  a.price,
  a.is_active,
  a.is_featured,
  COALESCE(
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', f.id,
          'slug', f.slug,
          'name', f.name,
          'description', f.description,
          'icon', f.icon,
          'image', f.image,
          'sort_order', afl.sort_order
        ) ORDER BY afl.sort_order
      )
      FROM app_feature_links afl
      JOIN apps f ON f.id = afl.feature_id
      WHERE afl.app_id = a.id
    ),
    '[]'::jsonb
  ) AS features
FROM apps a
WHERE a.item_type = ANY (ARRAY['app'::app_item_type, 'standalone'::app_item_type]);
