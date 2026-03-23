


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'Security and performance optimization applied: Added missing FK indexes, optimized RLS policies, secured functions, removed unused indexes';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."app_item_type" AS ENUM (
    'app',
    'feature',
    'standalone'
);


ALTER TYPE "public"."app_item_type" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."audit_user_roles_changes"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  admin_user_id uuid;
  operation_details jsonb;
BEGIN
  -- Get the current user (admin performing the action)
  admin_user_id := auth.uid();

  -- Build operation details
  operation_details := jsonb_build_object(
    'table', 'user_roles',
    'timestamp', extract(epoch from now())
  );

  IF TG_OP = 'INSERT' THEN
    PERFORM log_user_management_operation(
      'CREATE',
      NEW.user_id,
      NEW.user_id,
      admin_user_id,
      operation_details,
      NULL,
      row_to_json(NEW),
      NULL, -- IP address would be set by application layer
      NULL, -- User agent would be set by application layer
      NULL  -- Session ID would be set by application layer
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM log_user_management_operation(
      'UPDATE',
      NEW.user_id,
      NEW.user_id,
      admin_user_id,
      operation_details,
      row_to_json(OLD),
      row_to_json(NEW),
      NULL,
      NULL,
      NULL
    );
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM log_user_management_operation(
      'DELETE',
      OLD.user_id,
      OLD.user_id,
      admin_user_id,
      operation_details,
      row_to_json(OLD),
      NULL,
      NULL,
      NULL,
      NULL
    );
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."audit_user_roles_changes"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."audit_user_roles_changes"() IS 'Trigger function for auditing user_roles table changes';



CREATE OR REPLACE FUNCTION "public"."award_achievement"("p_user_id" "uuid", "p_achievement_type" "text", "p_metadata" "jsonb" DEFAULT '{}'::"jsonb") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  achievement_id uuid;
BEGIN
  INSERT INTO user_achievements (user_id, achievement_type, metadata)
  VALUES (p_user_id, p_achievement_type, p_metadata)
  ON CONFLICT (user_id, achievement_type) DO NOTHING
  RETURNING id INTO achievement_id;

  RETURN achievement_id;
END;
$$;


ALTER FUNCTION "public"."award_achievement"("p_user_id" "uuid", "p_achievement_type" "text", "p_metadata" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_and_revoke_expired_subscriptions"() RETURNS TABLE("revoked_count" integer, "grace_period_count" integer, "details" "jsonb")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."check_and_revoke_expired_subscriptions"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."check_and_revoke_expired_subscriptions"() IS 'Automated function to check and revoke expired subscriptions with grace period support';



CREATE OR REPLACE FUNCTION "public"."generate_daily_snapshot"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE v_date date := CURRENT_DATE - interval '1 day'; BEGIN INSERT INTO daily_analytics_snapshots (snapshot_date, total_users, active_users, new_signups, total_revenue, new_purchases, active_subscriptions)
SELECT v_date, (SELECT COUNT(*) FROM auth.users), (SELECT COUNT(DISTINCT user_id) FROM user_feature_interactions WHERE created_at::date = v_date),
(SELECT COUNT(*) FROM auth.users WHERE created_at::date = v_date), (SELECT COALESCE(SUM(amount), 0) FROM revenue_analytics WHERE date = v_date),
(SELECT COUNT(*) FROM purchases WHERE created_at::date = v_date), (SELECT COUNT(*) FROM subscription_status WHERE status = 'active')
ON CONFLICT (snapshot_date) DO UPDATE SET total_users = EXCLUDED.total_users, active_users = EXCLUDED.active_users, new_signups = EXCLUDED.new_signups,
total_revenue = EXCLUDED.total_revenue, new_purchases = EXCLUDED.new_purchases, active_subscriptions = EXCLUDED.active_subscriptions; END; $$;


ALTER FUNCTION "public"."generate_daily_snapshot"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_daily_snapshot"("p_date" "date" DEFAULT CURRENT_DATE) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_total_users integer;
  v_active_users integer;
  v_new_users integer;
  v_total_apps integer;
  v_active_apps integer;
  v_total_purchases integer;
  v_revenue numeric;
  v_active_subs integer;
  v_cancelled_subs integer;
  v_access_grants integer;
  v_feature_events integer;
BEGIN
  -- Count total users
  SELECT COUNT(*) INTO v_total_users FROM user_roles;
  
  -- Count active users (logged in within last 30 days)
  SELECT COUNT(DISTINCT user_id) INTO v_active_users
  FROM admin_analytics_events
  WHERE event_type = 'user_login'
  AND created_at >= p_date - INTERVAL '30 days'
  AND created_at < p_date + INTERVAL '1 day';
  
  -- Count new users for the day
  SELECT COUNT(*) INTO v_new_users
  FROM user_roles
  WHERE DATE(created_at) = p_date;
  
  -- Count apps
  SELECT COUNT(*), COUNT(*) FILTER (WHERE is_active) INTO v_total_apps, v_active_apps
  FROM apps;
  
  -- Count purchases for the day
  SELECT COUNT(*), COALESCE(SUM(amount), 0) INTO v_total_purchases, v_revenue
  FROM purchases
  WHERE DATE(purchase_date) = p_date
  AND status = 'completed';
  
  -- Count active and cancelled subscriptions
  SELECT 
    COUNT(*) FILTER (WHERE status = 'active'),
    COUNT(*) FILTER (WHERE status = 'cancelled' AND DATE(cancelled_at) = p_date)
  INTO v_active_subs, v_cancelled_subs
  FROM subscription_status;
  
  -- Count app access grants for the day
  SELECT COUNT(*) INTO v_access_grants
  FROM user_app_access
  WHERE DATE(granted_at) = p_date;
  
  -- Count feature usage events for the day
  SELECT COUNT(*) INTO v_feature_events
  FROM admin_analytics_events
  WHERE event_type IN ('feature_enabled', 'feature_disabled')
  AND DATE(created_at) = p_date;
  
  -- Insert or update snapshot
  INSERT INTO daily_analytics_snapshots (
    snapshot_date, total_users, active_users, new_users,
    total_apps, active_apps, total_purchases, revenue_usd,
    active_subscriptions, cancelled_subscriptions,
    app_access_grants, feature_usage_events, updated_at
  ) VALUES (
    p_date, v_total_users, v_active_users, v_new_users,
    v_total_apps, v_active_apps, v_total_purchases, v_revenue,
    v_active_subs, v_cancelled_subs, v_access_grants, v_feature_events, now()
  )
  ON CONFLICT (snapshot_date)
  DO UPDATE SET
    total_users = EXCLUDED.total_users,
    active_users = EXCLUDED.active_users,
    new_users = EXCLUDED.new_users,
    total_apps = EXCLUDED.total_apps,
    active_apps = EXCLUDED.active_apps,
    total_purchases = EXCLUDED.total_purchases,
    revenue_usd = EXCLUDED.revenue_usd,
    active_subscriptions = EXCLUDED.active_subscriptions,
    cancelled_subscriptions = EXCLUDED.cancelled_subscriptions,
    app_access_grants = EXCLUDED.app_access_grants,
    feature_usage_events = EXCLUDED.feature_usage_events,
    updated_at = now();
END;
$$;


ALTER FUNCTION "public"."generate_daily_snapshot"("p_date" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_app_slug"() RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN 'smartcrm';
END;
$$;


ALTER FUNCTION "public"."get_app_slug"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_feature_popularity"("p_feature_id" "uuid") RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE v_score integer; BEGIN SELECT COALESCE(view_count, 0) * 1 + COALESCE(interaction_count, 0) * 5 + COALESCE(total_ratings, 0) * 10
INTO v_score FROM feature_analytics WHERE feature_id = p_feature_id; RETURN COALESCE(v_score, 0); END; $$;


ALTER FUNCTION "public"."get_feature_popularity"("p_feature_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_recommended_features"("p_user_id" "uuid", "p_limit" integer DEFAULT 5) RETURNS TABLE("feature_id" "uuid", "feature_name" "text", "app_name" "text", "popularity_score" integer)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN RETURN QUERY SELECT af.id, af.title, a.name, get_feature_popularity(af.id) as score FROM app_features af JOIN apps a ON a.id = af.app_id
LEFT JOIN user_feature_interactions ufi ON ufi.feature_id = af.id AND ufi.user_id = p_user_id WHERE ufi.id IS NULL ORDER BY score DESC LIMIT p_limit; END; $$;


ALTER FUNCTION "public"."get_recommended_features"("p_user_id" "uuid", "p_limit" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_tenant_id"() RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN (auth.jwt()->>'tenant_id')::uuid;
EXCEPTION WHEN OTHERS THEN
    RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."get_tenant_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_progress_percentage"("p_user_id" "uuid") RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  total_steps integer := 5;
  completed_steps integer := 0;
BEGIN
  -- Check profile completion (has email in auth.users)
  IF EXISTS (SELECT 1 FROM auth.users WHERE id = p_user_id AND email IS NOT NULL) THEN
    completed_steps := completed_steps + 1;
  END IF;

  -- Check first purchase
  IF EXISTS (SELECT 1 FROM user_app_access WHERE user_id = p_user_id LIMIT 1) THEN
    completed_steps := completed_steps + 1;
  END IF;

  -- Check achievements earned
  IF EXISTS (SELECT 1 FROM user_achievements WHERE user_id = p_user_id LIMIT 1) THEN
    completed_steps := completed_steps + 1;
  END IF;

  -- Check dashboard preferences set
  IF EXISTS (SELECT 1 FROM user_dashboard_preferences WHERE user_id = p_user_id) THEN
    completed_steps := completed_steps + 1;
  END IF;

  -- Check if user has accessed at least one app
  IF EXISTS (
    SELECT 1 FROM user_app_access
    WHERE user_id = p_user_id
    AND (expires_at IS NULL OR expires_at > now())
    LIMIT 1
  ) THEN
    completed_steps := completed_steps + 1;
  END IF;

  RETURN (completed_steps * 100 / total_steps);
END;
$$;


ALTER FUNCTION "public"."get_user_progress_percentage"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  -- Only create user_roles entry, not admin_profiles
  INSERT INTO user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't prevent user creation
    RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_super_admin"() RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('super_admin', 'admin')
  );
END;
$$;


ALTER FUNCTION "public"."is_super_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_super_admin"("check_user_id" "uuid" DEFAULT NULL::"uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
  target_user_id uuid;
BEGIN
  target_user_id := COALESCE(check_user_id, auth.uid());
  
  RETURN EXISTS (
    SELECT 1
    FROM user_roles
    WHERE user_id = target_user_id
    AND role = 'super_admin'
  );
END;
$$;


ALTER FUNCTION "public"."is_super_admin"("check_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_thumbnail_public"("thumb_path" "text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
  video_record RECORD;
BEGIN
  SELECT is_public, status INTO video_record
  FROM videos
  WHERE thumbnail_path = thumb_path;
  
  RETURN COALESCE(video_record.is_public, false) 
    AND COALESCE(video_record.status, '') = 'completed';
END;
$$;


ALTER FUNCTION "public"."is_thumbnail_public"("thumb_path" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_video_file_public"("file_path" "text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
  video_record RECORD;
BEGIN
  SELECT is_public, status INTO video_record
  FROM videos
  WHERE videos.file_path = is_video_file_public.file_path;
  
  RETURN COALESCE(video_record.is_public, false) 
    AND COALESCE(video_record.status, '') = 'completed';
END;
$$;


ALTER FUNCTION "public"."is_video_file_public"("file_path" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_admin_user_operation"("p_operation" "text", "p_target_user_id" "uuid", "p_operation_details" "jsonb", "p_success" boolean DEFAULT true, "p_error_message" "text" DEFAULT NULL::"text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  admin_user_id uuid;
BEGIN
  admin_user_id := auth.uid();

  PERFORM log_user_management_operation(
    p_operation,
    admin_user_id,
    p_target_user_id,
    admin_user_id,
    p_operation_details,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    p_success,
    p_error_message
  );
END;
$$;


ALTER FUNCTION "public"."log_admin_user_operation"("p_operation" "text", "p_target_user_id" "uuid", "p_operation_details" "jsonb", "p_success" boolean, "p_error_message" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."log_admin_user_operation"("p_operation" "text", "p_target_user_id" "uuid", "p_operation_details" "jsonb", "p_success" boolean, "p_error_message" "text") IS 'Helper function for logging admin operations on users';



CREATE OR REPLACE FUNCTION "public"."log_analytics_event"("p_admin_id" "uuid", "p_event_type" "text", "p_entity_type" "text", "p_entity_id" "uuid", "p_metadata" "jsonb" DEFAULT NULL::"jsonb") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN INSERT INTO admin_analytics_events (admin_id, event_type, entity_type, entity_id, metadata)
VALUES (p_admin_id, p_event_type, p_entity_type, p_entity_id, p_metadata); END; $$;


ALTER FUNCTION "public"."log_analytics_event"("p_admin_id" "uuid", "p_event_type" "text", "p_entity_type" "text", "p_entity_id" "uuid", "p_metadata" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_analytics_event"("p_event_type" "text", "p_user_id" "uuid" DEFAULT NULL::"uuid", "p_admin_id" "uuid" DEFAULT NULL::"uuid", "p_entity_type" "text" DEFAULT NULL::"text", "p_entity_id" "uuid" DEFAULT NULL::"uuid", "p_metadata" "jsonb" DEFAULT '{}'::"jsonb") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_event_id uuid;
BEGIN
  INSERT INTO admin_analytics_events (
    event_type, user_id, admin_id, entity_type, entity_id, metadata
  ) VALUES (
    p_event_type, p_user_id, p_admin_id, p_entity_type, p_entity_id, p_metadata
  ) RETURNING id INTO v_event_id;
  
  RETURN v_event_id;
END;
$$;


ALTER FUNCTION "public"."log_analytics_event"("p_event_type" "text", "p_user_id" "uuid", "p_admin_id" "uuid", "p_entity_type" "text", "p_entity_id" "uuid", "p_metadata" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_app_access_event"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN IF NEW.has_access = true AND (OLD.has_access IS NULL OR OLD.has_access = false) THEN INSERT INTO admin_analytics_events (event_type, entity_type, entity_id, metadata)
VALUES ('app_access_granted', 'user_app_access', NEW.id, jsonb_build_object('user_id', NEW.user_id, 'app_id', NEW.app_id)); END IF; RETURN NEW; END; $$;


ALTER FUNCTION "public"."log_app_access_event"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_purchase_event"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN INSERT INTO admin_analytics_events (event_type, entity_type, entity_id, metadata)
VALUES ('purchase_created', 'purchase', NEW.id, jsonb_build_object('user_id', NEW.user_id, 'product_id', NEW.product_id, 'amount', NEW.amount)); RETURN NEW; END; $$;


ALTER FUNCTION "public"."log_purchase_event"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_user_management_operation"("p_operation" "text", "p_user_id" "uuid" DEFAULT NULL::"uuid", "p_target_user_id" "uuid" DEFAULT NULL::"uuid", "p_admin_user_id" "uuid" DEFAULT NULL::"uuid", "p_operation_details" "jsonb" DEFAULT NULL::"jsonb", "p_old_values" "jsonb" DEFAULT NULL::"jsonb", "p_new_values" "jsonb" DEFAULT NULL::"jsonb", "p_ip_address" "inet" DEFAULT NULL::"inet", "p_user_agent" "text" DEFAULT NULL::"text", "p_session_id" "text" DEFAULT NULL::"text", "p_success" boolean DEFAULT true, "p_error_message" "text" DEFAULT NULL::"text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO user_management_audit (
    operation,
    user_id,
    target_user_id,
    admin_user_id,
    operation_details,
    old_values,
    new_values,
    ip_address,
    user_agent,
    session_id,
    success,
    error_message
  ) VALUES (
    p_operation,
    p_user_id,
    p_target_user_id,
    p_admin_user_id,
    p_operation_details,
    p_old_values,
    p_new_values,
    p_ip_address,
    p_user_agent,
    p_session_id,
    p_success,
    p_error_message
  );
END;
$$;


ALTER FUNCTION "public"."log_user_management_operation"("p_operation" "text", "p_user_id" "uuid", "p_target_user_id" "uuid", "p_admin_user_id" "uuid", "p_operation_details" "jsonb", "p_old_values" "jsonb", "p_new_values" "jsonb", "p_ip_address" "inet", "p_user_agent" "text", "p_session_id" "text", "p_success" boolean, "p_error_message" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."log_user_management_operation"("p_operation" "text", "p_user_id" "uuid", "p_target_user_id" "uuid", "p_admin_user_id" "uuid", "p_operation_details" "jsonb", "p_old_values" "jsonb", "p_new_values" "jsonb", "p_ip_address" "inet", "p_user_agent" "text", "p_session_id" "text", "p_success" boolean, "p_error_message" "text") IS 'Logs user management operations with full context';



CREATE OR REPLACE FUNCTION "public"."log_user_signup"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN INSERT INTO admin_analytics_events (event_type, entity_type, entity_id, metadata)
VALUES ('user_signup', 'user', NEW.id, jsonb_build_object('email', NEW.email)); RETURN NEW; END; $$;


ALTER FUNCTION "public"."log_user_signup"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."restore_subscription_access"("p_user_id" "uuid", "p_app_slug" "text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
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


ALTER FUNCTION "public"."restore_subscription_access"("p_user_id" "uuid", "p_app_slug" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."restore_subscription_access"("p_user_id" "uuid", "p_app_slug" "text") IS 'Manually restore subscription access for a specific user and app (for customer support)';



CREATE OR REPLACE FUNCTION "public"."update_app_feature_count"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN IF TG_OP = 'DELETE' THEN UPDATE apps SET feature_count = (SELECT COUNT(*) FROM app_features WHERE app_id = OLD.app_id) WHERE id = OLD.app_id; RETURN OLD;
ELSE UPDATE apps SET feature_count = (SELECT COUNT(*) FROM app_features WHERE app_id = NEW.app_id) WHERE id = NEW.app_id; RETURN NEW; END IF; END; $$;


ALTER FUNCTION "public"."update_app_feature_count"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_app_included_features"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN IF TG_OP = 'DELETE' THEN UPDATE apps SET included_feature_ids = (SELECT jsonb_agg(id ORDER BY sort_order) FROM app_features WHERE app_id = OLD.app_id) WHERE id = OLD.app_id; RETURN OLD;
ELSE UPDATE apps SET included_feature_ids = (SELECT jsonb_agg(id ORDER BY sort_order) FROM app_features WHERE app_id = NEW.app_id) WHERE id = NEW.app_id; RETURN NEW; END IF; END; $$;


ALTER FUNCTION "public"."update_app_included_features"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_apps_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_apps_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_feature_analytics"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN INSERT INTO feature_analytics (feature_id, view_count, interaction_count, avg_rating, total_ratings)
VALUES (NEW.feature_id, 0, 0, 0, 0) ON CONFLICT (feature_id) DO NOTHING; RETURN NEW; END; $$;


ALTER FUNCTION "public"."update_feature_analytics"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_user_dashboard_preferences_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_user_dashboard_preferences_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."user_has_feature_access"("p_user_id" "uuid", "p_feature_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE v_has_access boolean; BEGIN SELECT EXISTS (SELECT 1 FROM app_features af JOIN user_app_access uaa ON uaa.app_id = af.app_id
WHERE af.id = p_feature_id AND uaa.user_id = p_user_id AND uaa.has_access = true) INTO v_has_access; RETURN v_has_access; END; $$;


ALTER FUNCTION "public"."user_has_feature_access"("p_user_id" "uuid", "p_feature_id" "uuid") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."access_revocation_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "app_slug" "text" NOT NULL,
    "reason" "text" NOT NULL,
    "subscription_id" "uuid",
    "purchase_id" "uuid",
    "grace_period_end" timestamp with time zone,
    "revoked_at" timestamp with time zone DEFAULT "now"(),
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "access_revocation_log_reason_check" CHECK (("reason" = ANY (ARRAY['expired'::"text", 'payment_failed'::"text", 'cancelled'::"text", 'refunded'::"text"])))
);


ALTER TABLE "public"."access_revocation_log" OWNER TO "postgres";


COMMENT ON TABLE "public"."access_revocation_log" IS 'Audit log of all access revocations for compliance and customer support';



CREATE TABLE IF NOT EXISTS "public"."access_tiers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tier_name" "text" NOT NULL,
    "tier_level" integer NOT NULL,
    "display_name" "text" NOT NULL,
    "description" "text" DEFAULT ''::"text",
    "features_included" "jsonb" DEFAULT '[]'::"jsonb",
    "usage_limits" "jsonb" DEFAULT '{}'::"jsonb",
    "badge_color" "text" DEFAULT '#3B82F6'::"text",
    "icon_name" "text" DEFAULT 'star'::"text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "tenant_id" "uuid" NOT NULL
);


ALTER TABLE "public"."access_tiers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."admin_analytics_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_type" "text" NOT NULL,
    "user_id" "uuid",
    "admin_id" "uuid",
    "entity_type" "text",
    "entity_id" "uuid",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "ip_address" "text",
    "user_agent" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "admin_analytics_events_event_type_check" CHECK (("event_type" = ANY (ARRAY['user_signup'::"text", 'user_login'::"text", 'user_logout'::"text", 'purchase_completed'::"text", 'purchase_refunded'::"text", 'app_access_granted'::"text", 'app_access_revoked'::"text", 'subscription_started'::"text", 'subscription_cancelled'::"text", 'subscription_renewed'::"text", 'admin_action'::"text", 'import_completed'::"text", 'video_uploaded'::"text", 'feature_enabled'::"text", 'feature_disabled'::"text"])))
);


ALTER TABLE "public"."admin_analytics_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."admin_profiles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "full_name" "text" DEFAULT ''::"text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "tenant_id" "uuid" NOT NULL
);


ALTER TABLE "public"."admin_profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."agent_configurations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "app_slug" character varying(50) DEFAULT 'smartcrm'::character varying,
    "tenant_id" "uuid" NOT NULL,
    "agent_id" "uuid",
    "config_key" character varying(100) NOT NULL,
    "config_value" "jsonb" NOT NULL,
    "is_encrypted" boolean DEFAULT false,
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."agent_configurations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."agent_executions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "app_slug" character varying(50) DEFAULT 'smartcrm'::character varying,
    "tenant_id" "uuid" NOT NULL,
    "agent_id" "uuid",
    "user_id" "uuid",
    "status" character varying(50) DEFAULT 'pending'::character varying,
    "input_data" "jsonb" DEFAULT '{}'::"jsonb",
    "output_data" "jsonb" DEFAULT '{}'::"jsonb",
    "error_message" "text",
    "started_at" timestamp without time zone,
    "completed_at" timestamp without time zone,
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"(),
    CONSTRAINT "agent_executions_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['pending'::character varying, 'running'::character varying, 'completed'::character varying, 'failed'::character varying, 'cancelled'::character varying])::"text"[])))
);


ALTER TABLE "public"."agent_executions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."agent_schedules" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "app_slug" character varying(50) DEFAULT 'smartcrm'::character varying,
    "tenant_id" "uuid" NOT NULL,
    "agent_id" "uuid",
    "schedule_type" character varying(50) NOT NULL,
    "cron_expression" character varying(100),
    "scheduled_for" timestamp without time zone NOT NULL,
    "is_active" boolean DEFAULT true,
    "last_run_at" timestamp without time zone,
    "next_run_at" timestamp without time zone,
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"(),
    CONSTRAINT "agent_schedules_schedule_type_check" CHECK ((("schedule_type")::"text" = ANY ((ARRAY['once'::character varying, 'recurring'::character varying, 'cron'::character varying])::"text"[])))
);


ALTER TABLE "public"."agent_schedules" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."app_feature_links" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "app_id" "uuid" NOT NULL,
    "feature_id" "uuid" NOT NULL,
    "sort_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."app_feature_links" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."app_features" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "app_id" "uuid",
    "name" character varying(255) NOT NULL,
    "title" character varying(255),
    "description" "text",
    "icon" character varying(100),
    "category" character varying(100),
    "tags" "jsonb" DEFAULT '[]'::"jsonb",
    "sort_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."app_features" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."app_tenants" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "app_slug" character varying(50) DEFAULT 'smartcrm'::character varying NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "tenant_name" character varying(255) NOT NULL,
    "status" character varying(50) DEFAULT 'active'::character varying,
    "settings" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"(),
    CONSTRAINT "app_tenants_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['active'::character varying, 'suspended'::character varying, 'inactive'::character varying])::"text"[])))
);


ALTER TABLE "public"."app_tenants" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."app_usage_analytics" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "app_slug" "text" NOT NULL,
    "date" "date" NOT NULL,
    "total_views" integer DEFAULT 0,
    "unique_users" integer DEFAULT 0,
    "avg_session_duration" interval,
    "bounce_rate" numeric DEFAULT 0,
    "feature_interactions" integer DEFAULT 0,
    "error_count" integer DEFAULT 0,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."app_usage_analytics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."apps" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "description" "text" DEFAULT ''::"text",
    "category" "text" NOT NULL,
    "icon_url" "text",
    "netlify_url" "text",
    "custom_domain" "text",
    "is_active" boolean DEFAULT true,
    "is_featured" boolean DEFAULT false,
    "sort_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "image" "text",
    "icon" "text",
    "popular" boolean DEFAULT false,
    "new" boolean DEFAULT false,
    "coming_soon" boolean DEFAULT false,
    "price" numeric DEFAULT 97,
    "tags" "jsonb" DEFAULT '[]'::"jsonb",
    "long_description" "text",
    "demo_image" "text",
    "benefits" "jsonb" DEFAULT '[]'::"jsonb",
    "features" "jsonb" DEFAULT '[]'::"jsonb",
    "steps" "jsonb" DEFAULT '[]'::"jsonb",
    "use_cases" "jsonb" DEFAULT '[]'::"jsonb",
    "testimonials" "jsonb" DEFAULT '[]'::"jsonb",
    "faqs" "jsonb" DEFAULT '[]'::"jsonb",
    "item_type" "public"."app_item_type" DEFAULT 'standalone'::"public"."app_item_type",
    "parent_app_id" "uuid",
    "feature_count" integer DEFAULT 0,
    "included_feature_ids" "jsonb" DEFAULT '[]'::"jsonb",
    "is_suite" boolean DEFAULT false,
    "is_public" boolean DEFAULT false,
    "tenant_id" "uuid" NOT NULL
);


ALTER TABLE "public"."apps" OWNER TO "postgres";


COMMENT ON COLUMN "public"."apps"."is_public" IS 'Whether this app is visible to non-logged-in users for discovery purposes';



CREATE OR REPLACE VIEW "public"."apps_with_features" AS
SELECT
    NULL::"uuid" AS "id",
    NULL::"text" AS "slug",
    NULL::"text" AS "name",
    NULL::"text" AS "description",
    NULL::"text" AS "icon",
    NULL::boolean AS "is_active",
    NULL::"text" AS "netlify_url",
    NULL::"text" AS "custom_domain",
    NULL::integer AS "feature_count",
    NULL::timestamp with time zone AS "created_at",
    NULL::timestamp with time zone AS "updated_at",
    NULL::json AS "features";


ALTER VIEW "public"."apps_with_features" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."audit_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "table_name" "text" NOT NULL,
    "record_id" "uuid" NOT NULL,
    "action" "text" NOT NULL,
    "user_id" "uuid",
    "old_data" "jsonb",
    "new_data" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "tenant_id" "uuid"
);


ALTER TABLE "public"."audit_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."benefits_features" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text" DEFAULT ''::"text",
    "icon" "text" DEFAULT ''::"text",
    "is_active" boolean DEFAULT true,
    "sort_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "tenant_id" "uuid"
);


ALTER TABLE "public"."benefits_features" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."calendar_availability" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "app_slug" character varying(50) DEFAULT 'smartcrm'::character varying,
    "tenant_id" "uuid" NOT NULL,
    "user_id" "uuid",
    "day_of_week" integer NOT NULL,
    "start_time" time without time zone NOT NULL,
    "end_time" time without time zone NOT NULL,
    "is_available" boolean DEFAULT true,
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"(),
    CONSTRAINT "calendar_availability_day_of_week_check" CHECK ((("day_of_week" >= 0) AND ("day_of_week" <= 6)))
);


ALTER TABLE "public"."calendar_availability" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."calendar_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "app_slug" character varying(50) DEFAULT 'smartcrm'::character varying,
    "tenant_id" "uuid" NOT NULL,
    "user_id" "uuid",
    "title" character varying(255) NOT NULL,
    "description" "text",
    "event_type" character varying(100) NOT NULL,
    "start_time" timestamp without time zone NOT NULL,
    "end_time" timestamp without time zone NOT NULL,
    "all_day" boolean DEFAULT false,
    "timezone" character varying(100) DEFAULT 'UTC'::character varying,
    "location" character varying(500),
    "meeting_url" "text",
    "attendees" "jsonb" DEFAULT '[]'::"jsonb",
    "reminders" "jsonb" DEFAULT '[]'::"jsonb",
    "recurrence_rule" "text",
    "status" character varying(50) DEFAULT 'confirmed'::character varying,
    "is_recurring" boolean DEFAULT false,
    "parent_event_id" "uuid",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"(),
    CONSTRAINT "calendar_events_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['confirmed'::character varying, 'tentative'::character varying, 'cancelled'::character varying])::"text"[])))
);


ALTER TABLE "public"."calendar_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."calendar_integrations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "app_slug" character varying(50) DEFAULT 'smartcrm'::character varying,
    "tenant_id" "uuid" NOT NULL,
    "user_id" "uuid",
    "provider" character varying(50) NOT NULL,
    "access_token" "text",
    "refresh_token" "text",
    "token_expires_at" timestamp without time zone,
    "calendar_id" "text",
    "is_active" boolean DEFAULT true,
    "sync_enabled" boolean DEFAULT true,
    "last_sync_at" timestamp without time zone,
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"(),
    CONSTRAINT "calendar_integrations_provider_check" CHECK ((("provider")::"text" = ANY ((ARRAY['google'::character varying, 'outlook'::character varying, 'caldav'::character varying, 'apple'::character varying])::"text"[])))
);


ALTER TABLE "public"."calendar_integrations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."csv_imports" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "import_name" "text" NOT NULL,
    "filename" "text" NOT NULL,
    "file_size" bigint DEFAULT 0,
    "import_source" "text" DEFAULT 'manual'::"text",
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "total_rows" integer DEFAULT 0,
    "processed_rows" integer DEFAULT 0,
    "successful_rows" integer DEFAULT 0,
    "failed_rows" integer DEFAULT 0,
    "unique_products_found" integer DEFAULT 0,
    "new_products_added" integer DEFAULT 0,
    "new_users_created" integer DEFAULT 0,
    "existing_users_updated" integer DEFAULT 0,
    "csv_headers" "jsonb" DEFAULT '[]'::"jsonb",
    "column_mappings" "jsonb" DEFAULT '{}'::"jsonb",
    "error_log" "jsonb" DEFAULT '[]'::"jsonb",
    "import_summary" "jsonb" DEFAULT '{}'::"jsonb",
    "imported_by" "uuid",
    "started_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "csv_imports_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'processing'::"text", 'completed'::"text", 'failed'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."csv_imports" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."daily_analytics_snapshots" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "snapshot_date" "date" NOT NULL,
    "total_users" integer DEFAULT 0,
    "active_users" integer DEFAULT 0,
    "new_users" integer DEFAULT 0,
    "total_apps" integer DEFAULT 0,
    "active_apps" integer DEFAULT 0,
    "total_purchases" integer DEFAULT 0,
    "revenue_usd" numeric DEFAULT 0,
    "active_subscriptions" integer DEFAULT 0,
    "cancelled_subscriptions" integer DEFAULT 0,
    "app_access_grants" integer DEFAULT 0,
    "feature_usage_events" integer DEFAULT 0,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."daily_analytics_snapshots" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."faqs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "question" "text" NOT NULL,
    "answer" "text" NOT NULL,
    "category" "text" DEFAULT ''::"text",
    "is_active" boolean DEFAULT true,
    "sort_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "tenant_id" "uuid"
);


ALTER TABLE "public"."faqs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."feature_analytics" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "feature_id" "uuid",
    "event_type" character varying(100) NOT NULL,
    "user_id" "uuid",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."feature_analytics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."feature_benefits" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "feature_id" "uuid",
    "title" character varying(255) NOT NULL,
    "description" "text",
    "icon_name" character varying(100),
    "sort_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."feature_benefits" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."feature_faqs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "feature_id" "uuid",
    "question" character varying(500) NOT NULL,
    "answer" "text",
    "sort_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."feature_faqs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."feature_ratings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "feature_id" "uuid",
    "user_id" "uuid",
    "rating" integer,
    "review" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "feature_ratings_rating_check" CHECK ((("rating" >= 1) AND ("rating" <= 5)))
);


