const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function searchProducts() {
  // Search for products with various keywords
  const searchTerms = [
    'smart',
    'video',
    'connect',
    'go-ai',
    'list builder',
    'analytics',
    'marketing hub',
    'apps'
  ];
  
  for (const term of searchTerms) {
    console.log(`\nSearching for products containing "${term}":`);
    const { data, error } = await supabase
      .from('products_catalog')
      .select('id, name, slug, apps_granted')
      .ilike('name', `%${term}%`)
      .eq('is_active', true);
      
    if (error) {
      console.error(`Error searching for ${term}:`, error);
      continue;
    }
    
    if (data.length === 0) {
      console.log(`  No products found`);
    } else {
      console.log(`  Found ${data.length} products:`);
      data.forEach(p => {
        console.log(`  - ${p.name} (apps: ${JSON.stringify(p.apps_granted)})`);
      });
    }
  }
  
  // Also get all products to see what we have
  console.log(`\nAll active products in database:`);
  const { data: allProducts, error: allError } = await supabase
    .from('products_catalog')
    .select('id, name, slug, apps_granted')
    .eq('is_active', true);
    
  if (allError) {
    console.error('Error fetching all products:', allError);
    return;
  }
  
  allProducts.forEach(p => {
    console.log(`- ${p.name}`);
  });
}

searchProducts();