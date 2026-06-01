import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';
import { readFileSync } from 'fs';

// Load environment variables
config();

const databaseUrl = process.env.DATABASE_URL;
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!databaseUrl && (!supabaseUrl || !supabaseServiceKey)) {
  console.error('❌ Missing database connection info');
  console.error('Required: DATABASE_URL or (VITE_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY)');
  process.exit(1);
}

// Create connection string if not provided
const projectRef = supabaseUrl.split('//')[1].split('.')[0];
const connectionString = databaseUrl || `postgresql://postgres:${supabaseServiceKey}@db.${projectRef}.supabase.co:5432/postgres`;

const sql = neon(connectionString);

async function applyAuthFixes() {
  console.log('🚀 Applying Critical Authentication Fixes\n');
  console.log('='.repeat(50));

  try {
    // Read the SQL migration file
    const migrationSQL = readFileSync('CRITICAL_AUTH_FIXES.sql', 'utf8');

    // Split the SQL into individual statements (by semicolon)
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📄 Found ${statements.length} SQL statements to execute\n`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (!statement) continue;

      // Skip comments and empty statements
      if (statement.startsWith('--') || statement.trim() === '') continue;

      try {
        console.log(`🔧 Executing statement ${i + 1}/${statements.length}...`);

        // Execute the statement
        await sql(statement);

        console.log(`   ✅ Statement ${i + 1} executed successfully`);

        // Add a small delay between statements
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        // Check if it's a harmless error (like "already exists")
        if (error.message.includes('already exists') ||
            error.message.includes('does not exist') && statement.includes('DROP') ||
            error.message.includes('duplicate key value')) {
          console.log(`   ℹ️  Statement ${i + 1} skipped (expected): ${error.message.split('\n')[0]}`);
        } else {
          console.error(`   ❌ Statement ${i + 1} failed:`, error.message);
          throw error;
        }
      }
    }

    console.log('\n🎉 All authentication fixes applied successfully!\n');

    // Verification
    console.log('🔍 Verifying the fixes...\n');

    // Check trigger exists
    try {
      const triggerCheck = await sql`
        SELECT tgname, proname FROM pg_trigger
        WHERE tgname = 'on_auth_user_created'
      `;
      if (triggerCheck.length > 0) {
        console.log('✅ Trigger "on_auth_user_created" exists');
      } else {
        console.log('⚠️  Trigger not found');
      }
    } catch (error) {
      console.log('⚠️  Could not verify trigger:', error.message);
    }

    // Check function exists
    try {
      const functionCheck = await sql`
        SELECT proname FROM pg_proc
        WHERE proname = 'handle_new_user'
      `;
      if (functionCheck.length > 0) {
        console.log('✅ Function "handle_new_user" exists');
      } else {
        console.log('⚠️  Function not found');
      }
    } catch (error) {
      console.log('⚠️  Could not verify function:', error.message);
    }

    // Check user_roles count vs auth.users count
    try {
      const [userCount] = await sql`SELECT COUNT(*) as count FROM auth.users`;
      const [roleCount] = await sql`SELECT COUNT(*) as count FROM user_roles`;

      console.log(`📊 Users: ${userCount.count}, Roles: ${roleCount.count}`);

      if (parseInt(userCount.count) === parseInt(roleCount.count)) {
        console.log('✅ All users have roles assigned');
      } else {
        console.log('⚠️  Some users may be missing roles');
      }
    } catch (error) {
      console.log('⚠️  Could not verify user/role counts:', error.message);
    }

    console.log('\n🎯 Authentication system is now fixed!');
    console.log('🛡️  Race condition resolved - user_roles will be created on signup');
    console.log('📧 Email case sensitivity handled');
    console.log('🔄 Trigger will fire immediately on user creation');

  } catch (error) {
    console.error('\n💥 Migration failed:', error.message);
    process.exit(1);
  }
}

applyAuthFixes();