/*
  # Create Admin Analytics System
  
  1. New Tables
    - `admin_analytics_events` - Track all admin actions and user events
    - `daily_analytics_snapshots` - Daily aggregated stats
    - `app_usage_analytics` - Detailed app usage metrics
    - `revenue_analytics` - Purchase and revenue tracking
    
  2. Analytics Events Table
    - Tracks: user signups, logins, purchases, app access, admin actions
    - Includes: timestamps, user_id, event_type, metadata
    - Enables: real-time dashboards, trend analysis, custom reports
    
  3. Daily Snapshots
    - Automated daily aggregation of key metrics
    - Tracks: user count, active users, revenue, app access
    - Enables: historical trend analysis, YoY comparisons
    
  4. App Usage Analytics
    - Per-app usage metrics
    - Tracks: views, unique users, time spent, feature usage
    - Enables: app performance comparison, engagement metrics
    
  5. Revenue Analytics
    - Purchase tracking with product details
    - Tracks: transactions, revenue, refunds, subscriptions
    - Enables: revenue reports, product performance, churn analysis
    
  6. Security
    - Enable RLS on all tables
    - Only super_admin and admin roles can view analytics
    - Separate policies for reading and writing
    - Audit trail for all data changes
*/

-- Create analytics events table
CREATE TABLE IF NOT EXISTS admin_analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL CHECK (event_type IN (
    'user_signup', 'user_login', 'user_logout',
    'purchase_completed', 'purchase_refunded',
    'app_access_granted', 'app_access_revoked',
    'subscription_started', 'subscription_cancelled', 'subscription_renewed',
    'admin_action', 'import_completed', 'video_uploaded',
    'feature_enabled', 'feature_disabled'
  )),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  admin_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  entity_type text,
  entity_id uuid,
  metadata jsonb DEFAULT '{}'::jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_analytics_events_event_type ON admin_analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON admin_analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON admin_analytics_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_entity ON admin_analytics_events(entity_type, entity_id);

-- Create daily snapshots table
CREATE TABLE IF NOT EXISTS daily_analytics_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_date date NOT NULL UNIQUE,
  total_users integer DEFAULT 0,
  active_users integer DEFAULT 0,
  new_users integer DEFAULT 0,
  total_apps integer DEFAULT 0,
  active_apps integer DEFAULT 0,
  total_purchases integer DEFAULT 0,
  revenue_usd numeric DEFAULT 0,
  active_subscriptions integer DEFAULT 0,
  cancelled_subscriptions integer DEFAULT 0,
  app_access_grants integer DEFAULT 0,
  feature_usage_events integer DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_daily_snapshots_date ON daily_analytics_snapshots(snapshot_date DESC);

-- Create app usage analytics table
CREATE TABLE IF NOT EXISTS app_usage_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  app_slug text NOT NULL,
  date date NOT NULL,
  total_views integer DEFAULT 0,
  unique_users integer DEFAULT 0,
  avg_session_duration interval,
  bounce_rate numeric DEFAULT 0,
  feature_interactions integer DEFAULT 0,
  error_count integer DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(app_slug, date)
);

CREATE INDEX IF NOT EXISTS idx_app_usage_app_slug ON app_usage_analytics(app_slug);
CREATE INDEX IF NOT EXISTS idx_app_usage_date ON app_usage_analytics(date DESC);

-- Create revenue analytics table
CREATE TABLE IF NOT EXISTS revenue_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  platform text NOT NULL CHECK (platform IN ('paykickstart', 'stripe', 'zaxxa', 'manual')),
  product_id uuid REFERENCES products_catalog(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  transaction_count integer DEFAULT 0,
  total_revenue numeric DEFAULT 0,
  refund_count integer DEFAULT 0,
  refund_amount numeric DEFAULT 0,
  net_revenue numeric DEFAULT 0,
  avg_transaction_value numeric DEFAULT 0,
  new_customers integer DEFAULT 0,
  returning_customers integer DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(date, platform, product_id)
);

