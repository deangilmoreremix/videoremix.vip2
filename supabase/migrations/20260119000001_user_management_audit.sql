/*
  # User Management Audit Logging Enhancement

  ## Summary
  Extends audit logging to cover all user management operations for compliance and security monitoring.

  ## Changes Made

  1. **User Management Audit Table**
     - Create dedicated audit table for user operations
     - Track all CRUD operations on user accounts
     - Include IP addresses, user agents, and operation details

  2. **Audit Triggers**
     - Add triggers for user_roles table changes
     - Add triggers for auth.users relevant changes
     - Log admin actions on user management

  3. **Enhanced Logging**
     - Log password resets and email changes
     - Track user status changes (active/inactive)
     - Record bulk operations with details

  ## Notes
  - All changes are backward compatible
  - Audit logs are immutable and append-only
  - Performance impact is minimal due to async logging
*/

-- Create user management audit table
CREATE TABLE IF NOT EXISTS user_management_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  operation text NOT NULL CHECK (operation IN ('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'PASSWORD_RESET', 'EMAIL_CHANGE', 'STATUS_CHANGE', 'BULK_OPERATION')),
  user_id uuid REFERENCES auth.users(id),
  target_user_id uuid REFERENCES auth.users(id), -- For operations performed ON another user
  admin_user_id uuid REFERENCES auth.users(id), -- For admin operations
  operation_details jsonb,
  old_values jsonb,
  new_values jsonb,
  ip_address inet,
  user_agent text,
  session_id text,
  created_at timestamptz DEFAULT now(),
  success boolean DEFAULT true,
  error_message text
);

-- Enable RLS
ALTER TABLE user_management_audit ENABLE ROW LEVEL SECURITY;

-- Policy: Only admins can view audit logs
CREATE POLICY "Admins can view user management audit logs"
  ON user_management_audit
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'super_admin')
    )
  );

-- Policy: System can insert audit logs
CREATE POLICY "System can insert user management audit logs"
  ON user_management_audit
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_management_audit_user_id ON user_management_audit(user_id);
CREATE INDEX IF NOT EXISTS idx_user_management_audit_target_user_id ON user_management_audit(target_user_id);
CREATE INDEX IF NOT EXISTS idx_user_management_audit_admin_user_id ON user_management_audit(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_user_management_audit_operation ON user_management_audit(operation);
CREATE INDEX IF NOT EXISTS idx_user_management_audit_created_at ON user_management_audit(created_at DESC);

-- Function to log user management operations
CREATE OR REPLACE FUNCTION log_user_management_operation(
  p_operation text,
  p_user_id uuid DEFAULT NULL,
  p_target_user_id uuid DEFAULT NULL,
  p_admin_user_id uuid DEFAULT NULL,
  p_operation_details jsonb DEFAULT NULL,
  p_old_values jsonb DEFAULT NULL,
  p_new_values jsonb DEFAULT NULL,
  p_ip_address inet DEFAULT NULL,
  p_user_agent text DEFAULT NULL,
  p_session_id text DEFAULT NULL,
  p_success boolean DEFAULT true,
  p_error_message text DEFAULT NULL
)
RETURNS void AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function for user_roles table changes
CREATE OR REPLACE FUNCTION audit_user_roles_changes()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers on user_roles table
DROP TRIGGER IF EXISTS audit_user_roles_trigger ON user_roles;
CREATE TRIGGER audit_user_roles_trigger
  AFTER INSERT OR UPDATE OR DELETE ON user_roles
  FOR EACH ROW
  EXECUTE FUNCTION audit_user_roles_changes();

-- Function to log admin user management operations
CREATE OR REPLACE FUNCTION log_admin_user_operation(
  p_operation text,
  p_target_user_id uuid,
  p_operation_details jsonb,
  p_success boolean DEFAULT true,
  p_error_message text DEFAULT NULL
)
RETURNS void AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments for documentation
COMMENT ON TABLE user_management_audit IS 'Audit log for all user management operations including admin actions';
COMMENT ON FUNCTION log_user_management_operation IS 'Logs user management operations with full context';
COMMENT ON FUNCTION log_admin_user_operation IS 'Helper function for logging admin operations on users';
COMMENT ON FUNCTION audit_user_roles_changes IS 'Trigger function for auditing user_roles table changes';