ALTER TABLE "public"."feature_ratings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."feature_relationships" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "feature_id" "uuid" NOT NULL,
    "related_feature_id" "uuid" NOT NULL,
    "relationship_type" character varying(50) DEFAULT 'related'::character varying,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."feature_relationships" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."feature_steps" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "feature_id" "uuid",
    "step_number" integer NOT NULL,
    "title" character varying(255) NOT NULL,
    "description" "text",
    "image_url" character varying(500),
    "sort_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."feature_steps" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."feature_use_cases" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "feature_id" "uuid",
    "title" character varying(255) NOT NULL,
    "description" "text",
    "sort_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."feature_use_cases" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."hero_content" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "subtitle" "text" DEFAULT ''::"text",
    "description" "text" DEFAULT ''::"text",
    "cta_text" "text" DEFAULT ''::"text",
    "cta_link" "text" DEFAULT ''::"text",
    "background_image_url" "text" DEFAULT ''::"text",
    "is_active" boolean DEFAULT true,
    "sort_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "tenant_id" "uuid"
);


ALTER TABLE "public"."hero_content" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."import_products" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "product_name" "text" NOT NULL,
    "normalized_name" "text" NOT NULL,
    "campaign_name" "text",
    "first_seen_in_import_id" "uuid",
    "total_occurrences" integer DEFAULT 1,
    "unique_user_count" integer DEFAULT 0,
    "is_mapped" boolean DEFAULT false,
    "mapping_status" "text" DEFAULT 'unmapped'::"text",
    "product_type" "text" DEFAULT 'unknown'::"text",
    "inferred_billing_cycle" "text",
    "similar_products" "jsonb" DEFAULT '[]'::"jsonb",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "import_products_inferred_billing_cycle_check" CHECK (("inferred_billing_cycle" = ANY (ARRAY['monthly'::"text", 'yearly'::"text", 'lifetime'::"text", 'one_time'::"text", NULL::"text"]))),
    CONSTRAINT "import_products_mapping_status_check" CHECK (("mapping_status" = ANY (ARRAY['unmapped'::"text", 'pending_review'::"text", 'mapped'::"text", 'ignored'::"text"]))),
    CONSTRAINT "import_products_product_type_check" CHECK (("product_type" = ANY (ARRAY['subscription'::"text", 'one_time'::"text", 'bundle'::"text", 'upgrade'::"text", 'unknown'::"text"])))
);


