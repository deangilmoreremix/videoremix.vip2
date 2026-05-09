const fs = require('fs');
const path = require('path');

const filePath = process.argv[2] || '/workspaces/videoremix.vip2/users_to_import.csv';

if (!fs.existsSync(filePath)) {
  console.error(`File not found: ${filePath}`);
  process.exit(1);
}

const fileContent = fs.readFileSync(filePath, 'utf8');
const lines = fileContent.split('\n').filter(line => line.trim() !== '');

if (lines.length === 0) {
  console.log('CSV file is empty');
  process.exit(0);
}

// Parse headers
const headerLine = lines[0];
const headers = headerLine.split(',').map(h => h.trim());
const productIndex = headers.findIndex(h => h.toLowerCase() === 'products_purchased');

if (productIndex === -1) {
  console.error('Could not find products_purchased column in CSV. Headers:', headers);
  process.exit(1);
}

// Process each data row
const productSet = new Set();

for (let i = 1; i < lines.length; i++) {
  const line = lines[i].trim();
  if (line === '') continue;

  // Parse CSV line respecting quotes
  const values = [];
  let current = '';
  let inQuotes = false;

  for (let j = 0; j < line.length; j++) {
    const char = line[j];

    if (char === '"' && (j === 0 || line[j-1] !== '\\')) {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  // Add the last field
  values.push(current.trim());

  // We expect at least 8 fields (if total_spend has no comma)
  // If total_spend has commas, we will have more fields.
  if (values.length < 8) {
    console.warn(`Skipping row ${i + 1}: insufficient columns (${values.length} < 8)`);
    continue;
  }

  // Extract fields using known structure:
  // 0: first_name
  // 1: last_name
  // 2: email
  // 3..(n-5): total_spend (possibly split into multiple fields due to commas)
  // (n-4): total_orders
  // (n-3): last_purchase
  // (n-2): segment
  // (n-1): products_purchased
  const productIndexInValues = values.length - 1;
  const productName = values[productIndexInValues];

  if (productName && productName !== 'nan' && productName.trim() !== '') {
    // Remove surrounding quotes if present
    let cleanProductName = productName.trim();
    if (cleanProductName.startsWith('"') && cleanProductName.endsWith('"')) {
      cleanProductName = cleanProductName.slice(1, -1);
    }

    // Split pipe-separated products and add each one to the set
    const productNames = cleanProductName.split(' | ').map(p => p.trim()).filter(p => p !== '');
    productNames.forEach(p => productSet.add(p));
  }
}

console.log(`Found ${productSet.size} unique product names in CSV:`);
const sortedProducts = Array.from(productSet).sort();
sortedProducts.forEach((product, index) => {
  console.log(`${index + 1}: ${product}`);
});

// Write to a file for easy reference
fs.writeFileSync('/workspaces/videoremix.vip2/csv-products.txt', sortedProducts.join('\n'));
console.log('\nWritten to /workspaces/videoremix.vip2/csv-products.txt');