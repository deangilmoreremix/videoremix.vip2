-- Migration: Add AI App Usage Tracking
-- Creates tables and functions for tracking AI app usage per user

-- Table to track AI app runs per user
CREATE TABLE IF NOT EXISTS ai_app_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  app_slug TEXT NOT NULL,
  tokens_used INTEGER DEFAULT 0,
  run_timestamp TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for efficient querying
CREATE INDEX IF NOT EXISTS idx_ai_app_usage_user_id ON ai_app_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_app_usage_run_timestamp ON ai_app_usage(run_timestamp);

-- Function to get usage count for a user in current billing period
CREATE OR REPLACE FUNCTION get_ai_app_usage(user_uuid UUID)
RETURNS TABLE(used_count BIGINT, period_start TIMESTAMPTZ, period_end TIMESTAMPTZ) AS $$
DECLARE
  period_start_val TIMESTAMPTZ;
  period_end_val TIMESTAMPTZ;
BEGIN
  -- Monthly reset - first day of current month to first day of next month
  period_start_val := date_trunc('month', now());
  period_end_val := date_trunc('month', now()) + INTERVAL '1 month';

  RETURN QUERY
  SELECT COUNT(*), period_start_val, period_end_val
  FROM ai_app_usage
  WHERE user_id = user_uuid
    AND run_timestamp >= period_start_val
    AND run_timestamp < period_end_val;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to record an AI app run
CREATE OR REPLACE FUNCTION record_ai_app_run(
  user_uuid UUID,
  app_slug TEXT,
  tokens INTEGER DEFAULT 0
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO ai_app_usage (user_id, app_slug, tokens_used)
  VALUES (user_uuid, app_slug, tokens);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get remaining runs for a user (assuming 100 per month limit)
CREATE OR REPLACE FUNCTION get_ai_app_remaining_runs(user_uuid UUID, max_runs INTEGER DEFAULT 100)
RETURNS INTEGER AS $$
DECLARE
  used_count INTEGER;
BEGIN
  used_count := (
    SELECT COUNT(*)::INTEGER
    FROM ai_app_usage
    WHERE user_id = user_uuid
      AND run_timestamp >= date_trunc('month', now())
      AND run_timestamp < date_trunc('month', now()) + INTERVAL '1 month'
  );

  RETURN max_runs - used_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;