ALTER TABLE "public"."import_products" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."import_records" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "import_type" "text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text",
    "total_records" integer DEFAULT 0,
    "processed_records" integer DEFAULT 0,
    "failed_records" integer DEFAULT 0,
    "error_details" "jsonb" DEFAULT '[]'::"jsonb",
    "file_url" "text" DEFAULT ''::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "completed_at" timestamp with time zone,
    "tenant_id" "uuid"
);


ALTER TABLE "public"."import_records" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."import_user_records" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "csv_import_id" "uuid" NOT NULL,
    "customer_name" "text",
    "customer_email" "text" NOT NULL,
    "campaign" "text",
    "product_name" "text" NOT NULL,
    "user_id" "uuid",
    "import_product_id" "uuid",
    "processing_status" "text" DEFAULT 'pending'::"text",
    "error_message" "text",
    "row_number" integer,
    "raw_data" "jsonb" DEFAULT '{}'::"jsonb",
    "processed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "import_user_records_processing_status_check" CHECK (("processing_status" = ANY (ARRAY['pending'::"text", 'processed'::"text", 'failed'::"text", 'skipped'::"text"])))
);


ALTER TABLE "public"."import_user_records" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."pipeline_stages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "app_slug" character varying(50) DEFAULT 'smartcrm'::character varying,
    "tenant_id" "uuid" NOT NULL,
    "pipeline_id" "uuid",
    "name" character varying(100) NOT NULL,
    "position" integer DEFAULT 0 NOT NULL,
    "color" character varying(20),
    "probability" integer DEFAULT 50,
    "is_won" boolean DEFAULT false,
    "is_lost" boolean DEFAULT false,
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."pipeline_stages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."pipelines" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "app_slug" character varying(50) DEFAULT 'smartcrm'::character varying,
    "tenant_id" "uuid" NOT NULL,
    "name" character varying(100) NOT NULL,
    "description" "text",
    "is_default" boolean DEFAULT false,
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."pipelines" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."platform_product_mappings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "product_id" "uuid",
    "platform" "text" NOT NULL,
    "platform_product_id" "text" NOT NULL,
    "platform_product_name" "text" NOT NULL,
    "match_confidence" numeric DEFAULT 1.0,
    "manually_verified" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "platform_product_mappings_match_confidence_check" CHECK ((("match_confidence" >= (0)::numeric) AND ("match_confidence" <= (1)::numeric))),
    CONSTRAINT "platform_product_mappings_platform_check" CHECK (("platform" = ANY (ARRAY['paykickstart'::"text", 'stripe'::"text", 'zaxxa'::"text"])))
);


ALTER TABLE "public"."platform_product_mappings" OWNER TO "postgres";


COMMENT ON TABLE "public"."platform_product_mappings" IS 'Maps payment platform product IDs to internal product catalog';



CREATE TABLE IF NOT EXISTS "public"."pricing_plans" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text" DEFAULT ''::"text",
    "price_monthly" numeric DEFAULT 0,
    "price_yearly" numeric DEFAULT 0,
    "features" "jsonb" DEFAULT '[]'::"jsonb",
    "ispopular" boolean DEFAULT false,
    "is_active" boolean DEFAULT true,
    "sort_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "tenant_id" "uuid"
);


ALTER TABLE "public"."pricing_plans" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."product_app_mappings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "import_product_id" "uuid" NOT NULL,
    "app_id" "uuid" NOT NULL,
    "access_tier_id" "uuid" NOT NULL,
    "mapping_confidence" numeric DEFAULT 1.0,
    "is_verified" boolean DEFAULT false,
    "verified_by" "uuid",
    "verified_at" timestamp with time zone,
    "is_active" boolean DEFAULT true,
    "auto_grant_access" boolean DEFAULT true,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "product_app_mappings_mapping_confidence_check" CHECK ((("mapping_confidence" >= (0)::numeric) AND ("mapping_confidence" <= (1)::numeric)))
);


ALTER TABLE "public"."product_app_mappings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."products_catalog" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "sku" "text",
    "description" "text" DEFAULT ''::"text",
    "product_type" "text" DEFAULT 'one_time'::"text" NOT NULL,
    "apps_granted" "jsonb" DEFAULT '[]'::"jsonb",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "products_catalog_product_type_check" CHECK (("product_type" = ANY (ARRAY['subscription'::"text", 'one_time'::"text"])))
);


ALTER TABLE "public"."products_catalog" OWNER TO "postgres";


COMMENT ON TABLE "public"."products_catalog" IS 'Catalog of all products available for purchase, mapping to app access grants';



COMMENT ON COLUMN "public"."products_catalog"."apps_granted" IS 'JSONB array of app slug identifiers that this product grants access to';



CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "full_name" "text" DEFAULT ''::"text",
    "avatar_url" "text" DEFAULT ''::"text",
    "bio" "text" DEFAULT ''::"text",
    "company" "text" DEFAULT ''::"text",
    "website" "text" DEFAULT ''::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "tenant_id" "uuid" NOT NULL
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."purchases" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "email" "text" NOT NULL,
    "platform" "text" NOT NULL,
    "platform_transaction_id" "text" NOT NULL,
    "platform_customer_id" "text",
    "product_id" "uuid",
    "product_name" "text" NOT NULL,
    "product_sku" "text",
    "amount" numeric DEFAULT 0 NOT NULL,
    "currency" "text" DEFAULT 'USD'::"text",
    "status" "text" DEFAULT 'completed'::"text" NOT NULL,
    "subscription_id" "text",
    "is_subscription" boolean DEFAULT false,
    "purchase_date" timestamp with time zone DEFAULT "now"(),
    "webhook_data" "jsonb" DEFAULT '{}'::"jsonb",
    "processed" boolean DEFAULT false,
    "processed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "stripe_payment_intent_id" "text",
    "stripe_invoice_id" "text",
    "stripe_customer_id" "text",
    "synced_from_stripe" boolean DEFAULT false,
    "tenant_id" "uuid" NOT NULL,
    CONSTRAINT "purchases_platform_check" CHECK (("platform" = ANY (ARRAY['paykickstart'::"text", 'stripe'::"text", 'zaxxa'::"text"]))),
    CONSTRAINT "purchases_status_check" CHECK (("status" = ANY (ARRAY['completed'::"text", 'pending'::"text", 'refunded'::"text", 'failed'::"text"])))
);


ALTER TABLE "public"."purchases" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."revenue_analytics" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "date" "date" NOT NULL,
    "platform" "text" NOT NULL,
    "product_id" "uuid",
    "product_name" "text" NOT NULL,
    "transaction_count" integer DEFAULT 0,
    "total_revenue" numeric DEFAULT 0,
    "refund_count" integer DEFAULT 0,
    "refund_amount" numeric DEFAULT 0,
    "net_revenue" numeric DEFAULT 0,
    "avg_transaction_value" numeric DEFAULT 0,
    "new_customers" integer DEFAULT 0,
    "returning_customers" integer DEFAULT 0,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "revenue_analytics_platform_check" CHECK (("platform" = ANY (ARRAY['paykickstart'::"text", 'stripe'::"text", 'zaxxa'::"text", 'manual'::"text"])))
);


ALTER TABLE "public"."revenue_analytics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."stripe_entitlements" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "stripe_customer_id" "text" NOT NULL,
    "feature_id" "text" NOT NULL,
    "lookup_key" "text",
    "entitlement_id" "text" NOT NULL,
    "is_active" boolean DEFAULT true,
    "last_synced_at" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."stripe_entitlements" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."subscription_status" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "purchase_id" "uuid" NOT NULL,
    "platform" "text" NOT NULL,
    "platform_subscription_id" "text" NOT NULL,
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "current_period_start" timestamp with time zone NOT NULL,
    "current_period_end" timestamp with time zone NOT NULL,
    "cancel_at_period_end" boolean DEFAULT false,
    "cancelled_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "subscription_status_platform_check" CHECK (("platform" = ANY (ARRAY['paykickstart'::"text", 'stripe'::"text", 'zaxxa'::"text"]))),
    CONSTRAINT "subscription_status_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'cancelled'::"text", 'expired'::"text", 'payment_failed'::"text"])))
);


