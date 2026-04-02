const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function compareProducts() {
  // Get CSV products
  const csvProducts = fs.readFileSync('/workspaces/videoremix.vip2/csv-products.txt', 'utf8')
    .trim()
    .split('\n')
    .map(p => p.trim())
    .filter(p => p.length > 0);
  
  console.log(`Loaded ${csvProducts.length} products from CSV`);

  // Get database products
  const { data: dbProducts, error } = await supabase
    .from('products_catalog')
    .select('id, name, slug, apps_granted')
    .eq('is_active', true);
    
  if (error) {
    console.error('Error fetching products from database:', error);
    return;
  }
  
  console.log(`Found ${dbProducts.length} active products in database`);
  
  // Create maps for comparison
  const dbProductNames = new Set(dbProducts.map(p => p.name.toLowerCase()));
  const dbProductSlugs = new Set(dbProducts.map(p => p.slug.toLowerCase()));
  
  // Check for matches
  const matches = [];
  const noMatches = [];
  
  for (const csvProduct of csvProducts) {
    const lowerCsv = csvProduct.toLowerCase();
    let found = false;
    
    // Exact match
    if (dbProductNames.has(lowerCsv)) {
      matches.push({ csv: csvProduct, type: 'exact name match' });
      found = true;
    } 
    // Check if it's a substring of any DB product name
    else {
      for (const dbProduct of dbProducts) {
        if (dbProduct.name.toLowerCase().includes(lowerCsv) || 
            lowerCsv.includes(dbProduct.name.toLowerCase())) {
          matches.push({ csv: csvProduct, db: dbProduct.name, type: 'substring match' });
          found = true;
          break;
        }
      }
    }
    
    if (!found) {
      noMatches.push(csvProduct);
    }
  }
  
  console.log(`\nFound ${matches.length} matches:`);
  matches.slice(0, 20).forEach(m => {
    if (m.type === 'exact name match') {
      console.log(`✓ "${m.csv}" (exact match)`);
    } else {
      console.log(`✓ "${m.csv}" ≈ "${m.db}" (${m.type})`);
    }
  });
  
  if (matches.length > 20) {
    console.log(`  ... and ${matches.length - 20} more`);
  }
  
  console.log(`\nFound ${noMatches.length} products with no matches:`);
  noMatches.slice(0, 20).forEach(p => {
    console.log(`✗ "${p}"`);
  });
  
  if (noMatches.length > 20) {
    console.log(`  ... and ${noMatches.length - 20} more`);
  }
  
  // Save to files for reference
  fs.writeFileSync('/workspaces/videoremix.vip2/matched-products.txt', 
    matches.map(m => m.type === 'exact name match' ? m.csv : `${m.csv} -> ${m.db}`).join('\n'));
  fs.writeFileSync('/workspaces/videoremix.vip2/unmatched-products.txt', 
    noMatches.join('\n'));
    
  console.log(`\nSaved matched products to matched-products.txt`);
  console.log(`Saved unmatched products to unmatched-products.txt`);
}

compareProducts();