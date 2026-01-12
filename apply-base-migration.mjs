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

async function applyBaseMigrations() {
  try {
    console.log('🚀 Applying base apps table migrations...');

    // Check if apps table already exists
    const { data: existingTables, error: checkError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'apps');

    if (checkError) {
      console.error('Error checking tables:', checkError);
    } else if (existingTables && existingTables.length > 0) {
      console.log('✅ Apps table already exists, skipping base migration');
      return;
    }

    // Read the base migration file
    const baseMigrationSQL = readFileSync('supabase/migrations/20251008175345_add_apps_deployment_urls.sql', 'utf8');

    console.log('📄 Applying base apps table creation...');

    // Execute the base migration
    const { error } = await supabase.rpc('exec_sql', { sql: baseMigrationSQL });

    if (error) {
      // If exec_sql doesn't work, try direct SQL execution
      console.log('⚠️ exec_sql not available, trying direct execution...');

      // Split into statements and execute individually
      const statements = baseMigrationSQL
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        if (statement.trim()) {
          console.log(`⚡ Executing base statement ${i + 1}/${statements.length}...`);

          // For simple CREATE TABLE statements, we can try direct execution
          if (statement.includes('CREATE TABLE')) {
            const { error: stmtError } = await supabase.from('dummy').select('*').limit(0);
            // This won't work, let's use the dashboard approach
            console.log('📋 Please apply this SQL in Supabase Dashboard SQL Editor:');
            console.log('---');
            console.log(baseMigrationSQL);
            console.log('---');
            return;
          }
        }
      }
    } else {
      console.log('✅ Base apps table migration applied successfully!');
    }

  } catch (error) {
    console.error('💥 Base migration failed:', error);
    console.log('📋 Please apply the base migration manually in Supabase Dashboard SQL Editor:');
    console.log('File: supabase/migrations/20251008175345_add_apps_deployment_urls.sql');
    process.exit(1);
  }
}

applyBaseMigrations();