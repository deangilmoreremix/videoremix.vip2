const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkPurchases() {
  const { data, error } = await supabase
    .from('purchases')
    .select('id, user_id, email, product_id, product_name, platform, status')
    .limit(20);
    
  if (error) {
    console.error('Error fetching purchases:', error);
    return;
  }
  
  console.log(`Found ${data.length} purchases:`);
  data.forEach(purchase => {
    console.log(`- ${purchase.product_name} (${purchase.email}) - ${purchase.status}`);
  });
  
  // Also get distinct product names
  const { data: distinctProducts, error: distinctError } = await supabase
    .from('purchases')
    .select('DISTINCT product_name')
    .not('product_name', 'is', null)
    .order('product_name');
    
  if (distinctError) {
    console.error('Error fetching distinct product names:', distinctError);
    return;
  }
  
  console.log(`\nFound ${distinctProducts.length} distinct product names in purchases:`);
  distinctProducts.forEach(p => {
    console.log(`- ${p.product_name}`);
  });
}

checkPurchases();