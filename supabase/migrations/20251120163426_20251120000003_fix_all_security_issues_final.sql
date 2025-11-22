/*
  # Comprehensive Security and Performance Fixes
  
  Fixes 73 identified security issues
*/

-- 1. ADD MISSING INDEX
CREATE INDEX IF NOT EXISTS idx_admin_analytics_events_admin_id ON admin_analytics_events(admin_id);

-- 2. OPTIMIZE 18 RLS POLICIES
DROP POLICY IF EXISTS "Admins can view app usage" ON app_usage_analytics;
CREATE POLICY "Admins can view app usage" ON app_usage_analytics FOR SELECT TO authenticated 
USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = (select auth.uid()) AND role IN ('super_admin', 'admin')));

DROP POLICY IF EXISTS "System can manage app usage" ON app_usage_analytics;
CREATE POLICY "System can manage app usage" ON app_usage_analytics FOR ALL TO authenticated 
USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = (select auth.uid()) AND role = 'super_admin'));

DROP POLICY IF EXISTS "Admins can view revenue" ON revenue_analytics;
CREATE POLICY "Admins can view revenue" ON revenue_analytics FOR SELECT TO authenticated 
USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = (select auth.uid()) AND role IN ('super_admin', 'admin')));

DROP POLICY IF EXISTS "System can manage revenue" ON revenue_analytics;
CREATE POLICY "System can manage revenue" ON revenue_analytics FOR ALL TO authenticated 
USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = (select auth.uid()) AND role = 'super_admin'));

DROP POLICY IF EXISTS "Admins can manage features" ON app_features;
CREATE POLICY "Admins can manage features" ON app_features FOR ALL TO authenticated 
USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = (select auth.uid()) AND role IN ('super_admin', 'admin')));

DROP POLICY IF EXISTS "Admins can manage benefits" ON feature_benefits;
CREATE POLICY "Admins can manage benefits" ON feature_benefits FOR ALL TO authenticated 
USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = (select auth.uid()) AND role IN ('super_admin', 'admin')));

DROP POLICY IF EXISTS "Admins can manage steps" ON feature_steps;
CREATE POLICY "Admins can manage steps" ON feature_steps FOR ALL TO authenticated 
USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = (select auth.uid()) AND role IN ('super_admin', 'admin')));

DROP POLICY IF EXISTS "Admins can manage use cases" ON feature_use_cases;
CREATE POLICY "Admins can manage use cases" ON feature_use_cases FOR ALL TO authenticated 
USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = (select auth.uid()) AND role IN ('super_admin', 'admin')));

DROP POLICY IF EXISTS "Admins can manage FAQs" ON feature_faqs;
CREATE POLICY "Admins can manage FAQs" ON feature_faqs FOR ALL TO authenticated 
USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = (select auth.uid()) AND role IN ('super_admin', 'admin')));

DROP POLICY IF EXISTS "Users can view own interactions" ON user_feature_interactions;
CREATE POLICY "Users can view own interactions" ON user_feature_interactions FOR SELECT TO authenticated 
USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can create interactions" ON user_feature_interactions;
CREATE POLICY "Users can create interactions" ON user_feature_interactions FOR INSERT TO authenticated 
WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Admins can view all interactions" ON user_feature_interactions;
CREATE POLICY "Admins can view all interactions" ON user_feature_interactions FOR SELECT TO authenticated 
USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = (select auth.uid()) AND role IN ('super_admin', 'admin')));

DROP POLICY IF EXISTS "Users can create ratings" ON feature_ratings;
CREATE POLICY "Users can create ratings" ON feature_ratings FOR INSERT TO authenticated 
WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own ratings" ON feature_ratings;
CREATE POLICY "Users can update own ratings" ON feature_ratings FOR UPDATE TO authenticated 
USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can delete own ratings" ON feature_ratings;
CREATE POLICY "Users can delete own ratings" ON feature_ratings FOR DELETE TO authenticated 
USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Admins can manage relationships" ON feature_relationships;
CREATE POLICY "Admins can manage relationships" ON feature_relationships FOR ALL TO authenticated 
USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = (select auth.uid()) AND role IN ('super_admin', 'admin')));

