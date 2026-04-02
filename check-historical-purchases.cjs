const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkHistoricalPurchases() {
  // Get all purchases with product names and join to products_catalog
  const { data: purchases, error } = await supabase
    .from('purchases')
    .select(`
      id,
      email,
      product_name,
      products_catalog!inner(name, slug, apps_granted)
    `)
    .eq('products_catalog.is_active', true)
    .not('product_name', 'is', null)
    .order('created_at', { ascending: false });
    
  if (error) {
    console.error('Error fetching purchases:', error);
    return;
  }
  
  console.log(`Found ${purchases.length} purchase records with product info:\n`);
  
  // Group by product_name to see what CSV names map to what DB names
  const productMap = {};
  
  purchases.forEach(p => {
    const csvName = p.product_name;
    const dbName = p.products_catalog.name;
    
    if (!productMap[csvName]) {
      productMap[csvName] = {
        dbName: dbName,
        appsGranted: p.products_catalog.apps_granted,
        count: 0
      };
    }
    
    productMap[csvName].count++;
  });
  
  console.log(`Unique product name mappings:\n`);
  for (const [csvName, info] of Object.entries(productMap)) {
    console.log(`"${csvName}" → "${info.dbName}"`);
    console.log(`  Apps granted: ${JSON.stringify(info.appsGranted)}`);
    console.log(`  Count: ${info.count}\n`);
  }
  
  // Also get distinct product names from purchases alone
  const { data: distinctPurchaseNames } = await supabase
    .from('purchases')
    .select('product_name')
    .not('product_name', 'is', null)
    .order('product_name');
    
  // Extract distinct names in JS since DISTINCT might not work as expected
  const distinctNames = [...new Set(distinctPurchaseNames.map(p => p.product_name))].sort();
  
  console.log(`\nAll distinct product names in purchases table (${distinctNames.length}):\n`);
  distinctNames.forEach((name, index) => {
    console.log(`${index + 1}: ${name}`);
  });
}

checkHistoricalPurchases();