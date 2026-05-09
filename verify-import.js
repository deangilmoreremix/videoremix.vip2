import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load environment variables
const envPath = path.join(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      process.env[key.trim()] = valueParts.join('=').trim();
    }
  }
}

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function verifyImport() {
  console.log('🔍 Verifying bulk user import results...\n');

  // Check total users
  const { data: users, error: usersError } = await supabase
    .from('profiles')
    .select('id, email, full_name', { count: 'exact' });

  if (usersError) {
    console.error('Error fetching users:', usersError);
  } else {
    console.log(`👥 Total user profiles: ${users.length}`);
  }

  // Check app access distribution
  const { data: accessData, error: accessError } = await supabase
    .from('user_app_access')
    .select('app_slug', { count: 'exact' });

  if (accessError) {
    console.error('Error fetching access data:', accessError);
  } else {
    console.log(`🔑 Total app access grants: ${accessData.length}`);

    // Group by app
    const appCounts = {};
    accessData.forEach(item => {
      appCounts[item.app_slug] = (appCounts[item.app_slug] || 0) + 1;
    });

    console.log('📊 App access distribution:');
    Object.entries(appCounts)
      .sort(([,a], [,b]) => b - a)
      .forEach(([app, count]) => {
        console.log(`   ${app}: ${count} users`);
      });
  }

  // Check import records status
  const { data: importRecords, error: importError } = await supabase
    .from('import_user_records')
    .select('processing_status', { count: 'exact' });

  if (importError) {
    console.error('Error fetching import records:', importError);
  } else {
    console.log(`📋 Total import records: ${importRecords.length}`);

    const statusCounts = {};
    importRecords.forEach(record => {
      statusCounts[record.processing_status] = (statusCounts[record.processing_status] || 0) + 1;
    });

    console.log('📊 Import record status:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`   ${status}: ${count} records`);
    });
  }

  // Check recent purchases
  const { data: purchases, error: purchasesError } = await supabase
    .from('purchases')
    .select('id, product_name, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .limit(5);

  if (purchasesError) {
    console.error('Error fetching purchases:', purchasesError);
  } else {
    console.log(`💰 Recent purchases (${purchases.length} shown):`);
    purchases.forEach(purchase => {
      console.log(`   ${purchase.product_name} (${new Date(purchase.created_at).toLocaleDateString()})`);
    });
  }

  console.log('\n✅ Import verification complete!');
}

verifyImport().catch(console.error);