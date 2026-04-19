import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'src', 'data');
const OUTPUT_FILE = path.join(__dirname, 'all_users_for_import.csv');

// Standard output format
const OUTPUT_HEADERS = ['Customer Name', 'Customer Email', 'Campaign', 'Product'];

function parseCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  return parse(content, {
    skip_empty_lines: true,
    trim: true,
    relax_column_count: true,
    relax_quotes: true,
  });
}

function transformVRUserList(records) {
  // Already in correct format: Customer Name, Customer Email, Campaign, Product
  const users = new Map();
  
  for (let i = 1; i < records.length; i++) {
    const row = records[i];
    if (row.length < 4) continue;
    
    const customerName = row[0]?.trim();
    const customerEmail = row[1]?.toLowerCase().trim();
    const campaign = row[2]?.trim() || 'VR User List';
    const product = row[3]?.trim() || '';
    
    if (!customerEmail) continue;
    
    if (!users.has(customerEmail)) {
      users.set(customerEmail, {
        name: customerName,
        email: customerEmail,
        campaign,
        products: new Set(),
      });
    }
    if (product) {
      users.get(customerEmail).products.add(product);
    }
  }
  
  return users;
}

function transformSimpleCSV(records, sourceName) {
  // Simple format: firstName, lastName, email
  const users = new Map();
  
  for (let i = 1; i < records.length; i++) {
    const row = records[i];
    if (row.length < 3) continue;
    
    const firstName = row[0]?.trim();
    const lastName = row[1]?.trim();
    const email = row[2]?.toLowerCase().trim();
    
    if (!email) continue;
    
    const customerName = `${firstName} ${lastName}`.trim() || 'Unknown';
    
    if (!users.has(email)) {
      users.set(email, {
        name: customerName,
        email,
        campaign: sourceName,
        products: new Set(),
      });
    }
  }
  
  return users;
}

function transformPersonalizerCSV(records) {
  // Complex format with many columns
  // Key columns: CUSTOMER NAME, CUSTOMER EMAIL, PRODUCT NAME, PAYMENT STATUS, etc.
  const users = new Map();
  
  // Find column indices
  const headers = records[0].map(h => h?.toLowerCase().trim() || '');
  
  const nameIdx = headers.findIndex(h => h.includes('customer name'));
  const emailIdx = headers.findIndex(h => h.includes('customer email'));
  const productIdx = headers.findIndex(h => h.includes('product name'));
  const statusIdx = headers.findIndex(h => h.includes('payment status'));
  
  console.log(`Personalizer columns - Name: ${nameIdx}, Email: ${emailIdx}, Product: ${productIdx}, Status: ${statusIdx}`);
  
  for (let i = 1; i < records.length; i++) {
    const row = records[i];
    
    const customerName = nameIdx >= 0 ? row[nameIdx]?.trim() : '';
    const customerEmail = emailIdx >= 0 ? row[emailIdx]?.toLowerCase().trim() : '';
    const productName = productIdx >= 0 ? row[productIdx]?.trim() : '';
    const paymentStatus = statusIdx >= 0 ? row[statusIdx]?.trim() : '';
    
    if (!customerEmail) continue;
    
    // Only include completed payments
    if (!paymentStatus.toLowerCase().includes('completed')) {
      continue;
    }
    
    if (!users.has(customerEmail)) {
      users.set(customerEmail, {
        name: customerName || 'Unknown',
        email: customerEmail,
        campaign: 'Personalizer Purchase',
        products: new Set(),
      });
    }
    if (productName) {
      users.get(customerEmail).products.add(productName);
    }
  }
  
  return users;
}

function mergeUsers(...userMaps) {
  const merged = new Map();
  
  for (const users of userMaps) {
    for (const [email, userData] of users) {
      if (!merged.has(email)) {
        merged.set(email, {
          name: userData.name,
          email: userData.email,
          campaign: userData.campaign,
          products: new Set(userData.products),
        });
      } else {
        // Merge products
        for (const product of userData.products) {
          merged.get(email).products.add(product);
        }
      }
    }
  }
  
  return merged;
}

function generateOutputCSV(users) {
  const lines = [OUTPUT_HEADERS.join(',')];
  
  for (const [email, user] of users) {
    if (user.products.size === 0) {
      // User with no products
      lines.push(`"${user.name}","${user.email}","${user.campaign}",""`);
    } else {
      // One row per product
      for (const product of user.products) {
        lines.push(`"${user.name}","${user.email}","${user.campaign}","${product}"`);
      }
    }
  }
  
  return lines;
}

