const { Client } = require('pg');

// Supabase connection details
// The connection string format: postgres://postgres:[YOUR_DB_PASSWORD]@db.<project-ref>.supabase.co:5432/postgres
// We need to extract the project ref from the URL
const supabaseUrl = 'https://bzxohkrxcwodllketcpz.supabase.co';
const projectRef = 'bzxohkrxcwodllketcpz';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6eG9oa3J4Y3dvZGxsa2V0Y3B6Iiwicm9sZSI6InNlcnZpY2UiLCJpYXQiOjE3Mzg2NjYzODUsImV4cCI6MjA1NDI0MjM4NX0.S5HmTONamT169WYF0riSphXij-Mwtk7D3pphfSrCFE';

// For Supabase, the service_role key is used as the password for the postgres user
const connectionString = `postgres://postgres:${serviceRoleKey}@db.${projectRef}.supabase.co:5432/postgres`;

console.log('Connecting to Supabase PostgreSQL...');

const client = new Client({
  connectionString: connectionString,
  ssl: { rejectUnauthorized: false }
});

const sql = `
-- Step 1: Ensure tenant exists
INSERT INTO public.tenants (id, name, slug, domain, is_active)
VALUES (gen_random_uuid(), 'VideoRemix', 'videoremix', 'videoremix.vip', true)
ON CONFLICT (slug) DO UPDATE SET 
  name = EXCLUDED.name,
  domain = EXCLUDED.domain,
  is_active = EXCLUDED.is_active
RETURNING id as tenant_id;

-- Step 2: Assign admin role
WITH tenant_cte AS (SELECT id FROM public.tenants WHERE slug = 'videoremix' LIMIT 1)
INSERT INTO public.user_roles (user_id, role, tenant_id)
SELECT '12d69594-82f1-4fff-ad9b-8d7ff2bfc7fd'::uuid, 'admin', t.id
FROM tenant_cte t
ON CONFLICT (user_id) DO UPDATE SET 
  role = 'admin', 
  tenant_id = EXCLUDED.tenant_id, 
  updated_at = now();

-- Step 3: Verify
SELECT 
  ur.user_id,
  ur.role,
  ur.tenant_id,
  t.slug AS tenant_slug,
  t.name AS tenant_name,
  ur.created_at
FROM public.user_roles ur
JOIN public.tenants t ON ur.tenant_id = t.id
WHERE ur.user_id = '12d69594-82f1-4fff-ad9b-8d7ff2bfc7fd';
`;

async function execute() {
  try {
    await client.connect();
    console.log('✅ Connected to database\n');
    
    // Execute SQL statements sequentially
    const statements = sql.split(';').filter(s => s.trim().length > 0);
    
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i].trim();
      if (!stmt) continue;
      
      console.log(`Executing statement ${i + 1}/${statements.length}...`);
      const result = await client.query(stmt);
      
      if (result.rowCount > 0 || result.rows.length > 0) {
        console.log('   Result:', JSON.stringify(result.rows, null, 2));
      } else {
        console.log('   (No rows returned)');
      }
    }
    
    console.log('\n✅ Admin fix applied successfully!');
    console.log('\n📋 Next Steps:');
    console.log('1. Wait 30 seconds for RLS cache to refresh');
    console.log('2. Sign out of the application');
    console.log('3. Sign back in as admin user');
    console.log('4. Verify: Dashboard should show all apps with GTM details');
    
  } catch (err) {
    console.error('\n❌ ERROR:', err.message);
    console.log('\n🔧 Alternative: Run SUPABASE_ADMIN_FIX.sql manually in Supabase SQL Editor:');
    console.log(`   ${supabaseUrl}/project/editor`);
    process.exit(1);
  } finally {
    await client.end();
  }
}

execute();