ALTER TABLE "public"."subscription_status" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."subscriptions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "stripe_subscription_id" "text" DEFAULT ''::"text",
    "status" "text" DEFAULT 'active'::"text",
    "plan_id" "text" DEFAULT ''::"text",
    "plan_name" "text" DEFAULT ''::"text",
    "current_period_start" timestamp with time zone DEFAULT "now"(),
    "current_period_end" timestamp with time zone DEFAULT "now"(),
    "cancel_at_period_end" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "tenant_id" "uuid" NOT NULL
);


ALTER TABLE "public"."subscriptions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sync_jobs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "job_type" "text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "total_records" integer DEFAULT 0,
    "processed_records" integer DEFAULT 0,
    "successful_records" integer DEFAULT 0,
    "failed_records" integer DEFAULT 0,
    "error_log" "jsonb" DEFAULT '[]'::"jsonb",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "started_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "started_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "sync_jobs_job_type_check" CHECK (("job_type" = ANY (ARRAY['stripe_customers'::"text", 'stripe_entitlements'::"text", 'paykickstart_customers'::"text", 'zaxxa_customers'::"text", 'manual_import'::"text"]))),
    CONSTRAINT "sync_jobs_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'running'::"text", 'completed'::"text", 'failed'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."sync_jobs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tenants" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "domain" "text" DEFAULT ''::"text",
    "is_active" boolean DEFAULT true,
    "settings" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."tenants" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."testimonials" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "role" "text" DEFAULT ''::"text",
    "company" "text" DEFAULT ''::"text",
    "content" "text" NOT NULL,
    "avatar_url" "text" DEFAULT ''::"text",
    "rating" integer DEFAULT 5,
    "is_active" boolean DEFAULT true,
    "sort_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "tenant_id" "uuid"
);


ALTER TABLE "public"."testimonials" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_achievements" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "achievement_type" "text" NOT NULL,
    "earned_at" timestamp with time zone DEFAULT "now"(),
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_achievements" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_app_access" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "app_slug" "text" NOT NULL,
    "purchase_id" "uuid",
    "access_type" "text" DEFAULT 'lifetime'::"text" NOT NULL,
    "granted_at" timestamp with time zone DEFAULT "now"(),
    "expires_at" timestamp with time zone,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "tenant_id" "uuid" NOT NULL,
    CONSTRAINT "user_app_access_access_type_check" CHECK (("access_type" = ANY (ARRAY['subscription'::"text", 'lifetime'::"text", 'trial'::"text"])))
);


ALTER TABLE "public"."user_app_access" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_dashboard_preferences" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "theme" "text" DEFAULT 'dark'::"text",
    "layout_density" "text" DEFAULT 'comfortable'::"text",
    "widget_order" "jsonb" DEFAULT '[]'::"jsonb",
    "hidden_widgets" "jsonb" DEFAULT '[]'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "user_dashboard_preferences_layout_density_check" CHECK (("layout_density" = ANY (ARRAY['compact'::"text", 'comfortable'::"text"]))),
    CONSTRAINT "user_dashboard_preferences_theme_check" CHECK (("theme" = ANY (ARRAY['dark'::"text", 'light'::"text"])))
);


ALTER TABLE "public"."user_dashboard_preferences" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_feature_interactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "feature_id" "uuid",
    "interaction_type" character varying(50) NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_feature_interactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_management_audit" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "operation" "text" NOT NULL,
    "user_id" "uuid",
    "target_user_id" "uuid",
    "admin_user_id" "uuid",
    "operation_details" "jsonb",
    "old_values" "jsonb",
    "new_values" "jsonb",
    "ip_address" "inet",
    "user_agent" "text",
    "session_id" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "success" boolean DEFAULT true,
    "error_message" "text",
    CONSTRAINT "user_management_audit_operation_check" CHECK (("operation" = ANY (ARRAY['CREATE'::"text", 'UPDATE'::"text", 'DELETE'::"text", 'LOGIN'::"text", 'LOGOUT'::"text", 'PASSWORD_RESET'::"text", 'EMAIL_CHANGE'::"text", 'STATUS_CHANGE'::"text", 'BULK_OPERATION'::"text"])))
);


ALTER TABLE "public"."user_management_audit" OWNER TO "postgres";


COMMENT ON TABLE "public"."user_management_audit" IS 'Audit log for all user management operations including admin actions';



CREATE TABLE IF NOT EXISTS "public"."user_roles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "text" DEFAULT 'user'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "tenant_id" "uuid" NOT NULL,
    CONSTRAINT "user_roles_role_check" CHECK (("role" = ANY (ARRAY['super_admin'::"text", 'admin'::"text", 'user'::"text"])))
);


ALTER TABLE "public"."user_roles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."videos" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "title" "text",
    "description" "text",
    "original_filename" "text" NOT NULL,
    "file_path" "text" NOT NULL,
    "thumbnail_path" "text",
    "status" "text" DEFAULT 'uploaded'::"text" NOT NULL,
    "duration" numeric,
    "file_size" bigint,
    "mime_type" "text",
    "processing_started_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "error_message" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "display_on_homepage" boolean DEFAULT false NOT NULL,
    "is_featured" boolean DEFAULT false NOT NULL,
    "is_public" boolean DEFAULT false NOT NULL,
    "homepage_order" integer,
    "tenant_id" "uuid" NOT NULL,
    CONSTRAINT "videos_status_check" CHECK (("status" = ANY (ARRAY['uploaded'::"text", 'processing'::"text", 'completed'::"text", 'failed'::"text"])))
);


ALTER TABLE "public"."videos" OWNER TO "postgres";


COMMENT ON COLUMN "public"."videos"."display_on_homepage" IS 'When true, video appears on the homepage. Only admins can set this flag.';



COMMENT ON COLUMN "public"."videos"."is_featured" IS 'When true, video is highlighted on homepage. Only admins can set this flag.';



COMMENT ON COLUMN "public"."videos"."is_public" IS 'When true, video is publicly accessible to all visitors. Only admins can set this flag.';



COMMENT ON COLUMN "public"."videos"."homepage_order" IS 'Controls display order on homepage. Lower numbers appear first. Only admins can set this.';



CREATE TABLE IF NOT EXISTS "public"."webhook_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "platform" "text" NOT NULL,
    "event_type" "text" NOT NULL,
    "webhook_payload" "jsonb" NOT NULL,
    "processing_status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "error_message" "text",
    "retry_count" integer DEFAULT 0,
    "processed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "webhook_logs_platform_check" CHECK (("platform" = ANY (ARRAY['paykickstart'::"text", 'stripe'::"text", 'zaxxa'::"text"]))),
    CONSTRAINT "webhook_logs_processing_status_check" CHECK (("processing_status" = ANY (ARRAY['pending'::"text", 'processed'::"text", 'failed'::"text", 'retry'::"text"])))
);


ALTER TABLE "public"."webhook_logs" OWNER TO "postgres";


ALTER TABLE ONLY "public"."access_revocation_log"
    ADD CONSTRAINT "access_revocation_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."access_tiers"
    ADD CONSTRAINT "access_tiers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."access_tiers"
    ADD CONSTRAINT "access_tiers_tier_level_key" UNIQUE ("tier_level");



ALTER TABLE ONLY "public"."access_tiers"
    ADD CONSTRAINT "access_tiers_tier_name_key" UNIQUE ("tier_name");



ALTER TABLE ONLY "public"."admin_analytics_events"
    ADD CONSTRAINT "admin_analytics_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."admin_profiles"
    ADD CONSTRAINT "admin_profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."admin_profiles"
    ADD CONSTRAINT "admin_profiles_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."agent_configurations"
    ADD CONSTRAINT "agent_configurations_agent_id_config_key_key" UNIQUE ("agent_id", "config_key");



ALTER TABLE ONLY "public"."agent_configurations"
    ADD CONSTRAINT "agent_configurations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."agent_executions"
    ADD CONSTRAINT "agent_executions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."agent_schedules"
    ADD CONSTRAINT "agent_schedules_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."app_feature_links"
    ADD CONSTRAINT "app_feature_links_app_id_feature_id_key" UNIQUE ("app_id", "feature_id");



ALTER TABLE ONLY "public"."app_feature_links"
    ADD CONSTRAINT "app_feature_links_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."app_features"
    ADD CONSTRAINT "app_features_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."app_tenants"
    ADD CONSTRAINT "app_tenants_app_slug_tenant_id_key" UNIQUE ("app_slug", "tenant_id");



ALTER TABLE ONLY "public"."app_tenants"
    ADD CONSTRAINT "app_tenants_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."app_usage_analytics"
    ADD CONSTRAINT "app_usage_analytics_app_slug_date_key" UNIQUE ("app_slug", "date");



ALTER TABLE ONLY "public"."app_usage_analytics"
    ADD CONSTRAINT "app_usage_analytics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."apps"
    ADD CONSTRAINT "apps_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."apps"
    ADD CONSTRAINT "apps_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."audit_log"
    ADD CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."benefits_features"
    ADD CONSTRAINT "benefits_features_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."calendar_availability"
    ADD CONSTRAINT "calendar_availability_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."calendar_events"
    ADD CONSTRAINT "calendar_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."calendar_integrations"
    ADD CONSTRAINT "calendar_integrations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."csv_imports"
    ADD CONSTRAINT "csv_imports_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."daily_analytics_snapshots"
    ADD CONSTRAINT "daily_analytics_snapshots_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."daily_analytics_snapshots"
    ADD CONSTRAINT "daily_analytics_snapshots_snapshot_date_key" UNIQUE ("snapshot_date");



ALTER TABLE ONLY "public"."faqs"
    ADD CONSTRAINT "faqs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."feature_analytics"
    ADD CONSTRAINT "feature_analytics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."feature_benefits"
    ADD CONSTRAINT "feature_benefits_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."feature_faqs"
    ADD CONSTRAINT "feature_faqs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."feature_ratings"
    ADD CONSTRAINT "feature_ratings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."feature_relationships"
    ADD CONSTRAINT "feature_relationships_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."feature_steps"
    ADD CONSTRAINT "feature_steps_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."feature_use_cases"
    ADD CONSTRAINT "feature_use_cases_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."hero_content"
    ADD CONSTRAINT "hero_content_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."import_products"
    ADD CONSTRAINT "import_products_normalized_name_key" UNIQUE ("normalized_name");



ALTER TABLE ONLY "public"."import_products"
    ADD CONSTRAINT "import_products_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."import_records"
    ADD CONSTRAINT "import_records_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."import_user_records"
    ADD CONSTRAINT "import_user_records_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pipeline_stages"
    ADD CONSTRAINT "pipeline_stages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pipelines"
    ADD CONSTRAINT "pipelines_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."platform_product_mappings"
    ADD CONSTRAINT "platform_product_mappings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."platform_product_mappings"
    ADD CONSTRAINT "platform_product_mappings_platform_platform_product_id_key" UNIQUE ("platform", "platform_product_id");



ALTER TABLE ONLY "public"."pricing_plans"
    ADD CONSTRAINT "pricing_plans_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."product_app_mappings"
    ADD CONSTRAINT "product_app_mappings_import_product_id_app_id_key" UNIQUE ("import_product_id", "app_id");



ALTER TABLE ONLY "public"."product_app_mappings"
    ADD CONSTRAINT "product_app_mappings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."products_catalog"
    ADD CONSTRAINT "products_catalog_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."products_catalog"
    ADD CONSTRAINT "products_catalog_sku_key" UNIQUE ("sku");



ALTER TABLE ONLY "public"."products_catalog"
    ADD CONSTRAINT "products_catalog_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."purchases"
    ADD CONSTRAINT "purchases_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."purchases"
    ADD CONSTRAINT "purchases_platform_platform_transaction_id_key" UNIQUE ("platform", "platform_transaction_id");



ALTER TABLE ONLY "public"."revenue_analytics"
    ADD CONSTRAINT "revenue_analytics_date_platform_product_id_key" UNIQUE ("date", "platform", "product_id");



ALTER TABLE ONLY "public"."revenue_analytics"
    ADD CONSTRAINT "revenue_analytics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."stripe_entitlements"
    ADD CONSTRAINT "stripe_entitlements_entitlement_id_key" UNIQUE ("entitlement_id");



ALTER TABLE ONLY "public"."stripe_entitlements"
    ADD CONSTRAINT "stripe_entitlements_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subscription_status"
    ADD CONSTRAINT "subscription_status_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subscription_status"
    ADD CONSTRAINT "subscription_status_platform_subscription_id_key" UNIQUE ("platform_subscription_id");



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sync_jobs"
    ADD CONSTRAINT "sync_jobs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tenants"
    ADD CONSTRAINT "tenants_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tenants"
    ADD CONSTRAINT "tenants_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."testimonials"
    ADD CONSTRAINT "testimonials_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_achievements"
    ADD CONSTRAINT "user_achievements_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_achievements"
    ADD CONSTRAINT "user_achievements_user_id_achievement_type_key" UNIQUE ("user_id", "achievement_type");



ALTER TABLE ONLY "public"."user_app_access"
    ADD CONSTRAINT "user_app_access_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_app_access"
    ADD CONSTRAINT "user_app_access_user_id_app_slug_key" UNIQUE ("user_id", "app_slug");



ALTER TABLE ONLY "public"."user_dashboard_preferences"
    ADD CONSTRAINT "user_dashboard_preferences_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_dashboard_preferences"
    ADD CONSTRAINT "user_dashboard_preferences_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."user_feature_interactions"
    ADD CONSTRAINT "user_feature_interactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_feature_interactions"
    ADD CONSTRAINT "user_feature_interactions_user_id_feature_id_interaction_ty_key" UNIQUE ("user_id", "feature_id", "interaction_type");



ALTER TABLE ONLY "public"."user_management_audit"
    ADD CONSTRAINT "user_management_audit_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."videos"
    ADD CONSTRAINT "videos_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."webhook_logs"
    ADD CONSTRAINT "webhook_logs_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_access_revocation_reason" ON "public"."access_revocation_log" USING "btree" ("reason");



