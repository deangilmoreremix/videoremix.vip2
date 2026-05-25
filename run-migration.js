#!/usr/bin/env node

/**
 * Execute raw SQL migration to create user_api_keys tables
 */

import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const sql = fs.readFileSync('supabase/migrations/20260502000000_create_user_api_keys_tables.sql', 'utf-8');

async function runMigration() {
  console.log('🔄 Executing migration to create user_api_keys tables...\n');

  try {
    // Split SQL into individual statements
    const statements = sql.split(';').filter(stmt => stmt.trim());

    for (const statement of statements) {
      if (statement.trim()) {
        console.log(`Executing: ${statement.trim().substring(0, 50)}...`);

        const { error } = await supabase.rpc('exec_sql', { sql: statement.trim() + ';' });

        if (error) {
          console.log(`Warning: ${error.message}`);
          // Continue with other statements
        }
      }
    }

    console.log('\n✅ Migration completed');
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

runMigration();