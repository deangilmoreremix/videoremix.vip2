-- =============================================================================
-- RATE LIMITING AND ABUSE PREVENTION
-- 
-- Implement database-level rate limiting for critical operations
-- Prevents brute force attacks, spam, and abuse
-- =============================================================================

-- Create rate limit tracker table
CREATE TABLE IF NOT EXISTS rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier text NOT NULL, -- IP address, user_id, or operation key
  operation text NOT NULL, -- 'login', 'signup', 'password_reset', etc.
  count integer DEFAULT 1,
  window_start timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(identifier, operation, window_start)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_rate_limits_identifier_operation ON rate_limits(identifier, operation);
CREATE INDEX IF NOT EXISTS idx_rate_limits_window_start ON rate_limits(window_start);

-- Enable RLS
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- Only service role can modify rate limits
CREATE POLICY "Only service role can manage rate limits" ON rate_limits
  FOR ALL USING (false);

-- Rate limit check function
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_identifier text,
  p_operation text,
  p_max_requests integer DEFAULT 5,
  p_window_seconds integer DEFAULT 3600
) RETURNS boolean AS $$
DECLARE
  v_window_start timestamptz;
  v_current_count integer;
BEGIN
  -- Calculate window start time
  v_window_start := date_trunc('second', now()) - (p_window_seconds || ' seconds')::interval;
  
  -- Check current rate limit count
  SELECT count INTO v_current_count
  FROM rate_limits
  WHERE identifier = p_identifier
    AND operation = p_operation
    AND window_start >= v_window_start
  ORDER BY window_start DESC
  LIMIT 1;
  
  -- If over limit, return false
  IF v_current_count >= p_max_requests THEN
    RETURN false;
  END IF;
  
  -- Increment or insert rate limit record
  INSERT INTO rate_limits (identifier, operation, count, window_start)
  VALUES (p_identifier, p_operation, 1, date_trunc('second', now()))
  ON CONFLICT (identifier, operation, window_start)
  DO UPDATE SET 
    count = rate_limits.count + 1,
    updated_at = now();
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION check_rate_limit(text, text, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION check_rate_limit(text, text, integer, integer) TO anon;

-- Cleanup old rate limit records (run daily via cron)
CREATE OR REPLACE FUNCTION cleanup_rate_limits() RETURNS void AS $$
BEGIN
  DELETE FROM rate_limits WHERE window_start < now() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create audit log for failed login attempts
CREATE TABLE IF NOT EXISTS failed_logins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text,
  ip_address text,
  user_agent text,
  attempt_time timestamptz DEFAULT now(),
  failure_reason text
);

CREATE INDEX IF NOT EXISTS idx_failed_logins_email ON failed_logins(email);
CREATE INDEX IF NOT EXISTS idx_failed_logins_ip_address ON failed_logins(ip_address);
CREATE INDEX IF NOT EXISTS idx_failed_logins_attempt_time ON failed_logins(attempt_time);

ALTER TABLE failed_logins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view failed logins" ON failed_logins
  FOR SELECT USING (is_super_admin());

-- Function to log failed login
CREATE OR REPLACE FUNCTION log_failed_login(
  p_email text,
  p_ip_address text,
  p_user_agent text,
  p_reason text
) RETURNS void AS $$
BEGIN
  INSERT INTO failed_logins (email, ip_address, user_agent, failure_reason)
  VALUES (p_email, p_ip_address, p_user_agent, p_reason);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION log_failed_login(text, text, text, text) TO anon;
GRANT EXECUTE ON FUNCTION log_failed_login(text, text, text, text) TO authenticated;

SELECT 'Rate limiting and abuse prevention system implemented' as status;
