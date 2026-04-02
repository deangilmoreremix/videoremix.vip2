const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkPurchasesSchema() {
  // Try to get one purchase record to see the structure
  const { data, error } = await supabase
    .from('purchases')
    .select('*')
    .limit(1);
    
  if (error) {
    console.error('Error fetching purchase:', error);
    return;
  }
  
  if (data.length === 0) {
    console.log('No purchases found in table');
    return;
  }
  
  const purchase = data[0];
  console.log('Purchase record structure:');
  for (const [key, value] of Object.entries(purchase)) {
    console.log(`  ${key}: ${value} (${typeof value})`);
  }
}

checkPurchasesSchema();