const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkProducts() {
  const { data, error } = await supabase
    .from('products_catalog')
    .select('id, name, slug, apps_granted')
    .eq('is_active', true);
    
  if (error) {
    console.error('Error fetching products:', error);
    return;
  }
  
  console.log(`Found ${data.length} active products:`);
  data.forEach(product => {
    console.log(`- ${product.name} (slug: ${product.slug})`);
    console.log(`  Apps granted: ${JSON.stringify(product.apps_granted)}`);
  });
}

checkProducts();