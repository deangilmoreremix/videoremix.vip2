#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
const env = readFileSync(join(__dirname, '.env'), 'utf-8');
const envVars = {};
env.split('\n').forEach(line => {
  const [key, ...value] = line.split('=');
  if (key && value.length) {
    envVars[key.trim()] = value.join('=').trim();
  }
});

const supabase = createClient(
  envVars.VITE_SUPABASE_URL,
  envVars.SUPABASE_SERVICE_ROLE_KEY
);

async function checkConstraints() {
  console.log('🔍 Checking constraints on purchases table...\n');

  // Query to get check constraints on the purchases table
  const { data, error } = await supabase
    .rpc('get_table_constraints', { table_name: 'purchases' });

  if (error) {
    console.error('❌ Error checking constraints:', error.message);
    // Fallback: try to query information_schema directly via supabase
    const { data: schemaData, error: schemaError } = await supabase
      .from('information_schema.table_constraints')
      .select('constraint_name, constraint_type')
      .eq('table_name', 'purchases')
      .eq('constraint_type', 'CHECK');

    if (schemaError) {
      console.error('❌ Fallback also failed:', schemaError.message);
      return;
    }

    console.log('📋 Check constraints found:', schemaData);
    // Now get the check constraint details for purchases_platform_check
    const { data: checkData, error: checkError } = await supabase
      .from('information_schema.check_constraints')
      .select('constraint_name, check_clause')
      .eq('constraint_name', 'purchases_platform_check');

    if (checkError) {
      console.error('❌ Error getting check clause:', checkError.message);
    } else {
      console.log('📋 Check clause for purchases_platform_check:', checkData);
    }
    return;
  }

  console.log('📋 Constraints:', data);
}

checkConstraints().catch(console.error);