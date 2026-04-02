const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Simple similarity function (Jaccard index for word sets)
function similarity(str1, str2) {
  const set1 = new Set(str1.toLowerCase().split(/\s+/));
  const set2 = new Set(str2.toLowerCase().split(/\s+/));
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  return intersection.size / union.size;
}

async function findFuzzyMatches() {
  // Get CSV products
  const fs = require('fs');
  const csvProducts = fs.readFileSync('/workspaces/videoremix.vip2/csv-products.txt', 'utf8')
    .trim()
    .split('\n')
    .map(p => p.trim())
    .filter(p => p.length > 0);
  
  // Get database products
  const { data: dbProducts, error } = await supabase
    .from('products_catalog')
    .select('id, name, slug, apps_granted')
    .eq('is_active', true);
    
  if (error) {
    console.error('Error fetching products from database:', error);
    return;
  }
  
  console.log(`Comparing ${csvProducts.length} CSV products with ${dbProducts.length} database products\n`);
  
  // For each CSV product, find the best matching DB product
  const matches = [];
  
  for (const csvProduct of csvProducts) {
    let bestMatch = null;
    let bestScore = 0;
    
    for (const dbProduct of dbProducts) {
      const score = similarity(csvProduct, dbProduct.name);
      if (score > bestScore && score > 0.3) { // Require at least 30% similarity
        bestScore = score;
        bestMatch = dbProduct;
      }
    }
    
    if (bestMatch) {
      matches.push({
        csv: csvProduct,
        db: bestMatch.name,
        score: bestScore.toFixed(2),
        apps: bestMatch.apps_granted
      });
    }
  }
  
  // Sort by score descending
  matches.sort((a, b) => parseFloat(b.score) - parseFloat(a.score));
  
  console.log(`Found ${matches.length} fuzzy matches (similarity > 0.3):\n`);
  matches.forEach(m => {
    console.log(`"${m.csv}"`);
    console.log(`  → "${m.db}" (similarity: ${m.score})`);
    console.log(`  → Apps granted: ${JSON.stringify(m.apps)}`);
    console.log('');
  });
  
  // Show CSV products with no good matches
  const matchedCsv = new Set(matches.map(m => m.csv));
  const unmatched = csvProducts.filter(p => !matchedCsv.has(p));
  
  console.log(`\n${unmatched.length} CSV products with no good matches:\n`);
  unmatched.forEach(p => {
    console.log(`"${p}"`);
  });
}

findFuzzyMatches();