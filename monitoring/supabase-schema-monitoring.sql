-- Monitoring Infrastructure Database Schema
-- For VideoRemix VIP2 Production Monitoring

-- ============================================
-- 1. OPENAI COST TRACKING
-- ============================================

CREATE TABLE IF NOT EXISTS openai_daily_costs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_cost_cents INTEGER NOT NULL DEFAULT 0,
  request_count INTEGER NOT NULL DEFAULT 0,
  tokens_input INTEGER NOT NULL DEFAULT 0,
  tokens_output INTEGER NOT NULL DEFAULT 0,
  model_breakdown JSONB DEFAULT '{}',  -- {"gpt-4o": {"cost": 500, "tokens": 50000}, ...}
  threshold_exceeded BOOLEAN DEFAULT false,
  daily_threshold_cents INTEGER DEFAULT 5000,  -- $50 in cents
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(date)
);

CREATE INDEX idx_openai_daily_costs_date ON openai_daily_costs(date DESC);

CREATE TABLE IF NOT EXISTS openai_monthly_costs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  month TEXT NOT NULL,  -- Format: YYYY-MM
  total_cost_cents INTEGER NOT NULL DEFAULT 0,
  request_count INTEGER NOT NULL DEFAULT 0,
  tokens_input INTEGER NOT NULL DEFAULT 0,
  tokens_output INTEGER NOT NULL DEFAULT 0,
  daily_average_cents INTEGER,
  projected_end_of_month_cents INTEGER,
  threshold_exceeded BOOLEAN DEFAULT false,
  monthly_threshold_cents INTEGER DEFAULT 100000,  -- $1000 in cents
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(month)
);

CREATE INDEX idx_openai_monthly_costs_month ON openai_monthly_costs(month DESC);

-- ============================================
-- 2. API USAGE LOGS
-- ============================================

CREATE TABLE IF NOT EXISTS api_usage_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  application TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  status_code INTEGER NOT NULL,
  duration_ms INTEGER NOT NULL,
  tokens_used INTEGER,
  cost_cents INTEGER DEFAULT 0,
  model TEXT,
  request_body JSONB DEFAULT '{}',
  response_size_bytes INTEGER,
  user_agent TEXT,
  ip_address INET,
  session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_api_usage_logs_user_id ON api_usage_logs(user_id);
CREATE INDEX idx_api_usage_logs_created_at ON api_usage_logs(created_at DESC);
CREATE INDEX idx_api_usage_logs_endpoint ON api_usage_logs(endpoint, status_code);
CREATE INDEX idx_api_usage_logs_application ON api_usage_logs(application, created_at DESC);

-- Partition by date (monthly partitions)
CREATE TABLE IF NOT EXISTS api_usage_logs_2026_05 PARTITION OF api_usage_logs
FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');

-- ============================================
-- 3. ERROR LOGS
-- ============================================

CREATE TABLE IF NOT EXISTS error_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  level TEXT NOT NULL CHECK (level IN ('error', 'warn', 'info', 'debug', 'critical')),
  service TEXT NOT NULL,
  message TEXT NOT NULL,
  stack_trace TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  request_id TEXT,
  path TEXT,
  method TEXT,
  component TEXT,
  error_code TEXT,
  error_type TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_error_logs_level ON error_logs(level, created_at DESC);
CREATE INDEX idx_error_logs_service ON error_logs(service, created_at DESC);
CREATE INDEX idx_error_logs_user_id ON error_logs(user_id);
CREATE INDEX idx_error_logs_request_id ON error_logs(request_id);
CREATE INDEX idx_error_logs_component ON error_logs(component);

-- ============================================
-- 4. HEALTH CHECK HISTORY
-- ============================================

CREATE TABLE IF NOT EXISTS health_check_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  service_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('healthy', 'degraded', 'unhealthy')),
  latency_ms INTEGER,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_health_check_history_service ON health_check_history(service_name, created_at DESC);
CREATE INDEX idx_health_check_history_status ON health_check_history(status, created_at DESC);

-- ============================================
-- 5. PERFORMANCE METRICS
-- ============================================

CREATE TABLE IF NOT EXISTS performance_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  metric_name TEXT NOT NULL,
  metric_value NUMERIC NOT NULL,
  labels JSONB DEFAULT '{}',
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  application TEXT,
  endpoint TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_performance_metrics_name ON performance_metrics(metric_name, created_at DESC);
