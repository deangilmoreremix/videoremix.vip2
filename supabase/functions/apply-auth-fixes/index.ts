import { createClient } from 'npm:@supabase/supabase-js@2.39.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    console.log('Applying authentication fixes...');

    // Step 1: Add unique constraint to profiles table
    console.log('Adding unique constraint to profiles.user_id...');
    try {
      await supabase.rpc('exec_sql', {
        sql: `
          DO $$
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM pg_constraint
              WHERE conname = 'profiles_user_id_key'
            ) THEN
              ALTER TABLE profiles ADD CONSTRAINT profiles_user_id_key UNIQUE (user_id);
            END IF;
          END $$;
        `
      });
      console.log('✅ Unique constraint added');
    } catch (error) {
      console.log('⚠️  Constraint may already exist:', error.message);
    }

    // Step 2: Create the handle_new_user function
    console.log('Creating handle_new_user function...');
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE OR REPLACE FUNCTION public.handle_new_user()
        RETURNS TRIGGER
        SECURITY DEFINER
        SET search_path = public, pg_temp
        AS $$
        DECLARE
          first_name TEXT;
          last_name TEXT;
          full_name TEXT;
          lower_email TEXT;
        BEGIN
          -- ALWAYS convert email to lowercase - critical fix!
          lower_email := LOWER(NEW.email);

          -- Extract names from user metadata if available
          first_name := COALESCE(NEW.raw_user_meta_data->>'first_name', '');
          last_name := COALESCE(NEW.raw_user_meta_data->>'last_name', '');
          full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', '');

          -- If no full_name but have first/last, construct it
          IF full_name = '' AND (first_name != '' OR last_name != '') THEN
            full_name := TRIM(first_name || ' ' || last_name);
          END IF;

          -- Create user_roles entry
          INSERT INTO user_roles (user_id, role, tenant_id)
          VALUES (NEW.id, 'user', '00000000-0000-0000-0000-000000000001')
          ON CONFLICT (user_id) DO NOTHING;

          -- Create profiles entry with LOWERCASE EMAIL
          INSERT INTO profiles (user_id, email, full_name, tenant_id)
          VALUES (NEW.id, lower_email, COALESCE(NULLIF(full_name, ''), 'User'), '00000000-0000-0000-0000-000000000001')
          ON CONFLICT (user_id) DO UPDATE
          SET email = lower_email, updated_at = now();

          RETURN NEW;
        EXCEPTION
          WHEN OTHERS THEN
            -- Log the error but don't prevent user creation
            RAISE WARNING 'Error in handle_new_user trigger: %', SQLERRM;
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
      `
    });
    console.log('✅ handle_new_user function created');

    // Step 3: Create the trigger
    console.log('Creating trigger on auth.users...');
    await supabase.rpc('exec_sql', {
      sql: `
        DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
        CREATE TRIGGER on_auth_user_created
          AFTER INSERT ON auth.users
          FOR EACH ROW
          EXECUTE FUNCTION public.handle_new_user();
      `
    });
    console.log('✅ Trigger created');

    // Step 4: Create profiles for existing users
    console.log('Creating profiles for existing users...');
    await supabase.rpc('exec_sql', {
      sql: `
        INSERT INTO profiles (user_id, email, full_name, tenant_id)
        SELECT
          au.id,
          LOWER(au.email),
          COALESCE(au.raw_user_meta_data->>'full_name', 'User'),
          '00000000-0000-0000-0000-000000000001'
        FROM auth.users au
        LEFT JOIN profiles p ON au.id = p.user_id
        WHERE p.user_id IS NULL
        ON CONFLICT (user_id) DO NOTHING;
      `
    });
    console.log('✅ Profiles created for existing users');

    // Step 5: Create user_roles for existing users
    console.log('Creating user_roles for existing users...');
    await supabase.rpc('exec_sql', {
      sql: `
        INSERT INTO user_roles (user_id, role, tenant_id)
        SELECT
          au.id,
          'user',
          '00000000-0000-0000-0000-000000000001'
        FROM auth.users au
        LEFT JOIN user_roles ur ON au.id = ur.user_id
        WHERE ur.user_id IS NULL
        ON CONFLICT (user_id) DO NOTHING;
      `
    });
    console.log('✅ User roles created for existing users');

    // Step 6: Update existing profiles to lowercase emails
    console.log('Updating existing profiles to lowercase emails...');
    await supabase.rpc('exec_sql', {
      sql: `
        UPDATE profiles
        SET email = LOWER(email)
        WHERE email != LOWER(email);
      `
    });
    console.log('✅ Existing profile emails updated to lowercase');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'All authentication fixes applied successfully!',
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error applying fixes:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});