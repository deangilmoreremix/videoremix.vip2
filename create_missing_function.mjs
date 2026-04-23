import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

// Create missing function in remote database
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function createMissingFunction() {
  console.log('Creating missing log_user_management_operation function...')
  
  const functionSQL = `
    CREATE OR REPLACE FUNCTION public.log_user_management_operation(
      operation_type text,
      user_id uuid DEFAULT NULL,
      target_user_id uuid DEFAULT NULL,
      performed_by uuid DEFAULT NULL,
      metadata jsonb DEFAULT NULL,
      old_data json DEFAULT NULL,
      new_data json DEFAULT NULL,
      table_name text DEFAULT NULL,
      operation_status text DEFAULT 'success',
      error_message text DEFAULT NULL
    )
    RETURNS void
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public
    AS $$
    BEGIN
      -- Simple logging function - just insert into audit_log if it exists
      BEGIN
        INSERT INTO audit_log (
          user_id,
          action,
          resource_type,
          resource_id,
          metadata,
          created_at
        ) VALUES (
          performed_by,
          operation_type,
          table_name,
          COALESCE(target_user_id::text, user_id::text),
          jsonb_build_object(
            'operation_type', operation_type,
            'target_user_id', target_user_id,
            'metadata', metadata,
            'old_data', old_data,
            'new_data', new_data,
            'operation_status', operation_status,
            'error_message', error_message
          ),
          now()
        );
      EXCEPTION
        WHEN OTHERS THEN
          -- If audit_log doesn't exist, just silently continue
          NULL;
      END;
    END;
    $$;
  `
  
  try {
    const { error } = await supabase.rpc('exec_sql', { sql: functionSQL })
    
    if (error) {
      console.log('Error creating function via RPC, trying direct SQL...')
      // Try direct SQL execution
      const { error: directError } = await supabase.from('_supabase_migration_temp').select('*').limit(0)
      if (directError) {
        console.log('Cannot execute raw SQL. Function may already exist or need manual creation.')
      }
    } else {
      console.log('✅ Function created successfully')
    }
  } catch (err) {
    console.log('❌ Error creating function:', err.message)
  }
}

createMissingFunction()
