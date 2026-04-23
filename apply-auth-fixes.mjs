import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables!');
  process.exit(1);
}

const adminClient = createClient(supabaseUrl, supabaseServiceKey);

async function applyAuthFixes() {
  console.log('🛠️  Applying authentication fixes...\n');

  try {
    // Step 1: Add unique constraint to profiles table
    console.log('Step 1: Adding unique constraint to profiles.user_id...');
    const { error: constraintError } = await adminClient.rpc('sql', {
      query: `
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

    if (constraintError) {
      console.error('❌ Failed to add unique constraint:', constraintError);
    } else {
      console.log('✅ Unique constraint added to profiles.user_id');
    }

    // Step 2: Create the handle_new_user function
    console.log('\nStep 2: Creating handle_new_user function...');
    const { error: functionError } = await adminClient.rpc('sql', {
      query: `
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

    if (functionError) {
      console.error('❌ Failed to create handle_new_user function:', functionError);
    } else {
      console.log('✅ handle_new_user function created');
    }

    // Step 3: Create the trigger
    console.log('\nStep 3: Creating trigger on auth.users...');
    const { error: triggerError } = await adminClient.rpc('sql', {
      query: `
        DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
        CREATE TRIGGER on_auth_user_created
          AFTER INSERT ON auth.users
          FOR EACH ROW
          EXECUTE FUNCTION public.handle_new_user();
      `
    });

    if (triggerError) {
      console.error('❌ Failed to create trigger:', triggerError);
    } else {
      console.log('✅ Trigger created on auth.users');
    }

    // Step 4: Create profiles for existing users
    console.log('\nStep 4: Creating profiles for existing users...');
    const { error: profilesError } = await adminClient.rpc('sql', {
      query: `
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

    if (profilesError) {
      console.error('❌ Failed to create profiles for existing users:', profilesError);
    } else {
      console.log('✅ Profiles created for existing users');
    }

    // Step 5: Create user_roles for existing users
    console.log('\nStep 5: Creating user_roles for existing users...');
    const { error: rolesError } = await adminClient.rpc('sql', {
      query: `
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

    if (rolesError) {
      console.error('❌ Failed to create user_roles for existing users:', rolesError);
    } else {
      console.log('✅ User roles created for existing users');
    }

    // Step 6: Update existing profiles to lowercase emails
    console.log('\nStep 6: Updating existing profiles to lowercase emails...');
    const { error: emailUpdateError } = await adminClient.rpc('sql', {
      query: `
        UPDATE profiles
        SET email = LOWER(email)
        WHERE email != LOWER(email);
      `
    });

    if (emailUpdateError) {
      console.error('❌ Failed to update email case:', emailUpdateError);
    } else {
      console.log('✅ Existing profile emails updated to lowercase');
    }

    console.log('\n🎉 Authentication fixes applied successfully!');

  } catch (error) {
    console.error('💥 Error applying fixes:', error);
    process.exit(1);
  }
}

applyAuthFixes();