CREATE INDEX "idx_access_revocation_revoked_at" ON "public"."access_revocation_log" USING "btree" ("revoked_at");



CREATE INDEX "idx_access_revocation_user_id" ON "public"."access_revocation_log" USING "btree" ("user_id");



CREATE INDEX "idx_access_tiers_tenant" ON "public"."access_tiers" USING "btree" ("tenant_id");



CREATE INDEX "idx_admin_analytics_events_admin_id" ON "public"."admin_analytics_events" USING "btree" ("admin_id");



CREATE INDEX "idx_admin_profiles_tenant" ON "public"."admin_profiles" USING "btree" ("tenant_id");



CREATE INDEX "idx_agent_executions_app_tenant" ON "public"."agent_executions" USING "btree" ("app_slug", "tenant_id");



CREATE INDEX "idx_agent_executions_status" ON "public"."agent_executions" USING "btree" ("status");



CREATE INDEX "idx_agent_schedules_app_tenant" ON "public"."agent_schedules" USING "btree" ("app_slug", "tenant_id");



CREATE INDEX "idx_agents_app_tenant" ON "public"."agent_configurations" USING "btree" ("app_slug", "tenant_id");



CREATE INDEX "idx_analytics_events_event_type" ON "public"."admin_analytics_events" USING "btree" ("event_type");



CREATE INDEX "idx_app_feature_links_app" ON "public"."app_feature_links" USING "btree" ("app_id");



CREATE INDEX "idx_app_feature_links_feature" ON "public"."app_feature_links" USING "btree" ("feature_id");



CREATE INDEX "idx_app_feature_links_sort" ON "public"."app_feature_links" USING "btree" ("app_id", "sort_order");



CREATE INDEX "idx_app_tenants_app" ON "public"."app_tenants" USING "btree" ("app_slug");



CREATE INDEX "idx_app_tenants_tenant" ON "public"."app_tenants" USING "btree" ("tenant_id");



CREATE INDEX "idx_apps_is_public" ON "public"."apps" USING "btree" ("is_public") WHERE ("is_public" = true);



CREATE INDEX "idx_apps_is_suite" ON "public"."apps" USING "btree" ("is_suite") WHERE ("is_suite" = true);



CREATE INDEX "idx_apps_item_type" ON "public"."apps" USING "btree" ("item_type");



CREATE INDEX "idx_apps_parent_app_id" ON "public"."apps" USING "btree" ("parent_app_id") WHERE ("parent_app_id" IS NOT NULL);



CREATE INDEX "idx_apps_tenant" ON "public"."apps" USING "btree" ("tenant_id");



CREATE INDEX "idx_audit_log_created_at" ON "public"."audit_log" USING "btree" ("created_at");



CREATE INDEX "idx_audit_log_table_name" ON "public"."audit_log" USING "btree" ("table_name");



CREATE INDEX "idx_audit_log_tenant" ON "public"."audit_log" USING "btree" ("tenant_id");



CREATE INDEX "idx_benefits_features_tenant" ON "public"."benefits_features" USING "btree" ("tenant_id");



CREATE INDEX "idx_calendar_availability_app_tenant" ON "public"."calendar_availability" USING "btree" ("app_slug", "tenant_id");



CREATE INDEX "idx_calendar_events_app_tenant" ON "public"."calendar_events" USING "btree" ("app_slug", "tenant_id");



CREATE INDEX "idx_calendar_events_user" ON "public"."calendar_events" USING "btree" ("user_id", "start_time");



CREATE INDEX "idx_calendar_integrations_app_tenant" ON "public"."calendar_integrations" USING "btree" ("app_slug", "tenant_id");



CREATE INDEX "idx_faqs_tenant" ON "public"."faqs" USING "btree" ("tenant_id");



CREATE INDEX "idx_hero_content_tenant" ON "public"."hero_content" USING "btree" ("tenant_id");



CREATE INDEX "idx_import_records_tenant" ON "public"."import_records" USING "btree" ("tenant_id");



CREATE INDEX "idx_pipeline_stages_app_tenant" ON "public"."pipeline_stages" USING "btree" ("app_slug", "tenant_id");



CREATE INDEX "idx_pipeline_stages_pipeline" ON "public"."pipeline_stages" USING "btree" ("pipeline_id");



CREATE INDEX "idx_pipelines_app_tenant" ON "public"."pipelines" USING "btree" ("app_slug", "tenant_id");



CREATE INDEX "idx_platform_mappings_platform" ON "public"."platform_product_mappings" USING "btree" ("platform");



CREATE INDEX "idx_pricing_plans_tenant" ON "public"."pricing_plans" USING "btree" ("tenant_id");



CREATE INDEX "idx_products_catalog_sku" ON "public"."products_catalog" USING "btree" ("sku");



CREATE INDEX "idx_products_catalog_slug" ON "public"."products_catalog" USING "btree" ("slug");



CREATE INDEX "idx_products_catalog_type" ON "public"."products_catalog" USING "btree" ("product_type");



CREATE INDEX "idx_profiles_tenant" ON "public"."profiles" USING "btree" ("tenant_id");



CREATE INDEX "idx_profiles_user_id" ON "public"."profiles" USING "btree" ("user_id");



CREATE INDEX "idx_purchases_tenant" ON "public"."purchases" USING "btree" ("tenant_id");



CREATE INDEX "idx_purchases_user_id" ON "public"."purchases" USING "btree" ("user_id");



CREATE INDEX "idx_subscriptions_tenant" ON "public"."subscriptions" USING "btree" ("tenant_id");



CREATE INDEX "idx_testimonials_tenant" ON "public"."testimonials" USING "btree" ("tenant_id");



CREATE INDEX "idx_user_achievements_type" ON "public"."user_achievements" USING "btree" ("achievement_type");



CREATE INDEX "idx_user_achievements_user_id" ON "public"."user_achievements" USING "btree" ("user_id");



CREATE INDEX "idx_user_app_access_tenant" ON "public"."user_app_access" USING "btree" ("tenant_id");



CREATE INDEX "idx_user_dashboard_preferences_user_id" ON "public"."user_dashboard_preferences" USING "btree" ("user_id");



CREATE INDEX "idx_user_management_audit_admin_user_id" ON "public"."user_management_audit" USING "btree" ("admin_user_id");



CREATE INDEX "idx_user_management_audit_created_at" ON "public"."user_management_audit" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_user_management_audit_operation" ON "public"."user_management_audit" USING "btree" ("operation");



CREATE INDEX "idx_user_management_audit_target_user_id" ON "public"."user_management_audit" USING "btree" ("target_user_id");



CREATE INDEX "idx_user_management_audit_user_id" ON "public"."user_management_audit" USING "btree" ("user_id");



CREATE INDEX "idx_user_roles_tenant" ON "public"."user_roles" USING "btree" ("tenant_id");



CREATE INDEX "idx_videos_tenant" ON "public"."videos" USING "btree" ("tenant_id");



CREATE OR REPLACE VIEW "public"."apps_with_features" AS
 SELECT "a"."id",
    "a"."slug",
    "a"."name",
    "a"."description",
    "a"."icon",
    "a"."is_active",
    "a"."netlify_url",
    "a"."custom_domain",
    "a"."feature_count",
    "a"."created_at",
    "a"."updated_at",
    COALESCE("json_agg"("json_build_object"('id', "af"."id", 'title', "af"."title", 'description', "af"."description", 'icon', "af"."icon", 'category', "af"."category") ORDER BY "af"."sort_order") FILTER (WHERE ("af"."id" IS NOT NULL)), '[]'::json) AS "features"
   FROM ("public"."apps" "a"
     LEFT JOIN "public"."app_features" "af" ON (("af"."app_id" = "a"."id")))
  GROUP BY "a"."id";



CREATE OR REPLACE TRIGGER "audit_user_roles_trigger" AFTER INSERT OR DELETE OR UPDATE ON "public"."user_roles" FOR EACH ROW EXECUTE FUNCTION "public"."audit_user_roles_changes"();



CREATE OR REPLACE TRIGGER "update_admin_profiles_updated_at" BEFORE UPDATE ON "public"."admin_profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_app_feature_count_trigger" AFTER INSERT OR DELETE OR UPDATE ON "public"."app_features" FOR EACH ROW EXECUTE FUNCTION "public"."update_app_feature_count"();



CREATE OR REPLACE TRIGGER "update_app_included_features_trigger" AFTER INSERT OR DELETE OR UPDATE ON "public"."app_features" FOR EACH ROW EXECUTE FUNCTION "public"."update_app_included_features"();



CREATE OR REPLACE TRIGGER "update_apps_updated_at" BEFORE UPDATE ON "public"."apps" FOR EACH ROW EXECUTE FUNCTION "public"."update_apps_updated_at"();



CREATE OR REPLACE TRIGGER "update_platform_product_mappings_updated_at" BEFORE UPDATE ON "public"."platform_product_mappings" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_products_catalog_updated_at" BEFORE UPDATE ON "public"."products_catalog" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_purchases_updated_at" BEFORE UPDATE ON "public"."purchases" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_stripe_entitlements_updated_at" BEFORE UPDATE ON "public"."stripe_entitlements" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_subscription_status_updated_at" BEFORE UPDATE ON "public"."subscription_status" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_sync_jobs_updated_at" BEFORE UPDATE ON "public"."sync_jobs" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_user_app_access_updated_at" BEFORE UPDATE ON "public"."user_app_access" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_user_dashboard_preferences_updated_at_trigger" BEFORE UPDATE ON "public"."user_dashboard_preferences" FOR EACH ROW EXECUTE FUNCTION "public"."update_user_dashboard_preferences_updated_at"();



CREATE OR REPLACE TRIGGER "update_user_roles_updated_at" BEFORE UPDATE ON "public"."user_roles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_videos_updated_at" BEFORE UPDATE ON "public"."videos" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."access_revocation_log"
    ADD CONSTRAINT "access_revocation_log_purchase_id_fkey" FOREIGN KEY ("purchase_id") REFERENCES "public"."purchases"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."access_revocation_log"
    ADD CONSTRAINT "access_revocation_log_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscription_status"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."access_revocation_log"
    ADD CONSTRAINT "access_revocation_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."access_tiers"
    ADD CONSTRAINT "access_tiers_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."admin_analytics_events"
    ADD CONSTRAINT "admin_analytics_events_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."admin_analytics_events"
    ADD CONSTRAINT "admin_analytics_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."admin_profiles"
    ADD CONSTRAINT "admin_profiles_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."admin_profiles"
    ADD CONSTRAINT "admin_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."agent_executions"
    ADD CONSTRAINT "agent_executions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."agent_schedules"
    ADD CONSTRAINT "agent_schedules_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "public"."agent_configurations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."app_feature_links"
    ADD CONSTRAINT "app_feature_links_app_id_fkey" FOREIGN KEY ("app_id") REFERENCES "public"."apps"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."app_feature_links"
    ADD CONSTRAINT "app_feature_links_feature_id_fkey" FOREIGN KEY ("feature_id") REFERENCES "public"."apps"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."app_features"
    ADD CONSTRAINT "app_features_app_id_fkey" FOREIGN KEY ("app_id") REFERENCES "public"."apps"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."apps"
    ADD CONSTRAINT "apps_parent_app_id_fkey" FOREIGN KEY ("parent_app_id") REFERENCES "public"."apps"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."apps"
    ADD CONSTRAINT "apps_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."audit_log"
    ADD CONSTRAINT "audit_log_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."benefits_features"
    ADD CONSTRAINT "benefits_features_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."calendar_availability"
    ADD CONSTRAINT "calendar_availability_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."calendar_events"
    ADD CONSTRAINT "calendar_events_parent_event_id_fkey" FOREIGN KEY ("parent_event_id") REFERENCES "public"."calendar_events"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."calendar_events"
    ADD CONSTRAINT "calendar_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."calendar_integrations"
    ADD CONSTRAINT "calendar_integrations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."csv_imports"
    ADD CONSTRAINT "csv_imports_imported_by_fkey" FOREIGN KEY ("imported_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."faqs"
    ADD CONSTRAINT "faqs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."feature_analytics"
    ADD CONSTRAINT "feature_analytics_feature_id_fkey" FOREIGN KEY ("feature_id") REFERENCES "public"."app_features"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."feature_analytics"
    ADD CONSTRAINT "feature_analytics_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."feature_benefits"
    ADD CONSTRAINT "feature_benefits_feature_id_fkey" FOREIGN KEY ("feature_id") REFERENCES "public"."app_features"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."feature_faqs"
    ADD CONSTRAINT "feature_faqs_feature_id_fkey" FOREIGN KEY ("feature_id") REFERENCES "public"."app_features"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."feature_ratings"
    ADD CONSTRAINT "feature_ratings_feature_id_fkey" FOREIGN KEY ("feature_id") REFERENCES "public"."app_features"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."feature_ratings"
    ADD CONSTRAINT "feature_ratings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."feature_steps"
    ADD CONSTRAINT "feature_steps_feature_id_fkey" FOREIGN KEY ("feature_id") REFERENCES "public"."app_features"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."feature_use_cases"
    ADD CONSTRAINT "feature_use_cases_feature_id_fkey" FOREIGN KEY ("feature_id") REFERENCES "public"."app_features"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."hero_content"
    ADD CONSTRAINT "hero_content_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."import_products"
    ADD CONSTRAINT "import_products_first_seen_in_import_id_fkey" FOREIGN KEY ("first_seen_in_import_id") REFERENCES "public"."csv_imports"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."import_records"
    ADD CONSTRAINT "import_records_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."import_records"
    ADD CONSTRAINT "import_records_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."import_user_records"
    ADD CONSTRAINT "import_user_records_csv_import_id_fkey" FOREIGN KEY ("csv_import_id") REFERENCES "public"."csv_imports"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."import_user_records"
    ADD CONSTRAINT "import_user_records_import_product_id_fkey" FOREIGN KEY ("import_product_id") REFERENCES "public"."import_products"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."import_user_records"
    ADD CONSTRAINT "import_user_records_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."pipeline_stages"
    ADD CONSTRAINT "pipeline_stages_pipeline_id_fkey" FOREIGN KEY ("pipeline_id") REFERENCES "public"."pipelines"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."platform_product_mappings"
    ADD CONSTRAINT "platform_product_mappings_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products_catalog"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pricing_plans"
    ADD CONSTRAINT "pricing_plans_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."product_app_mappings"
    ADD CONSTRAINT "product_app_mappings_access_tier_id_fkey" FOREIGN KEY ("access_tier_id") REFERENCES "public"."access_tiers"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."product_app_mappings"
    ADD CONSTRAINT "product_app_mappings_app_id_fkey" FOREIGN KEY ("app_id") REFERENCES "public"."apps"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."product_app_mappings"
    ADD CONSTRAINT "product_app_mappings_import_product_id_fkey" FOREIGN KEY ("import_product_id") REFERENCES "public"."import_products"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."product_app_mappings"
    ADD CONSTRAINT "product_app_mappings_verified_by_fkey" FOREIGN KEY ("verified_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."purchases"
    ADD CONSTRAINT "purchases_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products_catalog"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."purchases"
    ADD CONSTRAINT "purchases_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."purchases"
    ADD CONSTRAINT "purchases_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."revenue_analytics"
    ADD CONSTRAINT "revenue_analytics_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products_catalog"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."stripe_entitlements"
    ADD CONSTRAINT "stripe_entitlements_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."subscription_status"
    ADD CONSTRAINT "subscription_status_purchase_id_fkey" FOREIGN KEY ("purchase_id") REFERENCES "public"."purchases"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."subscription_status"
    ADD CONSTRAINT "subscription_status_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sync_jobs"
    ADD CONSTRAINT "sync_jobs_started_by_fkey" FOREIGN KEY ("started_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."testimonials"
    ADD CONSTRAINT "testimonials_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."user_achievements"
    ADD CONSTRAINT "user_achievements_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_app_access"
    ADD CONSTRAINT "user_app_access_purchase_id_fkey" FOREIGN KEY ("purchase_id") REFERENCES "public"."purchases"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."user_app_access"
    ADD CONSTRAINT "user_app_access_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."user_app_access"
    ADD CONSTRAINT "user_app_access_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_dashboard_preferences"
    ADD CONSTRAINT "user_dashboard_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_feature_interactions"
    ADD CONSTRAINT "user_feature_interactions_feature_id_fkey" FOREIGN KEY ("feature_id") REFERENCES "public"."app_features"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_feature_interactions"
    ADD CONSTRAINT "user_feature_interactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_management_audit"
    ADD CONSTRAINT "user_management_audit_admin_user_id_fkey" FOREIGN KEY ("admin_user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."user_management_audit"
    ADD CONSTRAINT "user_management_audit_target_user_id_fkey" FOREIGN KEY ("target_user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."user_management_audit"
    ADD CONSTRAINT "user_management_audit_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."videos"
    ADD CONSTRAINT "videos_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."videos"
    ADD CONSTRAINT "videos_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Admins can delete feature links" ON "public"."app_feature_links" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = "auth"."uid"()) AND ("user_roles"."role" = ANY (ARRAY['admin'::"text", 'super_admin'::"text"]))))));