CREATE INDEX idx_performance_metrics_application ON performance_metrics(application, created_at DESC);

-- ============================================
-- 6. ALERT HISTORY
-- ============================================

CREATE TABLE IF NOT EXISTS alert_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  alert_name TEXT NOT NULL,
  severity TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('firing', 'resolved')),
  labels JSONB DEFAULT '{}',
  annotations JSONB DEFAULT '{}',
  started_at TIMESTAMPTZ NOT NULL,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_alert_history_name ON alert_history(alert_name, started_at DESC);
CREATE INDEX idx_alert_history_status ON alert_history(status, started_at DESC);
CREATE INDEX idx_alert_history_severity ON alert_history(severity);

-- ============================================
-- 7. BUSINESS METRICS
-- ============================================

CREATE TABLE IF NOT EXISTS business_metrics_daily (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  active_users INTEGER NOT NULL DEFAULT 0,
  new_users INTEGER NOT NULL DEFAULT 0,
  total_sessions INTEGER NOT NULL DEFAULT 0,
  total_purchases INTEGER NOT NULL DEFAULT 0,
  total_revenue_cents INTEGER NOT NULL DEFAULT 0,
  total_app_launches INTEGER NOT NULL DEFAULT 0,
  video_processed_count INTEGER NOT NULL DEFAULT 0,
  thumbnail_generated_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(date)
);

CREATE INDEX idx_business_metrics_daily_date ON business_metrics_daily(date DESC);

-- Daily breakdown by app
CREATE TABLE IF NOT EXISTS app_usage_daily (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  app_id TEXT NOT NULL,
  app_name TEXT NOT NULL,
  category TEXT,
  launch_count INTEGER NOT NULL DEFAULT 0,
  unique_users INTEGER NOT NULL DEFAULT 0,
  avg_session_duration_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(date, app_id)
);

CREATE INDEX idx_app_usage_daily_date ON app_usage_daily(date DESC);
CREATE INDEX idx_app_usage_daily_app ON app_usage_daily(app_id);

-- ============================================
-- 8. LOGS ARCHIVAL (for S3 backup)
-- ============================================

CREATE TABLE IF NOT EXISTS logs_archival (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  archive_date DATE NOT NULL DEFAULT CURRENT_DATE,
  s3_path TEXT NOT NULL,
  file_size_bytes BIGINT NOT NULL,
  log_count INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'uploaded', 'verified', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_logs_archival_date ON logs_archival(archive_date DESC);
CREATE INDEX idx_logs_archival_status ON logs_archival(status);

-- ============================================
-- 9. COST ANOMALIES
-- ============================================

CREATE TABLE IF NOT EXISTS cost_anomalies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  anomaly_date DATE NOT NULL,
  detected_at TIMESTAMPTZ DEFAULT NOW(),
  period TEXT NOT NULL,  -- 'daily' or 'monthly'
  current_cost_cents INTEGER NOT NULL,
  baseline_cost_cents INTEGER NOT NULL,
  anomaly_factor NUMERIC NOT NULL,  -- current / baseline ratio
  threshold_cents INTEGER NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('warning', 'critical', 'info')),
  metadata JSONB DEFAULT '{}',
  acknowledged BOOLEAN DEFAULT false,
  acknowledged_by UUID REFERENCES auth.users(id),
  acknowledged_at TIMESTAMPTZ
);

CREATE INDEX idx_cost_anomalies_date ON cost_anomalies(anomaly_date DESC);
CREATE INDEX idx_cost_anomalies_severity ON cost_anomalies(severity, acknowledged);

-- ============================================
-- 10. ALERT NOTIFICATIONS
-- ============================================

CREATE TABLE IF NOT EXISTS alert_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  alert_id TEXT NOT NULL,
  alert_name TEXT NOT NULL,
  severity TEXT NOT NULL,
  status TEXT NOT NULL,  -- 'sent', 'delivered', 'failed'
  channel TEXT NOT NULL,  -- 'slack', 'email', 'pagerduty'
  recipient TEXT,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  delivered_at TIMESTAMPTZ,
  error_message TEXT,
  payload JSONB DEFAULT '{}'
);

CREATE INDEX idx_alert_notifications_alert_id ON alert_notifications(alert_id);
CREATE INDEX idx_alert_notifications_sent_at ON alert_notifications(sent_at DESC);
CREATE INDEX idx_alert_notifications_channel ON alert_notifications(channel, status);

-- ============================================
-- 11. AUTOMATED REPORT HISTORY
-- ============================================