async function main() {
  console.log('Starting comprehensive CSV transformation...\n');
  
  const allUsers = [];
  
  // 1. Transform VR User List (already in correct format)
  console.log('1. Processing VR User List - PKS.csv...');
  const vrRecords = parseCSV(path.join(DATA_DIR, 'VR User List - PKS.csv'));
  const vrUsers = transformVRUserList(vrRecords);
  console.log(`   Found ${vrUsers.size} unique users`);
  allUsers.push(vrUsers);
  
  // 2. Transform top_500_customers.csv
  console.log('2. Processing top_500_customers.csv...');
  const top500Records = parseCSV(path.join(DATA_DIR, 'top_500_customers.csv'));
  const top500Users = transformSimpleCSV(top500Records, 'Top 500 Customers');
  console.log(`   Found ${top500Users.size} unique users`);
  allUsers.push(top500Users);
  
  // 3. Transform user_contacts_clean.csv
  console.log('3. Processing user_contacts_clean.csv...');
  const contactsRecords = parseCSV(path.join(DATA_DIR, 'user_contacts_clean.csv'));
  const contactsUsers = transformSimpleCSV(contactsRecords, 'User Contacts');
  console.log(`   Found ${contactsUsers.size} unique users`);
  allUsers.push(contactsUsers);
  
  // 4. Transform personalizer .csv
  console.log('4. Processing personalizer .csv...');
  const personalizerRecords = parseCSV(path.join(DATA_DIR, 'personalizer .csv'));
  const personalizerUsers = transformPersonalizerCSV(personalizerRecords);
  console.log(`   Found ${personalizerUsers.size} unique users`);
  allUsers.push(personalizerUsers);
  
  // 5. Also check if there's users_for_import.csv (from previous transformation)
  const legacyFile = path.join(__dirname, 'users_for_import.csv');
  if (fs.existsSync(legacyFile)) {
    console.log('5. Processing legacy users_for_import.csv...');
    const legacyRecords = parseCSV(legacyFile);
    const legacyUsers = new Map();
    
    for (let i = 1; i < legacyRecords.length; i++) {
      const row = legacyRecords[i];
      if (row.length < 4) continue;
      
      const customerName = row[0]?.trim();
      const customerEmail = row[1]?.toLowerCase().trim();
      const campaign = row[2]?.trim() || 'Legacy Import';
      const product = row[3]?.trim() || '';
      
      if (!customerEmail) continue;
      
      if (!legacyUsers.has(customerEmail)) {
        legacyUsers.set(customerEmail, {
          name: customerName,
          email: customerEmail,
          campaign,
          products: new Set(),
        });
      }
      if (product) {
        legacyUsers.get(customerEmail).products.add(product);
      }
    }
    
    console.log(`   Found ${legacyUsers.size} unique users`);
    allUsers.push(legacyUsers);
  }
  
  // Merge all users
  console.log('\nMerging all user data...');
  const mergedUsers = mergeUsers(...allUsers);
  console.log(`Total unique users after merge: ${mergedUsers.size}`);
  
  // Count total products
  let totalProductRows = 0;
  for (const user of mergedUsers.values()) {
    totalProductRows += Math.max(1, user.products.size);
  }
  console.log(`Total output rows (one per product): ${totalProductRows}`);
  
  // Generate output
  console.log('\nGenerating output CSV...');
  const outputLines = generateOutputCSV(mergedUsers);
  
  // Write output
  fs.writeFileSync(OUTPUT_FILE, outputLines.join('\n'), 'utf-8');
  
  console.log(`\n✅ Transformation complete!`);
  console.log(`   Output file: ${OUTPUT_FILE}`);
  console.log(`   Total unique users: ${mergedUsers.size}`);
  console.log(`   Total rows (with products): ${outputLines.length - 1}`);
  
  // Show sample
  console.log('\nSample output (first 5 rows):');
  for (let i = 1; i <= 5 && i < outputLines.length; i++) {
    console.log(`   ${outputLines[i]}`);
  }
  
  return {
    uniqueUsers: mergedUsers.size,
    totalRows: outputLines.length - 1,
    outputFile: OUTPUT_FILE,
  };
}

main().catch(console.error);
