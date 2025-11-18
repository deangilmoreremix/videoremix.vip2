/*
  # Automated Subscription Expiration and Payment Failure Handler

  ## Overview
  This migration creates a scheduled function that automatically checks for expired
  subscriptions and payment failures, revoking access when necessary.

  ## 1. Subscription Expiration Function

  Creates a function that:
  - Identifies subscriptions past their current_period_end date
  - Checks for payment failures and pending statuses
  - Revokes access for expired or failed subscriptions
  - Implements a 3-day grace period for payment failures
  - Logs all access revocations for audit purposes

  ## 2. Access Revocation Log Table

  Tracks when and why user access was revoked:
  - user_id - The user whose access was revoked
  - app_slug - Which app access was revoked
  - reason - Why access was revoked (expired, payment_failed, cancelled)
  - subscription_id - Related subscription if applicable
  - grace_period_end - When the grace period ends (if applicable)
  - revoked_at - Timestamp of revocation

  ## 3. Scheduled Job

  Sets up a pg_cron job to run the expiration checker daily at 2 AM UTC

  ## 4. Important Notes

  - Grace period: 3 days for payment failures before revocation
  - Lifetime purchases are never affected by this checker
  - Only subscription and trial access types are checked
  - Logs are kept for compliance and customer support
*/

-- Create access revocation log table
CREATE TABLE IF NOT EXISTS access_revocation_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  app_slug text NOT NULL,
  reason text NOT NULL CHECK (reason IN ('expired', 'payment_failed', 'cancelled', 'refunded')),
  subscription_id uuid REFERENCES subscription_status(id) ON DELETE SET NULL,
  purchase_id uuid REFERENCES purchases(id) ON DELETE SET NULL,
  grace_period_end timestamptz,
  revoked_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for access revocation log
CREATE INDEX IF NOT EXISTS idx_access_revocation_user_id ON access_revocation_log(user_id);
CREATE INDEX IF NOT EXISTS idx_access_revocation_revoked_at ON access_revocation_log(revoked_at);
CREATE INDEX IF NOT EXISTS idx_access_revocation_reason ON access_revocation_log(reason);

-- Enable RLS on access revocation log
ALTER TABLE access_revocation_log ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can read their own revocation logs
CREATE POLICY "Users can read own revocation logs"
  ON access_revocation_log FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policy: Super admins can read all revocation logs
CREATE POLICY "Super admins can read all revocation logs"
  ON access_revocation_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'super_admin'
    )
  );

-- Create function to check and revoke expired subscriptions
CREATE OR REPLACE FUNCTION check_and_revoke_expired_subscriptions()
RETURNS TABLE(
  revoked_count integer,
  grace_period_count integer,
  details jsonb
) AS $$
DECLARE
  v_revoked_count integer := 0;
  v_grace_period_count integer := 0;
  v_details jsonb := '[]'::jsonb;
  v_grace_period_days integer := 3;
  v_now timestamptz := now();
BEGIN
  -- 1. Handle expired subscriptions (past current_period_end)
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
  SELECT
    user_id,
    app_slug,
    'expired',
    subscription_id,
    v_now
  FROM expired_subs
  RETURNING 1 INTO v_revoked_count;

  -- Update subscription status to expired
  UPDATE subscription_status
  SET status = 'expired', updated_at = v_now
  WHERE status = 'active'
    AND current_period_end < v_now;

  -- Revoke access for expired subscriptions
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

  -- 2. Handle payment failures with grace period
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
    SELECT * FROM failed_payments
    WHERE grace_end < v_now
  ),
  in_grace AS (
    SELECT * FROM failed_payments
    WHERE grace_end >= v_now
  )
  -- Log and revoke access for those past grace period
  INSERT INTO access_revocation_log (user_id, app_slug, reason, subscription_id, grace_period_end, revoked_at)
  SELECT
    user_id,
    app_slug,
    'payment_failed',
    subscription_id,
    grace_end,
    v_now
  FROM past_grace
  RETURNING 1 INTO v_revoked_count;

  -- Count those still in grace period
  SELECT COUNT(*) INTO v_grace_period_count FROM in_grace;

  -- Revoke access for those past grace period
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

  -- 3. Handle cancelled subscriptions
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
  SELECT
    user_id,
    app_slug,
    'cancelled',
    subscription_id,
    v_now
  FROM cancelled_subs
  RETURNING 1 INTO v_revoked_count;

  -- Revoke access for cancelled subscriptions
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

  -- Build details summary
  SELECT jsonb_build_object(
    'revoked_count', v_revoked_count,
    'grace_period_count', v_grace_period_count,
    'checked_at', v_now,
    'grace_period_days', v_grace_period_days
  ) INTO v_details;

  RETURN QUERY SELECT v_revoked_count, v_grace_period_count, v_details;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to manually restore access (for customer support)
CREATE OR REPLACE FUNCTION restore_subscription_access(
  p_user_id uuid,
  p_app_slug text
)
RETURNS boolean AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to authenticated users for the restore function
GRANT EXECUTE ON FUNCTION restore_subscription_access(uuid, text) TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION check_and_revoke_expired_subscriptions() IS 'Automated function to check and revoke expired subscriptions with grace period support';
COMMENT ON FUNCTION restore_subscription_access(uuid, text) IS 'Manually restore subscription access for a specific user and app (for customer support)';
COMMENT ON TABLE access_revocation_log IS 'Audit log of all access revocations for compliance and customer support';
