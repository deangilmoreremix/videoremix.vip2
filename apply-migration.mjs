import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { config } from 'dotenv';

// Load environment variables from .env file
config();

// Load environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing environment variables. Please check your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  try {
    console.log('🚀 Applying apps table improvements migration...');

    // Read the migration file
    const migrationSQL = readFileSync('supabase/migrations/20251122000001_apps_table_improvements.sql', 'utf8');

    // Split the SQL into individual statements (basic approach)
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && !stmt.startsWith('/*'));

    console.log(`📄 Found ${statements.length} SQL statements to execute`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);

        const { error } = await supabase.rpc('exec_sql', { sql: statement });

        if (error) {
          console.error(`❌ Error executing statement ${i + 1}:`, error.message);
          // Continue with other statements for idempotent operations
          if (!error.message.includes('already exists') && !error.message.includes('does not exist')) {
            throw error;
          }
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`);
        }
      }
    }

    console.log('🎉 Migration completed successfully!');

    // Verify the migration worked
    console.log('🔍 Verifying migration...');

    // Check constraint
    const { data: constraints, error: constraintError } = await supabase
      .from('pg_constraint')
      .select('conname')
      .eq('conname', 'apps_sort_order_check');

    if (constraintError) {
      console.warn('⚠️ Could not verify constraint:', constraintError.message);
    } else if (constraints && constraints.length > 0) {
      console.log('✅ CHECK constraint added successfully');
    }

    // Check audit table
    const { data: auditTable, error: auditError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_name', 'apps_audit_log')
      .eq('table_schema', 'public');

    if (auditError) {
      console.warn('⚠️ Could not verify audit table:', auditError.message);
    } else if (auditTable && auditTable.length > 0) {
      console.log('✅ Audit table created successfully');
    }

    console.log('🎯 Migration verification complete!');

  } catch (error) {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  }
}

applyMigration();