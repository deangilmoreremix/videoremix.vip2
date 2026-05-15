import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bzxohkrxcwodllketcpz.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6eG9oa3J4Y3dvZGxsa2V0Y3B6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mzg2NjM4NSwiZXhwIjoyMDg5NDQyMzg1fQ.S5HmTONnamT169WYF0riSphXij-Mwtk7D3pphfSrCFE';

const supabase = createClient(supabaseUrl, serviceKey);

const adminFunctions = [
  'admin-dashboard-stats',
  'admin-apps',
  'admin-features',
  'admin-users',
  'admin-purchases',
  'admin-subscriptions',
  'admin-products',
  'admin-videos'
];

console.log('🧪 Testing Supabase Admin Edge Functions\n');

for (const funcName of adminFunctions) {
  try {
    const { data, error } = await supabase.functions.invoke(funcName, {
      body: { test: 'health-check' }
    });
    
    if (error) {
      console.log(`❌ ${funcName}: ${error.message}`);
    } else {
      console.log(`✅ ${funcName}: OK`);
    }
  } catch (err) {
    console.log(`❌ ${funcName}: ${err.message}`);
  }
}

console.log('\n✅ Complete');