CREATE POLICY "Admins can insert feature links" ON "public"."app_feature_links" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = "auth"."uid"()) AND ("user_roles"."role" = ANY (ARRAY['admin'::"text", 'super_admin'::"text"]))))));



CREATE POLICY "Admins can manage CSV imports" ON "public"."csv_imports" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("user_roles"."role" = ANY (ARRAY['super_admin'::"text", 'admin'::"text"]))))));



CREATE POLICY "Admins can manage FAQs" ON "public"."feature_faqs" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("user_roles"."role" = ANY (ARRAY['super_admin'::"text", 'admin'::"text"]))))));



CREATE POLICY "Admins can manage access tiers" ON "public"."access_tiers" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("user_roles"."role" = ANY (ARRAY['super_admin'::"text", 'admin'::"text"]))))));



CREATE POLICY "Admins can manage benefits" ON "public"."feature_benefits" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("user_roles"."role" = ANY (ARRAY['super_admin'::"text", 'admin'::"text"]))))));



CREATE POLICY "Admins can manage features" ON "public"."app_features" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("user_roles"."role" = ANY (ARRAY['super_admin'::"text", 'admin'::"text"]))))));



CREATE POLICY "Admins can manage homepage display settings" ON "public"."videos" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("user_roles"."role" = ANY (ARRAY['super_admin'::"text", 'admin'::"text"])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("user_roles"."role" = ANY (ARRAY['super_admin'::"text", 'admin'::"text"]))))));



CREATE POLICY "Admins can manage import products" ON "public"."import_products" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("user_roles"."role" = ANY (ARRAY['super_admin'::"text", 'admin'::"text"]))))));



CREATE POLICY "Admins can manage import user records" ON "public"."import_user_records" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("user_roles"."role" = ANY (ARRAY['super_admin'::"text", 'admin'::"text"]))))));



CREATE POLICY "Admins can manage product app mappings" ON "public"."product_app_mappings" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("user_roles"."role" = ANY (ARRAY['super_admin'::"text", 'admin'::"text"]))))));



CREATE POLICY "Admins can manage relationships" ON "public"."feature_relationships" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("user_roles"."role" = ANY (ARRAY['super_admin'::"text", 'admin'::"text"]))))));



CREATE POLICY "Admins can manage steps" ON "public"."feature_steps" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("user_roles"."role" = ANY (ARRAY['super_admin'::"text", 'admin'::"text"]))))));



CREATE POLICY "Admins can manage use cases" ON "public"."feature_use_cases" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("user_roles"."role" = ANY (ARRAY['super_admin'::"text", 'admin'::"text"]))))));



CREATE POLICY "Admins can update feature links" ON "public"."app_feature_links" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = "auth"."uid"()) AND ("user_roles"."role" = ANY (ARRAY['admin'::"text", 'super_admin'::"text"]))))));



CREATE POLICY "Admins can view all interactions" ON "public"."user_feature_interactions" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("user_roles"."role" = ANY (ARRAY['super_admin'::"text", 'admin'::"text"]))))));



CREATE POLICY "Admins can view analytics events" ON "public"."admin_analytics_events" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("user_roles"."role" = ANY (ARRAY['super_admin'::"text", 'admin'::"text"]))))));



CREATE POLICY "Admins can view app usage" ON "public"."app_usage_analytics" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("user_roles"."role" = ANY (ARRAY['super_admin'::"text", 'admin'::"text"]))))));



CREATE POLICY "Admins can view daily snapshots" ON "public"."daily_analytics_snapshots" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("user_roles"."role" = ANY (ARRAY['super_admin'::"text", 'admin'::"text"]))))));



CREATE POLICY "Admins can view revenue" ON "public"."revenue_analytics" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("user_roles"."role" = ANY (ARRAY['super_admin'::"text", 'admin'::"text"]))))));



CREATE POLICY "Admins can view user management audit logs" ON "public"."user_management_audit" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = "auth"."uid"()) AND ("user_roles"."role" = ANY (ARRAY['admin'::"text", 'super_admin'::"text"]))))));



CREATE POLICY "Admins manage apps" ON "public"."apps" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("user_roles"."role" = ANY (ARRAY['admin'::"text", 'super_admin'::"text"])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("user_roles"."role" = ANY (ARRAY['admin'::"text", 'super_admin'::"text"]))))));



CREATE POLICY "Anyone can view feature links" ON "public"."app_feature_links" FOR SELECT USING (true);



CREATE POLICY "Anyone can view tenants" ON "public"."tenants" FOR SELECT USING (true);



CREATE POLICY "Audit logs are viewable by admins" ON "public"."audit_log" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = "auth"."uid"()) AND ("user_roles"."role" = ANY (ARRAY['admin'::"text", 'super_admin'::"text"]))))));



CREATE POLICY "Authenticated users can read public videos" ON "public"."videos" FOR SELECT TO "authenticated" USING ((("is_public" = true) AND ("status" = 'completed'::"text")));



CREATE POLICY "Public users can read public videos" ON "public"."videos" FOR SELECT TO "anon" USING (("is_public" = true));



CREATE POLICY "Service can insert audit logs" ON "public"."audit_log" FOR INSERT TO "service_role" WITH CHECK (true);



CREATE POLICY "Super admins can delete profiles" ON "public"."admin_profiles" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("user_roles"."role" = 'super_admin'::"text")))));



CREATE POLICY "Super admins can delete roles" ON "public"."user_roles" FOR DELETE TO "authenticated" USING ("public"."is_super_admin"());



CREATE POLICY "Super admins can insert roles" ON "public"."user_roles" FOR INSERT TO "authenticated" WITH CHECK ("public"."is_super_admin"());



CREATE POLICY "Super admins can read all revocation logs" ON "public"."access_revocation_log" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = "auth"."uid"()) AND ("user_roles"."role" = 'super_admin'::"text")))));



CREATE POLICY "Super admins can read all roles" ON "public"."user_roles" FOR SELECT TO "authenticated" USING ("public"."is_super_admin"());



CREATE POLICY "Super admins can update roles" ON "public"."user_roles" FOR UPDATE TO "authenticated" USING ("public"."is_super_admin"()) WITH CHECK ("public"."is_super_admin"());



CREATE POLICY "Super admins manage app access" ON "public"."user_app_access" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("user_roles"."role" = 'super_admin'::"text"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("user_roles"."role" = 'super_admin'::"text")))));



CREATE POLICY "Super admins manage entitlements" ON "public"."stripe_entitlements" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("user_roles"."role" = 'super_admin'::"text"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("user_roles"."role" = 'super_admin'::"text")))));



CREATE POLICY "Super admins manage mappings" ON "public"."platform_product_mappings" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("user_roles"."role" = 'super_admin'::"text"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("user_roles"."role" = 'super_admin'::"text")))));



CREATE POLICY "Super admins manage products" ON "public"."products_catalog" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("user_roles"."role" = 'super_admin'::"text"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("user_roles"."role" = 'super_admin'::"text")))));



CREATE POLICY "Super admins manage purchases" ON "public"."purchases" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("user_roles"."role" = 'super_admin'::"text"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("user_roles"."role" = 'super_admin'::"text")))));



CREATE POLICY "Super admins manage subscription status" ON "public"."subscription_status" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("user_roles"."role" = 'super_admin'::"text"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("user_roles"."role" = 'super_admin'::"text")))));



CREATE POLICY "Super admins manage sync jobs" ON "public"."sync_jobs" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("user_roles"."role" = 'super_admin'::"text"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("user_roles"."role" = 'super_admin'::"text")))));



CREATE POLICY "Super admins manage webhook logs" ON "public"."webhook_logs" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("user_roles"."role" = 'super_admin'::"text"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("user_roles"."role" = 'super_admin'::"text")))));



CREATE POLICY "System can insert analytics events" ON "public"."admin_analytics_events" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "System can insert user management audit logs" ON "public"."user_management_audit" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "System can manage app usage" ON "public"."app_usage_analytics" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("user_roles"."role" = 'super_admin'::"text")))));



CREATE POLICY "System can manage daily snapshots" ON "public"."daily_analytics_snapshots" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("user_roles"."role" = 'super_admin'::"text")))));



CREATE POLICY "System can manage revenue" ON "public"."revenue_analytics" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("user_roles"."role" = 'super_admin'::"text")))));



CREATE POLICY "Users can create interactions" ON "public"."user_feature_interactions" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can create ratings" ON "public"."feature_ratings" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can delete own dashboard preferences" ON "public"."user_dashboard_preferences" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete own ratings" ON "public"."feature_ratings" FOR DELETE TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can delete videos" ON "public"."videos" FOR DELETE TO "authenticated" USING ((("user_id" = ( SELECT "auth"."uid"() AS "uid")) OR (EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("user_roles"."role" = 'super_admin'::"text"))))));



CREATE POLICY "Users can insert own achievements" ON "public"."user_achievements" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own dashboard preferences" ON "public"."user_dashboard_preferences" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own profile" ON "public"."admin_profiles" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can insert videos" ON "public"."videos" FOR INSERT TO "authenticated" WITH CHECK ((("user_id" = ( SELECT "auth"."uid"() AS "uid")) OR (EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("user_roles"."role" = 'super_admin'::"text"))))));



CREATE POLICY "Users can read admin profiles" ON "public"."admin_profiles" FOR SELECT TO "authenticated" USING ((("user_id" = ( SELECT "auth"."uid"() AS "uid")) OR (EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("user_roles"."role" = 'super_admin'::"text"))))));



CREATE POLICY "Users can read app access" ON "public"."user_app_access" FOR SELECT TO "authenticated" USING ((("user_id" = ( SELECT "auth"."uid"() AS "uid")) OR (EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("user_roles"."role" = 'super_admin'::"text"))))));



CREATE POLICY "Users can read entitlements" ON "public"."stripe_entitlements" FOR SELECT TO "authenticated" USING ((("user_id" = ( SELECT "auth"."uid"() AS "uid")) OR (EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("user_roles"."role" = 'super_admin'::"text"))))));



CREATE POLICY "Users can read own revocation logs" ON "public"."access_revocation_log" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can read own role" ON "public"."user_roles" FOR SELECT TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can read products" ON "public"."products_catalog" FOR SELECT TO "authenticated" USING ((("is_active" = true) OR (EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("user_roles"."role" = 'super_admin'::"text"))))));



CREATE POLICY "Users can read purchases" ON "public"."purchases" FOR SELECT TO "authenticated" USING ((("user_id" = ( SELECT "auth"."uid"() AS "uid")) OR (EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("user_roles"."role" = 'super_admin'::"text"))))));



CREATE POLICY "Users can read subscription status" ON "public"."subscription_status" FOR SELECT TO "authenticated" USING ((("user_id" = ( SELECT "auth"."uid"() AS "uid")) OR (EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("user_roles"."role" = 'super_admin'::"text"))))));



CREATE POLICY "Users can read videos" ON "public"."videos" FOR SELECT TO "authenticated" USING ((("user_id" = ( SELECT "auth"."uid"() AS "uid")) OR (EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("user_roles"."role" = 'super_admin'::"text"))))));



CREATE POLICY "Users can update own dashboard preferences" ON "public"."user_dashboard_preferences" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own ratings" ON "public"."feature_ratings" FOR UPDATE TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can update profiles" ON "public"."admin_profiles" FOR UPDATE TO "authenticated" USING ((("user_id" = ( SELECT "auth"."uid"() AS "uid")) OR (EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("user_roles"."role" = 'super_admin'::"text")))))) WITH CHECK ((("user_id" = ( SELECT "auth"."uid"() AS "uid")) OR (EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("user_roles"."role" = 'super_admin'::"text"))))));



