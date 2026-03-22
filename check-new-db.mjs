/**
 * Check database schema in the new Supabase project
 * Run with: node check-new-db.mjs
 */

const SUPABASE_URL = 'https://bzxohkrxcwodllketcpz.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6eG9oa3J4Y3dvZGxsa2V0Y3B6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mzg2NjM4NSwiZXhwIjoyMDg5NDQyMzg1fQ.S5HmTONnamT169WYF0riSphXij-Mwtk7D3pphfSrCFE';

async function checkSchema() {
  console.log('🔍 Checking database schema for project: bzxohkrxcwodllketcpz\n');
  console.log('='.repeat(60));
  
  // Tables to check
  const tablesToCheck = [
    'apps', 'users', 'profiles', 'videos', 
    'purchases', 'subscriptions', 'hero_content',
    'benefits_features', 'testimonials', 'faqs', 
    'pricing_plans', 'user_app_access', 'access_tiers',
    'import_products', 'import_records', 'tenants'
  ];

  console.log('📋 Checking for tables in the database:\n');
  
  const existingTables = [];
  const missingTables = [];

  for (const tableName of tablesToCheck) {
    try {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/${tableName}?select=*&limit=1`,
        {
          headers: {
            'Authorization': `Bearer ${SERVICE_KEY}`,
            'apikey': SERVICE_KEY,
            'Prefer': 'count=exact'
          }
        }
      );

      if (response.ok) {
        const count = response.headers.get('content-range');
        const total = count ? count.split('/')[0] : '0';
        console.log(`  ✅ ${tableName} (${total} rows)`);
        existingTables.push(tableName);
      } else if (response.status === 404) {
        console.log(`  ❌ ${tableName} - does not exist`);
        missingTables.push(tableName);
      } else {
        const error = await response.text();
        console.log(`  ⚠️ ${tableName} - error: ${error.substring(0, 50)}`);
      }
    } catch (e) {
      console.log(`  ❌ ${tableName} - error: ${e.message}`);
      missingTables.push(tableName);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`✅ Found ${existingTables.length} tables`);
  console.log(`❌ Missing ${missingTables.length} tables`);
  
  if (missingTables.length > 0) {
    console.log('\n📝 Tables that need to be created:');
    missingTables.forEach(t => console.log(`  - ${t}`));
  }
}

checkSchema();
