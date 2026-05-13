-- ============================================================================
-- CRITICAL SECURITY FIXES
-- ============================================================================
-- 1. Add FK constraint to profiles.user_id (fixes orphaned profiles)
-- ============================================================================

DO $$
BEGIN
  -- Check if constraint already exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'profiles_user_id_fkey' 
    AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles 
    ADD CONSTRAINT profiles_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    RAISE NOTICE 'Added FK constraint to profiles.user_id';
  ELSE
    RAISE NOTICE 'FK constraint already exists on profiles.user_id';
  END IF;
END $$;

-- ============================================================================
-- 2. Encrypt sensitive tokens in calendar_integrations table
-- ============================================================================

DO $$
BEGIN
  -- Add encrypted columns if they don't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'calendar_integrations' 
    AND column_name = 'access_token_encrypted'
  ) THEN
    ALTER TABLE public.calendar_integrations 
    ADD COLUMN access_token_encrypted bytea,
    ADD COLUMN refresh_token_encrypted bytea;
    RAISE NOTICE 'Added encrypted token columns to calendar_integrations';
  ELSE
    RAISE NOTICE 'Encrypted token columns already exist';
  END IF;
END $$;

-- NOTE: Data migration and column removal should be done separately
-- after verifying the encryption works

-- ============================================================================
-- 3. Add missing unique constraints for data integrity
-- ============================================================================

DO $$
BEGIN
  -- subscriptions table: unique on (user_id, stripe_subscription_id)
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'subscriptions_user_stripe_unique' 
    AND conrelid = 'public.subscriptions'::regclass
  ) THEN
    -- First remove duplicates if any
    DELETE FROM public.subscriptions a
    USING (
      SELECT MIN(ctid) as ctid, user_id, stripe_subscription_id
      FROM public.subscriptions
      GROUP BY user_id, stripe_subscription_id
      HAVING COUNT(*) > 1
    ) b
    WHERE a.user_id = b.user_id 
    AND a.stripe_subscription_id = b.stripe_subscription_id 
    AND a.ctid != b.ctid;
    
    ALTER TABLE public.subscriptions 
    ADD CONSTRAINT subscriptions_user_stripe_unique 
    UNIQUE (user_id, stripe_subscription_id);
    RAISE NOTICE 'Added unique constraint to subscriptions';
  ELSE
    RAISE NOTICE 'Unique constraint already exists on subscriptions';
  END IF;
END $$;

-- ============================================================================
-- 4. Fix search_path in SECURITY DEFINER functions
-- ============================================================================

-- Update the handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp  -- FIXED: added pg_temp
AS $$
DECLARE
  new_tenant_id uuid;
BEGIN
  -- Get or create tenant for the new user
  SELECT id INTO new_tenant_id FROM public.tenants WHERE slug = 'videoremix' LIMIT 1;
  
  IF new_tenant_id IS NULL THEN
    INSERT INTO public.tenants (name, slug, domain, is_active)
    VALUES ('VideoRemix', 'videoremix', 'videoremix.vip', true)
    RETURNING id INTO new_tenant_id;
  END IF;

  -- Create profile
  INSERT INTO public.profiles (id, tenant_id, email, role, is_tenant_admin)
  VALUES (
    NEW.id, 
    new_tenant_id, 
    NEW.email,
    'member',
    false
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Update audit_user_roles_changes function
CREATE OR REPLACE FUNCTION public.audit_user_roles_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp  -- FIXED: added pg_temp
AS $$
DECLARE
  admin_user_id uuid;
  operation_details jsonb;
BEGIN
  admin_user_id := auth.uid();
  
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
      NULL,
      NULL,
      NULL,
      NULL
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
      NULL,
      NULL
    );
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$;

RAISE NOTICE 'Fixed search_path in SECURITY DEFINER functions';