CREATE POLICY "Users can update videos" ON "public"."videos" FOR UPDATE TO "authenticated" USING ((("user_id" = ( SELECT "auth"."uid"() AS "uid")) OR (EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("user_roles"."role" = 'super_admin'::"text")))))) WITH CHECK ((("user_id" = ( SELECT "auth"."uid"() AS "uid")) OR (EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("user_roles"."role" = 'super_admin'::"text"))))));



CREATE POLICY "Users can view active mappings" ON "public"."product_app_mappings" FOR SELECT TO "authenticated" USING (("is_active" = true));



CREATE POLICY "Users can view active tiers" ON "public"."access_tiers" FOR SELECT TO "authenticated" USING (("is_active" = true));



CREATE POLICY "Users can view apps" ON "public"."apps" FOR SELECT TO "authenticated" USING ((("is_active" = true) OR (EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("user_roles"."role" = ANY (ARRAY['admin'::"text", 'super_admin'::"text"])))))));



CREATE POLICY "Users can view mapped products" ON "public"."import_products" FOR SELECT TO "authenticated" USING (("is_mapped" = true));



CREATE POLICY "Users can view own achievements" ON "public"."user_achievements" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own dashboard preferences" ON "public"."user_dashboard_preferences" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own import records" ON "public"."import_user_records" FOR SELECT TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can view own interactions" ON "public"."user_feature_interactions" FOR SELECT TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



ALTER TABLE "public"."access_revocation_log" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."access_tiers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."admin_analytics_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."admin_profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."agent_configurations" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "agent_configurations_insert" ON "public"."agent_configurations" FOR INSERT WITH CHECK (((("app_slug")::"text" = 'smartcrm'::"text") AND ("tenant_id" = (("auth"."jwt"() ->> 'tenant_id'::"text"))::"uuid")));



CREATE POLICY "agent_configurations_select" ON "public"."agent_configurations" FOR SELECT USING (((("app_slug")::"text" = 'smartcrm'::"text") AND ("tenant_id" = (("auth"."jwt"() ->> 'tenant_id'::"text"))::"uuid")));



CREATE POLICY "agent_configurations_update" ON "public"."agent_configurations" FOR UPDATE USING (((("app_slug")::"text" = 'smartcrm'::"text") AND ("tenant_id" = (("auth"."jwt"() ->> 'tenant_id'::"text"))::"uuid")));



ALTER TABLE "public"."agent_executions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "agent_executions_insert" ON "public"."agent_executions" FOR INSERT WITH CHECK (((("app_slug")::"text" = 'smartcrm'::"text") AND ("tenant_id" = (("auth"."jwt"() ->> 'tenant_id'::"text"))::"uuid")));



CREATE POLICY "agent_executions_select" ON "public"."agent_executions" FOR SELECT USING (((("app_slug")::"text" = 'smartcrm'::"text") AND ("tenant_id" = (("auth"."jwt"() ->> 'tenant_id'::"text"))::"uuid")));



CREATE POLICY "agent_executions_update" ON "public"."agent_executions" FOR UPDATE USING (((("app_slug")::"text" = 'smartcrm'::"text") AND ("tenant_id" = (("auth"."jwt"() ->> 'tenant_id'::"text"))::"uuid")));



ALTER TABLE "public"."agent_schedules" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "agent_schedules_insert" ON "public"."agent_schedules" FOR INSERT WITH CHECK (((("app_slug")::"text" = 'smartcrm'::"text") AND ("tenant_id" = (("auth"."jwt"() ->> 'tenant_id'::"text"))::"uuid")));



CREATE POLICY "agent_schedules_select" ON "public"."agent_schedules" FOR SELECT USING (((("app_slug")::"text" = 'smartcrm'::"text") AND ("tenant_id" = (("auth"."jwt"() ->> 'tenant_id'::"text"))::"uuid")));



CREATE POLICY "agent_schedules_update" ON "public"."agent_schedules" FOR UPDATE USING (((("app_slug")::"text" = 'smartcrm'::"text") AND ("tenant_id" = (("auth"."jwt"() ->> 'tenant_id'::"text"))::"uuid")));



ALTER TABLE "public"."app_feature_links" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."app_tenants" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "app_tenants_insert" ON "public"."app_tenants" FOR INSERT WITH CHECK (((("app_slug")::"text" = 'smartcrm'::"text") AND ("tenant_id" = (("auth"."jwt"() ->> 'tenant_id'::"text"))::"uuid")));



CREATE POLICY "app_tenants_select" ON "public"."app_tenants" FOR SELECT USING (((("app_slug")::"text" = 'smartcrm'::"text") AND ("tenant_id" = (("auth"."jwt"() ->> 'tenant_id'::"text"))::"uuid")));



CREATE POLICY "app_tenants_update" ON "public"."app_tenants" FOR UPDATE USING (((("app_slug")::"text" = 'smartcrm'::"text") AND ("tenant_id" = (("auth"."jwt"() ->> 'tenant_id'::"text"))::"uuid")));



ALTER TABLE "public"."app_usage_analytics" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."apps" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."audit_log" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."calendar_availability" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "calendar_availability_insert" ON "public"."calendar_availability" FOR INSERT WITH CHECK (((("app_slug")::"text" = 'smartcrm'::"text") AND (("tenant_id" = (("auth"."jwt"() ->> 'tenant_id'::"text"))::"uuid") OR ("user_id" = "auth"."uid"()))));



CREATE POLICY "calendar_availability_select" ON "public"."calendar_availability" FOR SELECT USING (((("app_slug")::"text" = 'smartcrm'::"text") AND (("tenant_id" = (("auth"."jwt"() ->> 'tenant_id'::"text"))::"uuid") OR ("user_id" = "auth"."uid"()))));



CREATE POLICY "calendar_availability_update" ON "public"."calendar_availability" FOR UPDATE USING (((("app_slug")::"text" = 'smartcrm'::"text") AND (("tenant_id" = (("auth"."jwt"() ->> 'tenant_id'::"text"))::"uuid") OR ("user_id" = "auth"."uid"()))));



ALTER TABLE "public"."calendar_events" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "calendar_events_delete" ON "public"."calendar_events" FOR DELETE USING (((("app_slug")::"text" = 'smartcrm'::"text") AND (("tenant_id" = (("auth"."jwt"() ->> 'tenant_id'::"text"))::"uuid") OR ("user_id" = "auth"."uid"()))));



CREATE POLICY "calendar_events_insert" ON "public"."calendar_events" FOR INSERT WITH CHECK (((("app_slug")::"text" = 'smartcrm'::"text") AND (("tenant_id" = (("auth"."jwt"() ->> 'tenant_id'::"text"))::"uuid") OR ("user_id" = "auth"."uid"()))));



CREATE POLICY "calendar_events_select" ON "public"."calendar_events" FOR SELECT USING (((("app_slug")::"text" = 'smartcrm'::"text") AND (("tenant_id" = (("auth"."jwt"() ->> 'tenant_id'::"text"))::"uuid") OR ("user_id" = "auth"."uid"()))));



CREATE POLICY "calendar_events_update" ON "public"."calendar_events" FOR UPDATE USING (((("app_slug")::"text" = 'smartcrm'::"text") AND (("tenant_id" = (("auth"."jwt"() ->> 'tenant_id'::"text"))::"uuid") OR ("user_id" = "auth"."uid"()))));



ALTER TABLE "public"."calendar_integrations" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "calendar_integrations_insert" ON "public"."calendar_integrations" FOR INSERT WITH CHECK (((("app_slug")::"text" = 'smartcrm'::"text") AND ("user_id" = "auth"."uid"())));



CREATE POLICY "calendar_integrations_select" ON "public"."calendar_integrations" FOR SELECT USING (((("app_slug")::"text" = 'smartcrm'::"text") AND ("user_id" = "auth"."uid"())));



CREATE POLICY "calendar_integrations_update" ON "public"."calendar_integrations" FOR UPDATE USING (((("app_slug")::"text" = 'smartcrm'::"text") AND ("user_id" = "auth"."uid"())));



ALTER TABLE "public"."csv_imports" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."daily_analytics_snapshots" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."import_products" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."import_user_records" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."pipeline_stages" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "pipeline_stages_insert" ON "public"."pipeline_stages" FOR INSERT WITH CHECK (((("app_slug")::"text" = 'smartcrm'::"text") AND ("tenant_id" = (("auth"."jwt"() ->> 'tenant_id'::"text"))::"uuid")));



CREATE POLICY "pipeline_stages_select" ON "public"."pipeline_stages" FOR SELECT USING (((("app_slug")::"text" = 'smartcrm'::"text") AND ("tenant_id" = (("auth"."jwt"() ->> 'tenant_id'::"text"))::"uuid")));



CREATE POLICY "pipeline_stages_update" ON "public"."pipeline_stages" FOR UPDATE USING (((("app_slug")::"text" = 'smartcrm'::"text") AND ("tenant_id" = (("auth"."jwt"() ->> 'tenant_id'::"text"))::"uuid")));



ALTER TABLE "public"."pipelines" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "pipelines_delete" ON "public"."pipelines" FOR DELETE USING (((("app_slug")::"text" = 'smartcrm'::"text") AND ("tenant_id" = (("auth"."jwt"() ->> 'tenant_id'::"text"))::"uuid")));



CREATE POLICY "pipelines_insert" ON "public"."pipelines" FOR INSERT WITH CHECK (((("app_slug")::"text" = 'smartcrm'::"text") AND ("tenant_id" = (("auth"."jwt"() ->> 'tenant_id'::"text"))::"uuid")));



CREATE POLICY "pipelines_select" ON "public"."pipelines" FOR SELECT USING (((("app_slug")::"text" = 'smartcrm'::"text") AND ("tenant_id" = (("auth"."jwt"() ->> 'tenant_id'::"text"))::"uuid")));



CREATE POLICY "pipelines_update" ON "public"."pipelines" FOR UPDATE USING (((("app_slug")::"text" = 'smartcrm'::"text") AND ("tenant_id" = (("auth"."jwt"() ->> 'tenant_id'::"text"))::"uuid")));



ALTER TABLE "public"."platform_product_mappings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."product_app_mappings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."products_catalog" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."purchases" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."revenue_analytics" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "service_role_can_manage_all_profiles" ON "public"."profiles" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "service_role_can_manage_profiles" ON "public"."profiles" USING ((("auth"."jwt"() ->> 'role'::"text") = 'service_role'::"text"));



ALTER TABLE "public"."stripe_entitlements" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."subscription_status" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sync_jobs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tenants" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_achievements" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_app_access" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_dashboard_preferences" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_management_audit" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_roles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "users_can_insert_own_profile" ON "public"."profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "users_can_read_own_profile" ON "public"."profiles" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "users_can_update_own_profile" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "users_can_update_own_profile_db" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "users_can_upsert_own_profile" ON "public"."profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."videos" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."webhook_logs" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."audit_user_roles_changes"() TO "anon";
GRANT ALL ON FUNCTION "public"."audit_user_roles_changes"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."audit_user_roles_changes"() TO "service_role";