CREATE TABLE IF NOT EXISTS reports_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  report_type TEXT NOT NULL CHECK (report_type IN ('daily', 'weekly', 'monthly')),
  report_date DATE NOT NULL,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  file_path TEXT,
  file_size_bytes BIGINT,
  recipients TEXT[] DEFAULT '{}',
  delivery_status TEXT NOT NULL CHECK (delivery_status IN ('pending', 'sent', 'failed')),
  summary JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reports_history_type_date ON reports_history(report_type, report_date DESC);

-- ============================================
-- 12. METRICS BACKFILL LOG (for tracking data migrations)
-- ============================================

CREATE TABLE IF NOT EXISTS metrics_backfill_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  metric_name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
  records_processed INTEGER DEFAULT 0,
  records_failed INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_metrics_backfill_log_metric ON metrics_backfill_log(metric_name, status);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to tables with updated_at
CREATE TRIGGER update_openai_daily_costs_updated_at
    BEFORE UPDATE ON openai_daily_costs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_openai_monthly_costs_updated_at
    BEFORE UPDATE ON openai_monthly_costs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_business_metrics_daily_updated_at
    BEFORE UPDATE ON business_metrics_daily
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert daily cost record if not exists
CREATE OR REPLACE FUNCTION ensure_daily_cost_record(target_date DATE DEFAULT CURRENT_DATE)
RETURNS UUID AS $$
DECLARE
  record_id UUID;
BEGIN
  INSERT INTO openai_daily_costs (date, total_cost_cents, request_count)
  VALUES (target_date, 0, 0)
  ON CONFLICT (date) DO NOTHING
  RETURNING id INTO record_id;

  IF record_id IS NULL THEN
    SELECT id INTO record_id FROM openai_daily_costs WHERE date = target_date;
  END IF;

  RETURN record_id;
END;
$$ LANGUAGE plpgsql;

-- Aggregate daily costs from api_usage_logs
CREATE OR REPLACE FUNCTION aggregate_daily_costs(target_date DATE DEFAULT CURRENT_DATE)
RETURNS VOID AS $$
DECLARE
  cost_record_id UUID;
  daily_aggregate RECORD;
BEGIN
  -- Ensure record exists
  SELECT ensure_daily_cost_record(target_date) INTO cost_record_id;

  -- Aggregate from usage logs
  SELECT
    COUNT(*) as req_count,
    COALESCE(SUM(tokens_used), 0) as total_tokens,
    COALESCE(SUM(cost_cents), 0) as total_cost,
    jsonb_object_agg(model, jsonb_build_object(
      'cost', COALESCE(SUM(cost_cents), 0),
      'tokens', COALESCE(SUM(tokens_used), 0),
      'requests', COUNT(*)
    )) as model_data
  INTO daily_aggregate
  FROM api_usage_logs
  WHERE DATE(created_at) = target_date;

  -- Update daily costs
  UPDATE openai_daily_costs
  SET
    request_count = COALESCE(daily_aggregate.req_count, 0),
    total_cost_cents = COALESCE(daily_aggregate.total_cost, 0),
    tokens_input = COALESCE(daily_aggregate.total_tokens, 0),  -- Simplified
    tokens_output = 0,  -- Would need separate tracking
    model_breakdown = COALESCE(daily_aggregate.model_data, '{}'::jsonb),
    threshold_exceeded = (COALESCE(daily_aggregate.total_cost, 0) > daily_threshold_cents)
  WHERE date = target_date;

  -- Also update monthly
  PERFORM aggregate_monthly_costs(TO_CHAR(target_date, 'YYYY-MM'));
END;
$$ LANGUAGE plpgsql;

-- Aggregate monthly costs
CREATE OR REPLACE FUNCTION aggregate_monthly_costs(target_month TEXT DEFAULT TO_CHAR(CURRENT_DATE, 'YYYY-MM'))
RETURNS VOID AS $$
DECLARE
  start_date DATE;
  end_date DATE;
  monthly_aggregate RECORD;
