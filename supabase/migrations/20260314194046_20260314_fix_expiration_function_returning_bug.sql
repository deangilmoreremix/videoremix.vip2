
/*
  # Fix check_and_revoke_expired_subscriptions RETURNING bug

  ## Summary
  The original function used `RETURNING 1 INTO v_revoked_count` after each
  INSERT...SELECT statement. In PL/pgSQL, `INTO` on a RETURNING clause captures
  only a single row — if more than one subscription is processed, Postgres raises
  "query returned more than one row" and the function aborts.

  This fix replaces all three instances with `GET DIAGNOSTICS` to correctly
  accumulate the count, and also fixes the grace-period count subquery to
  evaluate before any subsequent UPDATE (matching the original CTE intent).

  Also fixes: search_path is retained from previous migration.
*/

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
  v_rows integer := 0;
BEGIN
  -- Block 1: expired subscriptions
  WITH expired_subs AS (
    SELECT
      ss.id AS subscription_id,
      ss.user_id,
      uaa.app_slug,
      uaa.id AS access_id,
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
  FROM expired_subs;

  GET DIAGNOSTICS v_rows = ROW_COUNT;
  v_revoked_count := v_revoked_count + v_rows;

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

  -- Block 2: payment_failed subscriptions (with grace period)
  WITH failed_payments AS (
    SELECT
      ss.id AS subscription_id,
      ss.user_id,
      ss.updated_at AS failure_date,
      uaa.app_slug,
      uaa.id AS access_id,
      (ss.updated_at + (v_grace_period_days || ' days')::interval) AS grace_end
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
  FROM past_grace;

  GET DIAGNOSTICS v_rows = ROW_COUNT;
  v_revoked_count := v_revoked_count + v_rows;

  -- Count users still within grace period (before UPDATE touches is_active)
  SELECT COUNT(*) INTO v_grace_period_count
  FROM subscription_status ss
  JOIN user_app_access uaa ON uaa.user_id = ss.user_id
  WHERE ss.status = 'payment_failed'
    AND (ss.updated_at + (v_grace_period_days || ' days')::interval) >= v_now
    AND uaa.access_type = 'subscription'
    AND uaa.is_active = true;

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

  -- Block 3: cancelled subscriptions
  WITH cancelled_subs AS (
    SELECT
      ss.id AS subscription_id,
      ss.user_id,
      uaa.app_slug,
      uaa.id AS access_id
    FROM subscription_status ss
    JOIN user_app_access uaa ON uaa.user_id = ss.user_id
    WHERE ss.status = 'cancelled'
      AND (ss.cancel_at_period_end = false OR ss.current_period_end < v_now)
      AND uaa.access_type = 'subscription'
      AND uaa.is_active = true
  )
  INSERT INTO access_revocation_log (user_id, app_slug, reason, subscription_id, revoked_at)
  SELECT user_id, app_slug, 'cancelled', subscription_id, v_now
  FROM cancelled_subs;

  GET DIAGNOSTICS v_rows = ROW_COUNT;
  v_revoked_count := v_revoked_count + v_rows;

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
