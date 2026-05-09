const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSpecificProducts() {
  // List of products we're looking for from the CSV
  const csvProducts = [
    "Smart Analytics - Special Offer",
    "Video List Builder - Pay What You Want",
    "VideoRemix - Connect - VideoRemix Connect - Monthly - Christmas Special",
    "VideoRemix - Connect - VideoRemix Connect - Yearly - Special",
    "GO-AI Bundle",
    "Smart Apps - One Time",
    "Smart Marketing Hub - Life Time Access",
    "SmartVideo Automation - Yearly"
  ];
  
  // Get all products from database
  const { data: dbProducts, error } = await supabase
    .from('products_catalog')
    .select('id, name, slug, apps_granted')
    .eq('is_active', true);
    
  if (error) {
    console.error('Error fetching products:', error);
    return;
  }
  
  console.log(`Checking ${csvProducts.length} CSV products against ${dbProducts.length} database products:\n`);
  
  // For each CSV product, look for matches in DB
  for (const csvProduct of csvProducts) {
    console.log(`CSV Product: "${csvProduct}"`);
    
    // Try exact match first
    const exactMatch = dbProducts.find(p => 
      p.name.toLowerCase() === csvProduct.toLowerCase()
    );
    
    if (exactMatch) {
      console.log(`  ✓ Exact match: "${exactMatch.name}"`);
      console.log(`    Apps granted: ${JSON.stringify(exactMatch.apps_granted)}`);
      continue;
    }
    
    // Try partial match (CSV product contains DB product name or vice versa)
    const partialMatches = dbProducts.filter(p => 
      p.name.toLowerCase().includes(csvProduct.toLowerCase()) || 
      csvProduct.toLowerCase().includes(p.name.toLowerCase())
    );
    
    if (partialMatches.length > 0) {
      console.log(`  ~ Partial matches:`);
      partialMatches.forEach(p => {
        console.log(`    "${p.name}"`);
        console.log(`      Apps granted: ${JSON.stringify(p.apps_granted)}`);
      });
      continue;
    }
    
    // Try fuzzy matching
    const fuzzyMatches = dbProducts.map(p => {
      // Simple word overlap similarity
      const csvWords = new Set(csvProduct.toLowerCase().split(/\s+/));
      const dbWords = new Set(p.name.toLowerCase().split(/\s+/));
      const intersection = new Set([...csvWords].filter(w => dbWords.has(w)));
      const union = new Set([...csvWords, ...dbWords]);
      const similarity = intersection.size / union.size;
      return { product: p, similarity };
    })
    .filter(m => m.similarity > 0.2) // Lower threshold for fuzzy matching
    .sort((a, b) => b.similarity - a.similarity);
    
    if (fuzzyMatches.length > 0) {
      console.log(`  ? Fuzzy matches (similarity > 0.2):`);
      fuzzyMatches.slice(0, 3).forEach(m => {
        console.log(`    "${m.product.name}" (similarity: ${m.similarity.toFixed(2)})`);
        console.log(`      Apps granted: ${JSON.stringify(m.product.apps_granted)}`);
      });
    } else {
      console.log(`  ✗ No matches found`);
    }
    console.log('');
  }
}

checkSpecificProducts();