const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkAllProductNames() {
  const { data, error } = await supabase
    .from('products_catalog')
    .select('id, name, slug')
    .eq('is_active', true)
    .order('name');
    
  if (error) {
    console.error('Error fetching products:', error);
    return;
  }
  
  console.log(`Found ${data.length} active products:`);
  data.forEach(product => {
    console.log(`- ${product.name}`);
  });
  
  // Also check for any products with "Smart" in the name
  const smartProducts = data.filter(p => p.name.toLowerCase().includes('smart'));
  console.log(`\nFound ${smartProducts.length} products with "Smart" in name:`);
  smartProducts.forEach(p => console.log(`- ${p.name}`));
  
  // Check for "Video" in name
  const videoProducts = data.filter(p => p.name.toLowerCase().includes('video'));
  console.log(`\nFound ${videoProducts.length} products with "Video" in name:`);
  videoProducts.forEach(p => console.log(`- ${p.name}`));
  
  // Check for "Connect" in name
  const connectProducts = data.filter(p => p.name.toLowerCase().includes('connect'));
  console.log(`\nFound ${connectProducts.length} products with "Connect" in name:`);
  connectProducts.forEach(p => console.log(`- ${p.name}`));
  
  // Check for "Bundle" in name
  const bundleProducts = data.filter(p => p.name.toLowerCase().includes('bundle'));
  console.log(`\nFound ${bundleProducts.length} products with "Bundle" in name:`);
  bundleProducts.forEach(p => console.log(`- ${p.name}`));
}

checkAllProductNames();