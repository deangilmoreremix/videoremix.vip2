import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSchema() {
  console.log('Checking database schema...\n');
  
  const tables = [
    'apps',
    'features',
    'user_roles',
    'purchases',
    'subscription_status',
    'videos',
    'user_app_access',
    'products',
    'product_mapping'
  ];
  
  for (const table of tables) {
    const { data, error, count } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.log(table + ': ❌ Does not exist or no access - ' + error.message);
    } else {
      console.log(table + ': ✅ Exists (' + (count || 0) + ' rows)');
    }
  }
}

checkSchema();