GRANT ALL ON FUNCTION "public"."award_achievement"("p_user_id" "uuid", "p_achievement_type" "text", "p_metadata" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."award_achievement"("p_user_id" "uuid", "p_achievement_type" "text", "p_metadata" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."award_achievement"("p_user_id" "uuid", "p_achievement_type" "text", "p_metadata" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."check_and_revoke_expired_subscriptions"() TO "anon";
GRANT ALL ON FUNCTION "public"."check_and_revoke_expired_subscriptions"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_and_revoke_expired_subscriptions"() TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_daily_snapshot"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_daily_snapshot"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_daily_snapshot"() TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_daily_snapshot"("p_date" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."generate_daily_snapshot"("p_date" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_daily_snapshot"("p_date" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_app_slug"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_app_slug"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_app_slug"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_feature_popularity"("p_feature_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_feature_popularity"("p_feature_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_feature_popularity"("p_feature_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_recommended_features"("p_user_id" "uuid", "p_limit" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_recommended_features"("p_user_id" "uuid", "p_limit" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_recommended_features"("p_user_id" "uuid", "p_limit" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_tenant_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_tenant_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_tenant_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_progress_percentage"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_progress_percentage"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_progress_percentage"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_super_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_super_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_super_admin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_super_admin"("check_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_super_admin"("check_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_super_admin"("check_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_thumbnail_public"("thumb_path" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."is_thumbnail_public"("thumb_path" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_thumbnail_public"("thumb_path" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_video_file_public"("file_path" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."is_video_file_public"("file_path" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_video_file_public"("file_path" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."log_admin_user_operation"("p_operation" "text", "p_target_user_id" "uuid", "p_operation_details" "jsonb", "p_success" boolean, "p_error_message" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."log_admin_user_operation"("p_operation" "text", "p_target_user_id" "uuid", "p_operation_details" "jsonb", "p_success" boolean, "p_error_message" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_admin_user_operation"("p_operation" "text", "p_target_user_id" "uuid", "p_operation_details" "jsonb", "p_success" boolean, "p_error_message" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."log_analytics_event"("p_admin_id" "uuid", "p_event_type" "text", "p_entity_type" "text", "p_entity_id" "uuid", "p_metadata" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."log_analytics_event"("p_admin_id" "uuid", "p_event_type" "text", "p_entity_type" "text", "p_entity_id" "uuid", "p_metadata" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_analytics_event"("p_admin_id" "uuid", "p_event_type" "text", "p_entity_type" "text", "p_entity_id" "uuid", "p_metadata" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."log_analytics_event"("p_event_type" "text", "p_user_id" "uuid", "p_admin_id" "uuid", "p_entity_type" "text", "p_entity_id" "uuid", "p_metadata" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."log_analytics_event"("p_event_type" "text", "p_user_id" "uuid", "p_admin_id" "uuid", "p_entity_type" "text", "p_entity_id" "uuid", "p_metadata" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_analytics_event"("p_event_type" "text", "p_user_id" "uuid", "p_admin_id" "uuid", "p_entity_type" "text", "p_entity_id" "uuid", "p_metadata" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."log_app_access_event"() TO "anon";
GRANT ALL ON FUNCTION "public"."log_app_access_event"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_app_access_event"() TO "service_role";



GRANT ALL ON FUNCTION "public"."log_purchase_event"() TO "anon";
GRANT ALL ON FUNCTION "public"."log_purchase_event"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_purchase_event"() TO "service_role";



GRANT ALL ON FUNCTION "public"."log_user_management_operation"("p_operation" "text", "p_user_id" "uuid", "p_target_user_id" "uuid", "p_admin_user_id" "uuid", "p_operation_details" "jsonb", "p_old_values" "jsonb", "p_new_values" "jsonb", "p_ip_address" "inet", "p_user_agent" "text", "p_session_id" "text", "p_success" boolean, "p_error_message" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."log_user_management_operation"("p_operation" "text", "p_user_id" "uuid", "p_target_user_id" "uuid", "p_admin_user_id" "uuid", "p_operation_details" "jsonb", "p_old_values" "jsonb", "p_new_values" "jsonb", "p_ip_address" "inet", "p_user_agent" "text", "p_session_id" "text", "p_success" boolean, "p_error_message" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_user_management_operation"("p_operation" "text", "p_user_id" "uuid", "p_target_user_id" "uuid", "p_admin_user_id" "uuid", "p_operation_details" "jsonb", "p_old_values" "jsonb", "p_new_values" "jsonb", "p_ip_address" "inet", "p_user_agent" "text", "p_session_id" "text", "p_success" boolean, "p_error_message" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."log_user_signup"() TO "anon";
GRANT ALL ON FUNCTION "public"."log_user_signup"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_user_signup"() TO "service_role";



GRANT ALL ON FUNCTION "public"."restore_subscription_access"("p_user_id" "uuid", "p_app_slug" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."restore_subscription_access"("p_user_id" "uuid", "p_app_slug" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."restore_subscription_access"("p_user_id" "uuid", "p_app_slug" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_app_feature_count"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_app_feature_count"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_app_feature_count"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_app_included_features"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_app_included_features"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_app_included_features"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_apps_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_apps_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_apps_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_feature_analytics"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_feature_analytics"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_feature_analytics"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_user_dashboard_preferences_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_user_dashboard_preferences_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_user_dashboard_preferences_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."user_has_feature_access"("p_user_id" "uuid", "p_feature_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."user_has_feature_access"("p_user_id" "uuid", "p_feature_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."user_has_feature_access"("p_user_id" "uuid", "p_feature_id" "uuid") TO "service_role";


















GRANT ALL ON TABLE "public"."access_revocation_log" TO "anon";
GRANT ALL ON TABLE "public"."access_revocation_log" TO "authenticated";
GRANT ALL ON TABLE "public"."access_revocation_log" TO "service_role";



GRANT ALL ON TABLE "public"."access_tiers" TO "anon";
GRANT ALL ON TABLE "public"."access_tiers" TO "authenticated";
GRANT ALL ON TABLE "public"."access_tiers" TO "service_role";



GRANT ALL ON TABLE "public"."admin_analytics_events" TO "anon";
GRANT ALL ON TABLE "public"."admin_analytics_events" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_analytics_events" TO "service_role";



GRANT ALL ON TABLE "public"."admin_profiles" TO "anon";
GRANT ALL ON TABLE "public"."admin_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_profiles" TO "service_role";



GRANT ALL ON TABLE "public"."agent_configurations" TO "anon";
GRANT ALL ON TABLE "public"."agent_configurations" TO "authenticated";
GRANT ALL ON TABLE "public"."agent_configurations" TO "service_role";



GRANT ALL ON TABLE "public"."agent_executions" TO "anon";
GRANT ALL ON TABLE "public"."agent_executions" TO "authenticated";
GRANT ALL ON TABLE "public"."agent_executions" TO "service_role";



GRANT ALL ON TABLE "public"."agent_schedules" TO "anon";
GRANT ALL ON TABLE "public"."agent_schedules" TO "authenticated";
GRANT ALL ON TABLE "public"."agent_schedules" TO "service_role";



GRANT ALL ON TABLE "public"."app_feature_links" TO "anon";
GRANT ALL ON TABLE "public"."app_feature_links" TO "authenticated";
GRANT ALL ON TABLE "public"."app_feature_links" TO "service_role";



GRANT ALL ON TABLE "public"."app_features" TO "anon";
GRANT ALL ON TABLE "public"."app_features" TO "authenticated";
GRANT ALL ON TABLE "public"."app_features" TO "service_role";



GRANT ALL ON TABLE "public"."app_tenants" TO "anon";
GRANT ALL ON TABLE "public"."app_tenants" TO "authenticated";
GRANT ALL ON TABLE "public"."app_tenants" TO "service_role";



GRANT ALL ON TABLE "public"."app_usage_analytics" TO "anon";
GRANT ALL ON TABLE "public"."app_usage_analytics" TO "authenticated";
GRANT ALL ON TABLE "public"."app_usage_analytics" TO "service_role";



GRANT ALL ON TABLE "public"."apps" TO "anon";
GRANT ALL ON TABLE "public"."apps" TO "authenticated";
GRANT ALL ON TABLE "public"."apps" TO "service_role";



GRANT ALL ON TABLE "public"."apps_with_features" TO "anon";
GRANT ALL ON TABLE "public"."apps_with_features" TO "authenticated";
GRANT ALL ON TABLE "public"."apps_with_features" TO "service_role";



GRANT ALL ON TABLE "public"."audit_log" TO "anon";
GRANT ALL ON TABLE "public"."audit_log" TO "authenticated";
GRANT ALL ON TABLE "public"."audit_log" TO "service_role";



GRANT ALL ON TABLE "public"."benefits_features" TO "anon";
GRANT ALL ON TABLE "public"."benefits_features" TO "authenticated";
GRANT ALL ON TABLE "public"."benefits_features" TO "service_role";



GRANT ALL ON TABLE "public"."calendar_availability" TO "anon";
GRANT ALL ON TABLE "public"."calendar_availability" TO "authenticated";
GRANT ALL ON TABLE "public"."calendar_availability" TO "service_role";



GRANT ALL ON TABLE "public"."calendar_events" TO "anon";
GRANT ALL ON TABLE "public"."calendar_events" TO "authenticated";
GRANT ALL ON TABLE "public"."calendar_events" TO "service_role";



GRANT ALL ON TABLE "public"."calendar_integrations" TO "anon";
GRANT ALL ON TABLE "public"."calendar_integrations" TO "authenticated";
GRANT ALL ON TABLE "public"."calendar_integrations" TO "service_role";



GRANT ALL ON TABLE "public"."csv_imports" TO "anon";
GRANT ALL ON TABLE "public"."csv_imports" TO "authenticated";
GRANT ALL ON TABLE "public"."csv_imports" TO "service_role";



GRANT ALL ON TABLE "public"."daily_analytics_snapshots" TO "anon";
GRANT ALL ON TABLE "public"."daily_analytics_snapshots" TO "authenticated";
GRANT ALL ON TABLE "public"."daily_analytics_snapshots" TO "service_role";



GRANT ALL ON TABLE "public"."faqs" TO "anon";
GRANT ALL ON TABLE "public"."faqs" TO "authenticated";
GRANT ALL ON TABLE "public"."faqs" TO "service_role";



GRANT ALL ON TABLE "public"."feature_analytics" TO "anon";
GRANT ALL ON TABLE "public"."feature_analytics" TO "authenticated";
GRANT ALL ON TABLE "public"."feature_analytics" TO "service_role";



GRANT ALL ON TABLE "public"."feature_benefits" TO "anon";
GRANT ALL ON TABLE "public"."feature_benefits" TO "authenticated";
GRANT ALL ON TABLE "public"."feature_benefits" TO "service_role";



GRANT ALL ON TABLE "public"."feature_faqs" TO "anon";
GRANT ALL ON TABLE "public"."feature_faqs" TO "authenticated";
GRANT ALL ON TABLE "public"."feature_faqs" TO "service_role";



GRANT ALL ON TABLE "public"."feature_ratings" TO "anon";
GRANT ALL ON TABLE "public"."feature_ratings" TO "authenticated";
GRANT ALL ON TABLE "public"."feature_ratings" TO "service_role";



GRANT ALL ON TABLE "public"."feature_relationships" TO "anon";
GRANT ALL ON TABLE "public"."feature_relationships" TO "authenticated";
GRANT ALL ON TABLE "public"."feature_relationships" TO "service_role";



GRANT ALL ON TABLE "public"."feature_steps" TO "anon";
GRANT ALL ON TABLE "public"."feature_steps" TO "authenticated";
GRANT ALL ON TABLE "public"."feature_steps" TO "service_role";



GRANT ALL ON TABLE "public"."feature_use_cases" TO "anon";
GRANT ALL ON TABLE "public"."feature_use_cases" TO "authenticated";
GRANT ALL ON TABLE "public"."feature_use_cases" TO "service_role";



GRANT ALL ON TABLE "public"."hero_content" TO "anon";
GRANT ALL ON TABLE "public"."hero_content" TO "authenticated";
GRANT ALL ON TABLE "public"."hero_content" TO "service_role";



GRANT ALL ON TABLE "public"."import_products" TO "anon";
GRANT ALL ON TABLE "public"."import_products" TO "authenticated";
GRANT ALL ON TABLE "public"."import_products" TO "service_role";



GRANT ALL ON TABLE "public"."import_records" TO "anon";
GRANT ALL ON TABLE "public"."import_records" TO "authenticated";
GRANT ALL ON TABLE "public"."import_records" TO "service_role";



GRANT ALL ON TABLE "public"."import_user_records" TO "anon";
GRANT ALL ON TABLE "public"."import_user_records" TO "authenticated";
GRANT ALL ON TABLE "public"."import_user_records" TO "service_role";



GRANT ALL ON TABLE "public"."pipeline_stages" TO "anon";
GRANT ALL ON TABLE "public"."pipeline_stages" TO "authenticated";
GRANT ALL ON TABLE "public"."pipeline_stages" TO "service_role";



GRANT ALL ON TABLE "public"."pipelines" TO "anon";
GRANT ALL ON TABLE "public"."pipelines" TO "authenticated";
GRANT ALL ON TABLE "public"."pipelines" TO "service_role";



GRANT ALL ON TABLE "public"."platform_product_mappings" TO "anon";
GRANT ALL ON TABLE "public"."platform_product_mappings" TO "authenticated";
GRANT ALL ON TABLE "public"."platform_product_mappings" TO "service_role";



GRANT ALL ON TABLE "public"."pricing_plans" TO "anon";
GRANT ALL ON TABLE "public"."pricing_plans" TO "authenticated";
GRANT ALL ON TABLE "public"."pricing_plans" TO "service_role";



GRANT ALL ON TABLE "public"."product_app_mappings" TO "anon";
GRANT ALL ON TABLE "public"."product_app_mappings" TO "authenticated";
GRANT ALL ON TABLE "public"."product_app_mappings" TO "service_role";



GRANT ALL ON TABLE "public"."products_catalog" TO "anon";
GRANT ALL ON TABLE "public"."products_catalog" TO "authenticated";
GRANT ALL ON TABLE "public"."products_catalog" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."purchases" TO "anon";
GRANT ALL ON TABLE "public"."purchases" TO "authenticated";
GRANT ALL ON TABLE "public"."purchases" TO "service_role";



GRANT ALL ON TABLE "public"."revenue_analytics" TO "anon";
GRANT ALL ON TABLE "public"."revenue_analytics" TO "authenticated";
GRANT ALL ON TABLE "public"."revenue_analytics" TO "service_role";



GRANT ALL ON TABLE "public"."stripe_entitlements" TO "anon";
GRANT ALL ON TABLE "public"."stripe_entitlements" TO "authenticated";
GRANT ALL ON TABLE "public"."stripe_entitlements" TO "service_role";



GRANT ALL ON TABLE "public"."subscription_status" TO "anon";
GRANT ALL ON TABLE "public"."subscription_status" TO "authenticated";
GRANT ALL ON TABLE "public"."subscription_status" TO "service_role";



GRANT ALL ON TABLE "public"."subscriptions" TO "anon";
GRANT ALL ON TABLE "public"."subscriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."subscriptions" TO "service_role";



GRANT ALL ON TABLE "public"."sync_jobs" TO "anon";
GRANT ALL ON TABLE "public"."sync_jobs" TO "authenticated";
GRANT ALL ON TABLE "public"."sync_jobs" TO "service_role";



GRANT ALL ON TABLE "public"."tenants" TO "anon";
GRANT ALL ON TABLE "public"."tenants" TO "authenticated";
GRANT ALL ON TABLE "public"."tenants" TO "service_role";



GRANT ALL ON TABLE "public"."testimonials" TO "anon";
GRANT ALL ON TABLE "public"."testimonials" TO "authenticated";
GRANT ALL ON TABLE "public"."testimonials" TO "service_role";



GRANT ALL ON TABLE "public"."user_achievements" TO "anon";
GRANT ALL ON TABLE "public"."user_achievements" TO "authenticated";
GRANT ALL ON TABLE "public"."user_achievements" TO "service_role";



GRANT ALL ON TABLE "public"."user_app_access" TO "anon";
GRANT ALL ON TABLE "public"."user_app_access" TO "authenticated";
GRANT ALL ON TABLE "public"."user_app_access" TO "service_role";



GRANT ALL ON TABLE "public"."user_dashboard_preferences" TO "anon";
GRANT ALL ON TABLE "public"."user_dashboard_preferences" TO "authenticated";
GRANT ALL ON TABLE "public"."user_dashboard_preferences" TO "service_role";



GRANT ALL ON TABLE "public"."user_feature_interactions" TO "anon";
GRANT ALL ON TABLE "public"."user_feature_interactions" TO "authenticated";
GRANT ALL ON TABLE "public"."user_feature_interactions" TO "service_role";



GRANT ALL ON TABLE "public"."user_management_audit" TO "anon";
GRANT ALL ON TABLE "public"."user_management_audit" TO "authenticated";
GRANT ALL ON TABLE "public"."user_management_audit" TO "service_role";



GRANT ALL ON TABLE "public"."user_roles" TO "anon";
GRANT ALL ON TABLE "public"."user_roles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_roles" TO "service_role";



GRANT ALL ON TABLE "public"."videos" TO "anon";
GRANT ALL ON TABLE "public"."videos" TO "authenticated";
GRANT ALL ON TABLE "public"."videos" TO "service_role";



GRANT ALL ON TABLE "public"."webhook_logs" TO "anon";
GRANT ALL ON TABLE "public"."webhook_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."webhook_logs" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