BEGIN
  start_date := target_month || '-01';
  end_date := (start_date + INTERVAL '1 month')::DATE;

  -- Aggregate from daily costs
  SELECT
    SUM(total_cost_cents) as total_cost,
    SUM(request_count) as total_requests,
    SUM(tokens_input) as total_tokens_input,
    SUM(tokens_output) as total_tokens_output,
    AVG(total_cost_cents) as daily_average
  INTO monthly_aggregate
  FROM openai_daily_costs
  WHERE date >= start_date AND date < end_date;

  -- Upsert monthly record
  INSERT INTO openai_monthly_costs (
    month, total_cost_cents, request_count,
    tokens_input, tokens_output, daily_average_cents,
    threshold_exceeded
  ) VALUES (
    target_month,
    COALESCE(monthly_aggregate.total_cost, 0),
    COALESCE(monthly_aggregate.total_requests, 0),
    COALESCE(monthly_aggregate.total_tokens_input, 0),
    COALESCE(monthly_aggregate.total_tokens_output, 0),
    COALESCE(monthly_aggregate.daily_average, 0),
    COALESCE(monthly_aggregate.total_cost, 0) > monthly_threshold_cents
  )
  ON CONFLICT (month) DO UPDATE SET
    total_cost_cents = EXCLUDED.total_cost_cents,
    request_count = EXCLUDED.request_count,
    tokens_input = EXCLUDED.tokens_input,
    tokens_output = EXCLUDED.tokens_output,
    daily_average_cents = EXCLUDED.daily_average_cents,
    threshold_exceeded = EXCLUDED.threshold_exceeded,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE openai_daily_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE openai_monthly_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_check_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_metrics_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_usage_daily ENABLE ROW LEVEL SECURITY;

-- Service role can access everything (for monitoring services)
CREATE POLICY "Service role full access" ON openai_daily_costs
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access" ON openai_monthly_costs
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access" ON api_usage_logs
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access" ON error_logs
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access" ON health_check_history
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access" ON performance_metrics
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access" ON alert_history
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access" ON business_metrics_daily
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access" ON app_usage_daily
  FOR ALL USING (auth.role() = 'service_role');

-- Read access for authenticated users on business metrics (aggregated only)
CREATE POLICY "Authenticated read business metrics" ON business_metrics_daily
  FOR SELECT USING (auth.role() = 'authenticated');

-- Users can see their own usage
CREATE POLICY "Users view own api usage" ON api_usage_logs
  FOR SELECT USING (
    auth.role() = 'authenticated' AND
    user_id = auth.uid()
  );

-- Users can see their own errors
CREATE POLICY "Users view own errors" ON error_logs
  FOR SELECT USING (
    auth.role() = 'authenticated' AND
    user_id = auth.uid()
  );

-- Admins can view all
CREATE POLICY "Admins view all logs" ON api_usage_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins view all errors" ON error_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- FUNCTIONS FOR MONITORING QUERIES
-- ============================================

-- Get current OpenAI costs
CREATE OR REPLACE FUNCTION get_current_openai_costs()
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'daily', jsonb_build_object(
      'cost_cents', COALESCE(SUM(total_cost_cents), 0),
      'requests', COALESCE(SUM(request_count), 0),
      'threshold_exceeded', BOOL_OR(threshold_exceeded)
    ),
    'monthly', jsonb_build_object(
      'cost_cents', COALESCE(SUM(total_cost_cents), 0),
      'requests', COALESCE(SUM(request_count), 0),
      'threshold_exceeded', BOOL_OR(threshold_exceeded)
    )
  ) INTO result
  FROM (
    SELECT * FROM openai_daily_costs
    WHERE date = CURRENT_DATE
    UNION ALL
    SELECT * FROM openai_monthly_costs
    WHERE month = TO_CHAR(CURRENT_DATE, 'YYYY-MM')
  ) costs;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get top consuming applications (last 24h)
