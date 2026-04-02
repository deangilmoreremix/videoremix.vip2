const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkPurchaseProducts() {
  // Get all purchases and extract distinct product names in JS
  const { data: purchases, error } = await supabase
    .from('purchases')
    .select('product_name')
    .not('product_name', 'is', null);
    
  if (error) {
    console.error('Error fetching purchases:', error);
    return;
  }
  
  // Get distinct product names using JS Set
  const productNames = [...new Set(purchases.map(p => p.product_name))].sort();
  
  console.log(`Found ${productNames.length} distinct product names in purchases:`);
  productNames.forEach((name, index) => {
    console.log(`${index + 1}: ${name}`);
  });
  
  // Get purchase records with product catalog info
  const { data: purchaseProducts, error: purchaseError } = await supabase
    .from('purchases')
    .select('product_id, product_name, products_catalog!inner(name, slug, apps_granted)')
    .eq('products_catalog.is_active', true)
    .not('product_name', 'is', null)
    .limit(50);
    
  if (purchaseError) {
    console.error('Error fetching purchase products with catalog info:', purchaseError);
    return;
  }
  
  console.log(`\nFound ${purchaseProducts.length} purchase records with product catalog info:`);
  purchaseProducts.forEach(pp => {
    console.log(`- ${pp.product_name} -> ${pp.products_catalog.name} (apps: ${JSON.stringify(pp.products_catalog.apps_granted)})`);
  });
}

checkPurchaseProducts();