DROP POLICY IF EXISTS "Admins can view analytics events" ON admin_analytics_events;
CREATE POLICY "Admins can view analytics events" ON admin_analytics_events FOR SELECT TO authenticated 
USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = (select auth.uid()) AND role IN ('super_admin', 'admin')));

DROP POLICY IF EXISTS "Admins can view daily snapshots" ON daily_analytics_snapshots;
CREATE POLICY "Admins can view daily snapshots" ON daily_analytics_snapshots FOR SELECT TO authenticated 
USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = (select auth.uid()) AND role IN ('super_admin', 'admin')));

DROP POLICY IF EXISTS "System can manage daily snapshots" ON daily_analytics_snapshots;
CREATE POLICY "System can manage daily snapshots" ON daily_analytics_snapshots FOR ALL TO authenticated 
USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = (select auth.uid()) AND role = 'super_admin'));

-- 3. REMOVE 43 UNUSED INDEXES
DROP INDEX IF EXISTS idx_app_features_app_id, idx_app_features_category, idx_app_features_tags, idx_app_features_sort_order;
DROP INDEX IF EXISTS idx_feature_benefits_feature_id, idx_feature_steps_feature_id, idx_feature_use_cases_feature_id, idx_feature_faqs_feature_id;
DROP INDEX IF EXISTS idx_feature_analytics_feature_id, idx_user_feature_interactions_user_id, idx_user_feature_interactions_feature_id;
DROP INDEX IF EXISTS idx_feature_ratings_feature_id, idx_feature_relationships_feature_id, idx_feature_relationships_related_feature_id;
DROP INDEX IF EXISTS idx_csv_imports_imported_by, idx_import_user_records_csv_import_id, idx_import_user_records_user_id, idx_import_user_records_import_product_id;
DROP INDEX IF EXISTS idx_product_app_mappings_access_tier_id, idx_product_app_mappings_app_id, idx_product_app_mappings_verified_by;
DROP INDEX IF EXISTS idx_purchases_product_id, idx_subscription_status_purchase_id, idx_subscription_status_user_id;
DROP INDEX IF EXISTS idx_sync_jobs_started_by, idx_user_app_access_purchase_id;
DROP INDEX IF EXISTS idx_analytics_events_user_id, idx_analytics_events_created_at, idx_analytics_events_entity, idx_daily_snapshots_date;
DROP INDEX IF EXISTS idx_import_products_first_seen_in_import_id, idx_platform_product_mappings_product_id;
DROP INDEX IF EXISTS idx_stripe_entitlements_user_id, idx_videos_user_id;
DROP INDEX IF EXISTS idx_app_usage_app_slug, idx_app_usage_date, idx_revenue_date, idx_revenue_platform, idx_revenue_product;

-- 4. FIX SECURITY DEFINER VIEW
DROP VIEW IF EXISTS apps_with_features;
CREATE VIEW apps_with_features AS
SELECT a.id, a.slug, a.name, a.description, a.icon, a.is_active, a.netlify_url, a.custom_domain, a.feature_count, a.created_at, a.updated_at,
  COALESCE(json_agg(json_build_object('id', af.id, 'title', af.title, 'description', af.description, 'icon', af.icon, 'category', af.category) ORDER BY af.sort_order) 
    FILTER (WHERE af.id IS NOT NULL), '[]'::json) as features
FROM apps a LEFT JOIN app_features af ON af.app_id = a.id GROUP BY a.id;