CREATE OR REPLACE FUNCTION get_top_consuming_apps(limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
  application TEXT,
  total_requests BIGINT,
  total_tokens BIGINT,
  total_cost_cents BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    application,
    COUNT(*)::BIGINT as total_requests,
    COALESCE(SUM(tokens_used), 0)::BIGINT as total_tokens,
    COALESCE(SUM(cost_cents), 0)::BIGINT as total_cost_cents
  FROM api_usage_logs
  WHERE created_at >= NOW() - INTERVAL '24 hours'
  GROUP BY application
  ORDER BY total_cost_cents DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get error summary
CREATE OR REPLACE FUNCTION get_error_summary(time_window INTERVAL DEFAULT '1 hour')
RETURNS TABLE (
  level TEXT,
  service TEXT,
  error_count BIGINT,
  last_occurrence TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    level,
    service,
    COUNT(*)::BIGINT as error_count,
    MAX(created_at) as last_occurrence
  FROM error_logs
  WHERE created_at >= NOW() - time_window
  GROUP BY level, service
  ORDER BY error_count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Clean up old data (older than retention period)
CREATE OR REPLACE FUNCTION cleanup_old_metrics(retention_days INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete old api_usage_logs
  DELETE FROM api_usage_logs
  WHERE created_at < NOW() - (retention_days || ' days')::INTERVAL;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  -- Delete old error logs (keep longer? 90 days)
  DELETE FROM error_logs
  WHERE created_at < NOW() - (retention_days || ' days')::INTERVAL
    AND level NOT IN ('error', 'critical');  -- Keep errors longer

  -- Delete old performance metrics
  DELETE FROM performance_metrics
  WHERE created_at < NOW() - (retention_days || ' days')::INTERVAL;

  -- Delete old health check history
  DELETE FROM health_check_history
  WHERE created_at < NOW() - (retention_days || ' days')::INTERVAL;

  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- SCHEDULE CLEANUP (Requires pg_cron extension)
-- ============================================

-- Enable extension if available
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule daily cost aggregation at midnight
SELECT cron.schedule(
  'aggregate-daily-costs',
  '0 0 * * *',
  'SELECT aggregate_daily_costs(CURRENT_DATE - INTERVAL ''1 day'');'
);

-- Schedule monthly cost aggregation on 1st
SELECT cron.schedule(
  'aggregate-monthly-costs',
  '0 2 1 * *',
  'SELECT aggregate_monthly_costs(TO_CHAR(CURRENT_DATE - INTERVAL ''1 month'', ''YYYY-MM''));'
);

-- Schedule cleanup of old metrics (weekly on Sunday)
SELECT cron.schedule(
  'cleanup-old-metrics',
  '0 3 * * 0',
  'SELECT cleanup_old_metrics(90);'
);

-- ============================================
-- VIEWS FOR DASHBOARDS
-- ============================================

-- Real-time cost view
CREATE OR REPLACE VIEW current_cost_overview AS
SELECT
  CURRENT_DATE as date,
  COALESCE(d.total_cost_cents, 0) as daily_cost_cents,
  COALESCE(d.threshold_exceeded, false) as daily_threshold_exceeded,
  COALESCE(m.total_cost_cents, 0) as monthly_cost_cents,
  COALESCE(m.threshold_exceeded, false) as monthly_threshold_exceeded,
  LEAST(
    (COALESCE(d.total_cost_cents, 0) / NULLIF(d.daily_threshold_cents, 0)) * 100,
    200
  ) as daily_utilization_percent,
  LEAST(
    (COALESCE(m.total_cost_cents, 0) / NULLIF(m.monthly_threshold_cents, 0)) * 100,
    200
  ) as monthly_utilization_percent
FROM
  (SELECT * FROM openai_daily_costs WHERE date = CURRENT_DATE) d
FULL OUTER JOIN
  (SELECT * FROM openai_monthly_costs WHERE month = TO_CHAR(CURRENT_DATE, 'YYYY-MM')) m
ON TRUE;

-- Error rate by service (last 15 minutes)
CREATE OR REPLACE VIEW recent_error_rates AS
SELECT
  service,
  level,
  COUNT(*) as error_count,
  NOW() - MIN(created_at) as oldest_error_age
FROM error_logs
WHERE created_at >= NOW() - INTERVAL '15 minutes'
GROUP BY service, level
ORDER BY error_count DESC;

-- Active alert summary
CREATE OR REPLACE VIEW active_alerts_summary AS
SELECT
  alert_name,
  severity,
  COUNT(*) as active_count,
  MIN(started_at) as oldest_alert
FROM alert_history
WHERE status = 'firing' AND resolved_at IS NULL
GROUP BY alert_name, severity
ORDER BY active_count DESC;

-- ============================================
-- GRANTS FOR SERVICE ROLE
-- ============================================

GRANT USAGE ON SCHEMA public TO service_role;

GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- Specific SELECT grants for read-only monitoring users
-- CREATE ROLE monitoring_readonly;
-- GRANT CONNECT ON DATABASE postgres TO monitoring_readonly;
-- GRANT USAGE ON SCHEMA public TO monitoring_readonly;
-- GRANT SELECT ON ALL TABLES IN SCHEMA public TO monitoring_readonly;

-- ============================================
-- INSERT SAMPLE DATA (for testing)
-- ============================================

-- This would be populated by actual monitoring services
