-- Create audit_log table for tracking admin actions
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  admin_id UUID REFERENCES auth.users NOT NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  details JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_admin_id ON audit_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_resource_type ON audit_log(resource_type);

-- Enable RLS
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Policy: Only admins can read audit logs
CREATE POLICY "admins_read_audit_log" ON audit_log
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'super_admin')
    )
  );

-- Policy: Service role can insert audit logs
CREATE POLICY "service_insert_audit_log" ON audit_log
  FOR INSERT
  TO service_role
  USING (true);

-- Function to log admin actions
CREATE OR REPLACE FUNCTION log_admin_action(
  target_user_id UUID,
  admin_user_id UUID,
  action_text TEXT,
  resource_type_text TEXT,
  resource_id_text TEXT DEFAULT NULL,
  details_json JSONB DEFAULT NULL
) RETURNS void AS $$
BEGIN
  INSERT INTO audit_log (
    user_id,
    admin_id,
    action,
    resource_type,
    resource_id,
    details
  ) VALUES (
    target_user_id,
    admin_user_id,
    action_text,
    resource_type_text,
    resource_id_text,
    details_json
  );
EXCEPTION WHEN OTHERS THEN
  -- Silently fail if audit_log doesn't exist or other error
  RAISE WARNING 'Failed to log admin action: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;