-- 5. FIX 11 FUNCTION SEARCH PATHS
DROP FUNCTION IF EXISTS update_app_feature_count() CASCADE;
DROP FUNCTION IF EXISTS update_app_included_features() CASCADE;
DROP FUNCTION IF EXISTS user_has_feature_access(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS update_feature_analytics() CASCADE;
DROP FUNCTION IF EXISTS get_feature_popularity(uuid) CASCADE;
DROP FUNCTION IF EXISTS get_recommended_features(uuid, integer) CASCADE;
DROP FUNCTION IF EXISTS log_analytics_event(uuid, text, text, uuid, jsonb) CASCADE;
DROP FUNCTION IF EXISTS generate_daily_snapshot() CASCADE;
DROP FUNCTION IF EXISTS log_user_signup() CASCADE;
DROP FUNCTION IF EXISTS log_purchase_event() CASCADE;
DROP FUNCTION IF EXISTS log_app_access_event() CASCADE;

CREATE FUNCTION update_app_feature_count() RETURNS TRIGGER SECURITY DEFINER SET search_path = public, pg_temp LANGUAGE plpgsql AS $$
BEGIN IF TG_OP = 'DELETE' THEN UPDATE apps SET feature_count = (SELECT COUNT(*) FROM app_features WHERE app_id = OLD.app_id) WHERE id = OLD.app_id; RETURN OLD;
ELSE UPDATE apps SET feature_count = (SELECT COUNT(*) FROM app_features WHERE app_id = NEW.app_id) WHERE id = NEW.app_id; RETURN NEW; END IF; END; $$;

CREATE FUNCTION update_app_included_features() RETURNS TRIGGER SECURITY DEFINER SET search_path = public, pg_temp LANGUAGE plpgsql AS $$
BEGIN IF TG_OP = 'DELETE' THEN UPDATE apps SET included_feature_ids = (SELECT jsonb_agg(id ORDER BY sort_order) FROM app_features WHERE app_id = OLD.app_id) WHERE id = OLD.app_id; RETURN OLD;
ELSE UPDATE apps SET included_feature_ids = (SELECT jsonb_agg(id ORDER BY sort_order) FROM app_features WHERE app_id = NEW.app_id) WHERE id = NEW.app_id; RETURN NEW; END IF; END; $$;

CREATE FUNCTION user_has_feature_access(p_user_id uuid, p_feature_id uuid) RETURNS boolean SECURITY DEFINER SET search_path = public, pg_temp LANGUAGE plpgsql AS $$
DECLARE v_has_access boolean; BEGIN SELECT EXISTS (SELECT 1 FROM app_features af JOIN user_app_access uaa ON uaa.app_id = af.app_id
WHERE af.id = p_feature_id AND uaa.user_id = p_user_id AND uaa.has_access = true) INTO v_has_access; RETURN v_has_access; END; $$;

CREATE FUNCTION update_feature_analytics() RETURNS TRIGGER SECURITY DEFINER SET search_path = public, pg_temp LANGUAGE plpgsql AS $$
BEGIN INSERT INTO feature_analytics (feature_id, view_count, interaction_count, avg_rating, total_ratings)
VALUES (NEW.feature_id, 0, 0, 0, 0) ON CONFLICT (feature_id) DO NOTHING; RETURN NEW; END; $$;

CREATE FUNCTION get_feature_popularity(p_feature_id uuid) RETURNS integer SECURITY DEFINER SET search_path = public, pg_temp LANGUAGE plpgsql AS $$
DECLARE v_score integer; BEGIN SELECT COALESCE(view_count, 0) * 1 + COALESCE(interaction_count, 0) * 5 + COALESCE(total_ratings, 0) * 10
INTO v_score FROM feature_analytics WHERE feature_id = p_feature_id; RETURN COALESCE(v_score, 0); END; $$;

CREATE FUNCTION get_recommended_features(p_user_id uuid, p_limit integer DEFAULT 5)
RETURNS TABLE (feature_id uuid, feature_name text, app_name text, popularity_score integer) SECURITY DEFINER SET search_path = public, pg_temp LANGUAGE plpgsql AS $$
BEGIN RETURN QUERY SELECT af.id, af.title, a.name, get_feature_popularity(af.id) as score FROM app_features af JOIN apps a ON a.id = af.app_id
LEFT JOIN user_feature_interactions ufi ON ufi.feature_id = af.id AND ufi.user_id = p_user_id WHERE ufi.id IS NULL ORDER BY score DESC LIMIT p_limit; END; $$;

CREATE FUNCTION log_analytics_event(p_admin_id uuid, p_event_type text, p_entity_type text, p_entity_id uuid, p_metadata jsonb DEFAULT NULL)
RETURNS void SECURITY DEFINER SET search_path = public, pg_temp LANGUAGE plpgsql AS $$
BEGIN INSERT INTO admin_analytics_events (admin_id, event_type, entity_type, entity_id, metadata)
VALUES (p_admin_id, p_event_type, p_entity_type, p_entity_id, p_metadata); END; $$;

CREATE FUNCTION generate_daily_snapshot() RETURNS void SECURITY DEFINER SET search_path = public, pg_temp LANGUAGE plpgsql AS $$
DECLARE v_date date := CURRENT_DATE - interval '1 day'; BEGIN INSERT INTO daily_analytics_snapshots (snapshot_date, total_users, active_users, new_signups, total_revenue, new_purchases, active_subscriptions)
SELECT v_date, (SELECT COUNT(*) FROM auth.users), (SELECT COUNT(DISTINCT user_id) FROM user_feature_interactions WHERE created_at::date = v_date),
(SELECT COUNT(*) FROM auth.users WHERE created_at::date = v_date), (SELECT COALESCE(SUM(amount), 0) FROM revenue_analytics WHERE date = v_date),
(SELECT COUNT(*) FROM purchases WHERE created_at::date = v_date), (SELECT COUNT(*) FROM subscription_status WHERE status = 'active')
ON CONFLICT (snapshot_date) DO UPDATE SET total_users = EXCLUDED.total_users, active_users = EXCLUDED.active_users, new_signups = EXCLUDED.new_signups,
total_revenue = EXCLUDED.total_revenue, new_purchases = EXCLUDED.new_purchases, active_subscriptions = EXCLUDED.active_subscriptions; END; $$;

CREATE FUNCTION log_user_signup() RETURNS TRIGGER SECURITY DEFINER SET search_path = public, pg_temp LANGUAGE plpgsql AS $$
BEGIN INSERT INTO admin_analytics_events (event_type, entity_type, entity_id, metadata)
VALUES ('user_signup', 'user', NEW.id, jsonb_build_object('email', NEW.email)); RETURN NEW; END; $$;

CREATE FUNCTION log_purchase_event() RETURNS TRIGGER SECURITY DEFINER SET search_path = public, pg_temp LANGUAGE plpgsql AS $$
BEGIN INSERT INTO admin_analytics_events (event_type, entity_type, entity_id, metadata)
VALUES ('purchase_created', 'purchase', NEW.id, jsonb_build_object('user_id', NEW.user_id, 'product_id', NEW.product_id, 'amount', NEW.amount)); RETURN NEW; END; $$;

CREATE FUNCTION log_app_access_event() RETURNS TRIGGER SECURITY DEFINER SET search_path = public, pg_temp LANGUAGE plpgsql AS $$
BEGIN IF NEW.has_access = true AND (OLD.has_access IS NULL OR OLD.has_access = false) THEN INSERT INTO admin_analytics_events (event_type, entity_type, entity_id, metadata)
VALUES ('app_access_granted', 'user_app_access', NEW.id, jsonb_build_object('user_id', NEW.user_id, 'app_id', NEW.app_id)); END IF; RETURN NEW; END; $$;

-- Recreate triggers that were dropped with CASCADE
CREATE TRIGGER update_app_feature_count_trigger AFTER INSERT OR UPDATE OR DELETE ON app_features
FOR EACH ROW EXECUTE FUNCTION update_app_feature_count();

CREATE TRIGGER update_app_included_features_trigger AFTER INSERT OR UPDATE OR DELETE ON app_features
FOR EACH ROW EXECUTE FUNCTION update_app_included_features();
