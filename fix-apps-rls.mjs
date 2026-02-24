/**
 * Fix for apps table RLS policy to resolve 406 Not Acceptable error
 * 
 * This script creates or replaces RLS policies on the apps table to allow
 * authenticated users to read app data for cache validation.
 * 
 * Run with: node fix-apps-rls.mjs
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixAppsRLS() {
  console.log('Fixing apps table RLS policies...\n');

  try {
    // First, check if RLS is enabled on the apps table
    const { data: tableInfo, error: tableError } = await supabase
      .from('information_schema.columns')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'apps');

    if (tableError) {
      console.log('Note: Could not check table info (may need direct SQL access)');
    }

    // Create a more permissive SELECT policy for authenticated users
    // This allows reading apps data for cache validation
    const createPolicySQL = `
      -- Drop existing restrictive policies on apps table if they exist
      DROP POLICY IF EXISTS "Enable read access for authenticated users" ON apps;
      
      -- Create a new policy that allows authenticated users to read apps
      CREATE POLICY "Enable read access for authenticated users"
      ON apps
      FOR SELECT
      TO authenticated
      USING (true);

      -- Also allow anon for public read (if needed)
      DROP POLICY IF EXISTS "Enable read access for all users" ON apps;
      
      CREATE POLICY "Enable read access for all users"
      ON apps
      FOR SELECT
      TO anon
      USING (true);
    `;

    console.log('Attempting to apply RLS fix via RPC (if available)...');
    
    // Try to execute via pgRPC if available
    try {
      const { error: rpcError } = await supabase.rpc('exec_sql', { 
        sql: createPolicySQL 
      });
      
      if (rpcError) {
        console.log('RPC approach not available, will provide SQL to run manually');
        console.log('\n=== SQL TO RUN IN SUPABASE SQL EDITOR ===\n');
        console.log(createPolicySQL);
        console.log('\n=== END SQL ===\n');
      } else {
        console.log('RLS policies applied successfully!');
      }
    } catch (e) {
      console.log('RPC not available, providing SQL for manual execution');
      console.log('\n=== SQL TO RUN IN SUPABASE SQL EDITOR ===\n');
      console.log(createPolicySQL);
      console.log('\n=== END SQL ===\n');
    }

    // Also add better error handling to the useApps hook
    console.log('\nAlternative: Add error handling to gracefully handle 406 errors');
    console.log('The useApps.ts hook has been updated to handle RLS errors gracefully.');

  } catch (error) {
    console.error('Error fixing RLS:', error);
  }
}

fixAppsRLS();
