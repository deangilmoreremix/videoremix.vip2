// Update Stripe product names to match the new descriptive LLM agent names

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const __dirname = path.dirname(new URL(import.meta.url).pathname);

// Read appsData.ts to get current names
const appsDataPath = path.join(process.cwd(), 'src/data/appsData.ts');
const appsDataContent = fs.readFileSync(appsDataPath, 'utf8');

// Extract app data - this is a simple regex approach
const appMatches = appsDataContent.match(/{\s*id:\s*"([^"]+)",\s*name:\s*"([^"]+)",\s*description:\s*"([^"]*)",\s*category:\s*"([^"]*)",/g);

if (!appMatches) {
  console.error('Could not parse appsData.ts');
  process.exit(1);
}

const apps = appMatches.map(match => {
  const idMatch = match.match(/id:\s*"([^"]+)"/);
  const nameMatch = match.match(/name:\s*"([^"]+)"/);
  const categoryMatch = match.match(/category:\s*"([^"]*)"/);
  
  if (idMatch && nameMatch && categoryMatch) {
    return {
      id: idMatch[1],
      name: nameMatch[1],
      category: categoryMatch[1]
    };
  }
  return null;
}).filter(Boolean);

console.log(`📊 Found ${apps.length} apps in appsData.ts\n`);

// Get current Stripe products
let stripeProducts = [];
try {
  const result = execSync('stripe products list --limit 120', { encoding: 'utf8' });
  const data = JSON.parse(result);
  stripeProducts = data.data;
} catch (error) {
  console.error('Error fetching Stripe products:', error.message);
  process.exit(1);
}

console.log(`💳 Found ${stripeProducts.length} products in Stripe\n`);

// Create mapping of app IDs to product IDs
const appToStripeMap = {};

// Try to match apps to Stripe products by name similarity or ID
apps.forEach(app => {
  // Look for products that contain the app ID or similar name
  const matchingProduct = stripeProducts.find(product => {
    const productName = product.name.toLowerCase().replace(/ - lifetime access/g, '');
    const appName = app.name.toLowerCase();
    
    // Check if product name contains app ID
    if (product.name.toLowerCase().includes(app.id.toLowerCase())) {
      return true;
    }
    
    // Check for name similarity (simple approach)
    const words = appName.split(' ');
    const matchCount = words.filter(word => 
      productName.includes(word.toLowerCase())
    ).length;
    
    return matchCount >= 2; // At least 2 matching words
  });
  
  if (matchingProduct) {
    appToStripeMap[app.id] = {
      stripeId: matchingProduct.id,
      currentName: matchingProduct.name,
      newName: `${app.name} - Lifetime Access`
    };
  }
});

console.log('🔄 Products to update:\n');
Object.entries(appToStripeMap).forEach(([appId, data]) => {
  console.log(`  ${appId}:`);
  console.log(`    Current: "${data.currentName}"`);
  console.log(`    New: "${data.newName}"`);
  console.log('');
});

// Update product names
let updatedCount = 0;
for (const [appId, data] of Object.entries(appToStripeMap)) {
  try {
    console.log(`📝 Updating ${appId}...`);
    execSync(`stripe products update ${data.stripeId} --name="${data.newName}"`, { stdio: 'pipe' });
    console.log(`✅ Updated: "${data.currentName}" → "${data.newName}"\n`);
    updatedCount++;
  } catch (error) {
    console.log(`❌ Failed to update ${appId}: ${error.message}\n`);
  }
}

console.log(`🎉 Updated ${updatedCount} Stripe product names\n`);

// Verify updates
console.log('🔍 Verification - First 5 updated products:\n');
try {
  const result = execSync('stripe products list --limit 5', { encoding: 'utf8' });
  const data = JSON.parse(result);
  data.data.forEach(product => {
    console.log(`  "${product.name}"`);
  });
} catch (error) {
  console.log('❌ Verification failed:', error.message);
}

console.log('\n✨ Stripe product name updates complete!');