CREATE INDEX IF NOT EXISTS idx_revenue_date ON revenue_analytics(date DESC);
CREATE INDEX IF NOT EXISTS idx_revenue_platform ON revenue_analytics(platform);
CREATE INDEX IF NOT EXISTS idx_revenue_product ON revenue_analytics(product_id);

-- Enable RLS
ALTER TABLE admin_analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_analytics_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_usage_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_analytics ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for analytics events
CREATE POLICY "Admins can view analytics events"
  ON admin_analytics_events FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "System can insert analytics events"
  ON admin_analytics_events FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create RLS policies for daily snapshots
CREATE POLICY "Admins can view daily snapshots"
  ON daily_analytics_snapshots FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "System can manage daily snapshots"
  ON daily_analytics_snapshots FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('super_admin', 'admin')
    )
  );

-- Create RLS policies for app usage analytics
CREATE POLICY "Admins can view app usage"
  ON app_usage_analytics FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "System can manage app usage"
  ON app_usage_analytics FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('super_admin', 'admin')
    )
  );

-- Create RLS policies for revenue analytics
CREATE POLICY "Admins can view revenue"
  ON revenue_analytics FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "System can manage revenue"
  ON revenue_analytics FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('super_admin', 'admin')
    )
  );

-- Create function to log analytics events
CREATE OR REPLACE FUNCTION log_analytics_event(
  p_event_type text,
  p_user_id uuid DEFAULT NULL,
  p_admin_id uuid DEFAULT NULL,
  p_entity_type text DEFAULT NULL,
  p_entity_id uuid DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb
) RETURNS uuid AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to generate daily snapshot
CREATE OR REPLACE FUNCTION generate_daily_snapshot(p_date date DEFAULT CURRENT_DATE)
RETURNS void AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to log user signups
CREATE OR REPLACE FUNCTION log_user_signup()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM log_analytics_event('user_signup', NEW.user_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_log_user_signup
AFTER INSERT ON user_roles
FOR EACH ROW
EXECUTE FUNCTION log_user_signup();

-- Create trigger to log purchases
CREATE OR REPLACE FUNCTION log_purchase_event()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD IS NULL OR OLD.status != 'completed') THEN
    PERFORM log_analytics_event(
      'purchase_completed',
      NEW.user_id,
      NULL,
      'purchase',
      NEW.id,
      jsonb_build_object(
        'product_name', NEW.product_name,
        'amount', NEW.amount,
        'platform', NEW.platform
      )
    );
  ELSIF NEW.status = 'refunded' AND (OLD IS NULL OR OLD.status != 'refunded') THEN
    PERFORM log_analytics_event(
      'purchase_refunded',
      NEW.user_id,
      NULL,
      'purchase',
      NEW.id,
      jsonb_build_object(
        'product_name', NEW.product_name,
        'amount', NEW.amount,
        'platform', NEW.platform
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_log_purchase
AFTER INSERT OR UPDATE ON purchases
FOR EACH ROW
EXECUTE FUNCTION log_purchase_event();

-- Create trigger to log app access changes
CREATE OR REPLACE FUNCTION log_app_access_event()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_active = true AND (OLD IS NULL OR OLD.is_active = false) THEN
    PERFORM log_analytics_event(
      'app_access_granted',
      NEW.user_id,
      NULL,
      'app_access',
      NEW.id,
      jsonb_build_object('app_slug', NEW.app_slug, 'access_type', NEW.access_type)
    );
  ELSIF NEW.is_active = false AND OLD.is_active = true THEN
    PERFORM log_analytics_event(
      'app_access_revoked',
      NEW.user_id,
      NULL,
      'app_access',
      NEW.id,
      jsonb_build_object('app_slug', NEW.app_slug)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_log_app_access
AFTER INSERT OR UPDATE ON user_app_access
FOR EACH ROW
EXECUTE FUNCTION log_app_access_event();

-- Generate initial snapshot for today
SELECT generate_daily_snapshot(CURRENT_DATE);
