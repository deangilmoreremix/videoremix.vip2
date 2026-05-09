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
  let content = fs.readFileSync(filePath, 'utf-8');

  // Preprocess: normalize mixed delimiters
  // Replace tab-separated sections with comma-separated (but preserve quoted commas)
  const lines = content.split('\n');
  const normalizedLines = [];

  for (const line of lines) {
    if (line.trim() === '') continue;

    // If line contains tabs and fewer than 8 commas, it's likely tab-separated
    const commaCount = (line.match(/,/g) || []).length;
    const tabCount = (line.match(/\t/g) || []).length;

    if (tabCount > commaCount && commaCount < 7) {
      // Convert tabs to commas (but avoid quoted sections)
      let normalized = line;
      // Simple replacement - this won't handle quoted tabs perfectly, but better than nothing
      normalized = normalized.replace(/\t/g, ',');
      normalizedLines.push(normalized);
    } else {
      normalizedLines.push(line);
    }
  }

  content = normalizedLines.join('\n');

  // Now parse with comma delimiter
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

function transformUsersToImportCSV(records, sourceName) {
    // Format: first_name,last_name,email,total_spend,total_orders,last_purchase,segment,products_purchased
    const users = new Map();
    let processed = 0;
    let skipped = 0;

    for (let i = 1; i < records.length; i++) {
        const row = records[i];
        processed++;

        // Debug first few rows
        if (i <= 3) {
            console.log(`   Row ${i}: ${row.length} columns - ${row.slice(0, 3).join(', ')}...`);
        }

        // The CSV parser should handle quoted fields correctly, so check if we have at least the basic fields
        if (row.length < 3) {
            console.log(`   Skipping row ${i}: insufficient columns (${row.length})`);
            skipped++;
            continue;
        }

        const firstName = row[0]?.trim() || '';
        const lastName = row[1]?.trim() || '';
        const email = row[2]?.toLowerCase().trim() || '';

        if (!email) {
            console.log(`   Skipping row ${i}: no email`);
            skipped++;
            continue;
        }

        const customerName = `${firstName} ${lastName}`.trim() || 'Unknown';

        if (!users.has(email)) {
            users.set(email, {
                name: customerName,
                email: email,
                campaign: sourceName,
                products: new Set(),
            });
        }

        // Parse products_purchased (should be last column, may contain pipes)
        const productsPurchased = row[row.length - 1]?.trim() || ''; // Last column
        if (productsPurchased && productsPurchased !== 'nan') {
            const products = productsPurchased.split('|').map(p => p.trim()).filter(p => p && p !== 'nan');
            for (const product of products) {
                users.get(email).products.add(product);
            }
        } else {
            // Add the segment as a product if no specific products (6th column)
            const segment = row.length > 6 ? (row[6]?.trim() || '') : '';
            if (segment) {
                users.get(email).products.add(segment);
            }
        }
    }

    console.log(`   Processed ${processed} rows, skipped ${skipped}, found ${users.size} unique users`);
    return users;
}

function transformSimpleCSVFirstname(records, sourceName) {
    // Format: firstname,lastname,email
    const users = new Map();
    let processed = 0;
    let skipped = 0;

    for (let i = 1; i < records.length; i++) {
        const row = records[i];
        processed++;

        // Debug first few rows
        if (i <= 3) {
            console.log(`   Row ${i}: ${row.length} columns - ${row.slice(0, 3).join(', ')}...`);
        }

        if (row.length < 3) {
            console.log(`   Skipping row ${i}: insufficient columns (${row.length})`);
            skipped++;
            continue;
        }

        const firstName = row[0]?.trim() || '';
        const lastName = row[1]?.trim() || '';
        const email = row[2]?.toLowerCase().trim() || '';

        if (!email || !email.includes('@')) {
            console.log(`   Skipping row ${i}: invalid email "${email}"`);
            skipped++;
            continue;
        }

        const customerName = `${firstName} ${lastName}`.trim() || 'Unknown';

        if (!users.has(email)) {
            users.set(email, {
                name: customerName,
                email: email,
                campaign: sourceName,
                products: new Set(['Basic Access']), // Default product for simple contact lists
            });
        }
    }

    console.log(`   Processed ${processed} rows, skipped ${skipped}, found ${users.size} unique users`);
    return users;
}

function transformZaxxaCSV(records, sourceName) {
    // Format: Zaxxa CSV with customer email and product name
    const users = new Map();
    let processed = 0;
    let skipped = 0;

    for (let i = 1; i < records.length; i++) {
        const row = records[i];
        processed++;

        // Debug first few rows
        if (i <= 3) {
            console.log(`   Row ${i}: ${row.length} columns - ${row.slice(0, 3).join(', ')}...`);
        }

        // Find email and product name columns (they might be at different indices)
        let email = '';
        let productName = '';
        let customerName = '';

        // Try to find the columns by header names or position
        for (let j = 0; j < row.length; j++) {
            const cell = row[j]?.toLowerCase().trim() || '';
            if (cell.includes('@') && cell.includes('.')) {
                email = cell;
            }
            if (j === 0 && row[0]) customerName = row[0]; // First column might be name
            if (j === 2 && row[2]) productName = row[2]; // Third column might be product
        }

        // Fallback: assume email is in column 15, product in column 2, name in column 7
        if (!email && row[15]) email = row[15].toLowerCase().trim();
        if (!productName && row[2]) productName = row[2].trim();
        if (!customerName && row[7]) customerName = row[7].trim();

        if (!email || !email.includes('@')) {
            console.log(`   Skipping row ${i}: no valid email found`);
            skipped++;
            continue;
        }

        if (!users.has(email)) {
            users.set(email, {
                name: customerName || 'Unknown',
                email: email,
                campaign: sourceName,
                products: new Set(),
            });
        }

        if (productName) {
            users.get(email).products.add(productName);
        }
    }

    console.log(`   Processed ${processed} rows, skipped ${skipped}, found ${users.size} unique users`);
    return users;
}

function transformUserListTXT(content, sourceName) {
    // Format: "FirstName LastName email@domain.com" (one per line)
    const users = new Map();
    const lines = content.split('\n');
    let processed = 0;
    let skipped = 0;

    for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine) continue;

        processed++;

        // Debug first few lines
        if (processed <= 3) {
            console.log(`   Line ${processed}: ${trimmedLine}`);
        }

        // Parse: split by spaces, last part is email, rest is name
        const parts = trimmedLine.split(/\s+/);
        if (parts.length < 2) {
            console.log(`   Skipping line ${processed}: insufficient parts (${parts.length})`);
            skipped++;
            continue;
        }

        const email = parts[parts.length - 1]?.toLowerCase().trim();
        const nameParts = parts.slice(0, -1);

        // Basic email validation
        if (!email || !email.includes('@')) {
            console.log(`   Skipping line ${processed}: invalid email "${email}"`);
            skipped++;
            continue;
        }

        const customerName = nameParts.join(' ').trim() || 'Unknown';

        if (!users.has(email)) {
            users.set(email, {
                name: customerName,
                email: email,
                campaign: sourceName,
                products: new Set(['Basic Access']), // Default product for text lists
            });
        }
    }

    console.log(`   Processed ${processed} lines, skipped ${skipped}, found ${users.size} unique users`);
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
  let fileCount = 0;

// Function to find all CSV and TXT files in the workspace
function findAllDataFiles() {
    const dataFiles = [];
    const searchDirs = [DATA_DIR, __dirname]; // src/data and project root

    // Add specific known files that might not be found by pattern matching
    const specificFiles = [
        path.join(__dirname, 'src/data/top_500_customers.csv'),
        path.join(__dirname, 'src/data/VR User List - PKS.csv'),
        path.join(__dirname, 'src/data/user_contacts_clean.csv'),
        path.join(__dirname, 'src/data/personalizer  copy copy copy.csv'),
        path.join(__dirname, 'src/data/personalizer  copy copy.csv'),
        path.join(__dirname, 'src/data/personalizer  copy.csv'),
        path.join(__dirname, 'src/data/personalizer .csv'),
    ];

    for (const dir of searchDirs) {
        try {
            const files = fs.readdirSync(dir);
            for (const file of files) {
                if ((file.endsWith('.csv') || file.endsWith('.txt')) && !file.includes('all_users_for_import')) {
                    dataFiles.push(path.join(dir, file));
                }
            }
        } catch (error) {
            // Skip directories that don't exist
            continue;
        }
    }

    // Add specific files if they exist
    for (const filePath of specificFiles) {
        if (fs.existsSync(filePath) && !dataFiles.includes(filePath)) {
            dataFiles.push(filePath);
        }
    }

    return dataFiles;
}

  // Get all data files (CSV and TXT)
  const dataFiles = findAllDataFiles();
  console.log(`Found ${dataFiles.length} data files to process:\n`);

  // Process each data file
  for (const dataFile of dataFiles) {
    fileCount++;
    const fileName = path.basename(dataFile);
    console.log(`${fileCount}. Processing ${fileName}...`);

    try {
      if (fileName.endsWith('.csv')) {
        // Process CSV file
        const records = parseCSV(dataFile);
        let users = new Map();

        // Determine format and process accordingly
        if (records.length === 0) {
          console.log(`   Empty file, skipping`);
          continue;
        }

        const headers = records[0];
        const headerStr = headers.join(',').toLowerCase();
        console.log(`   Headers: ${headerStr}`);

        // Check format based on headers
        console.log(`   Checking format conditions...`);
        console.log(`   - Has products_purchased: ${headerStr.includes('products_purchased')}`);
        console.log(`   - Has first_name,last_name,email: ${headerStr.includes('first_name') && headerStr.includes('last_name') && headerStr.includes('email')}`);
        console.log(`   - Has firstname,lastname,email: ${headerStr.includes('firstname') && headerStr.includes('lastname') && headerStr.includes('email')}`);

        if (headerStr.includes('customer name') && headerStr.includes('customer email') && headerStr.includes('campaign')) {
          console.log(`   → VR User List format`);
          users = transformVRUserList(records);
        } else if (headerStr.includes('products_purchased')) {
          console.log(`   → users_to_import format`);
          users = transformUsersToImportCSV(records, fileName);
        } else if (headerStr.includes('first_name') && headerStr.includes('last_name') && headerStr.includes('email')) {
          console.log(`   → Simple contact format (first_name)`);
          users = transformSimpleCSV(records, fileName);
        } else if (headerStr.includes('firstname') && headerStr.includes('lastname') && headerStr.includes('email')) {
          console.log(`   → Simple contact format (firstname)`);
          users = transformSimpleCSVFirstname(records, fileName);
        } else if (headerStr.includes('customer name') && headerStr.includes('customer email') && headerStr.includes('product name')) {
          console.log(`   → Personalizer format`);
          users = transformPersonalizerCSV(records);
        } else if (headerStr.includes('customer email') && headerStr.includes('product name')) {
          console.log(`   → Zaxxa format`);
          users = transformZaxxaCSV(records, fileName);
        } else {
          console.log(`   → Unknown CSV format, attempting simple contact format`);
          users = transformSimpleCSV(records, fileName);
        }

        console.log(`   Found ${users.size} unique users`);
        allUsers.push(users);

      } else if (fileName.endsWith('.txt')) {
        // Process TXT file
        console.log(`   → User list text format`);
        const content = fs.readFileSync(dataFile, 'utf-8');
        const users = transformUserListTXT(content, fileName);
        console.log(`   Found ${users.size} unique users`);
        allUsers.push(users);
      } else {
        console.log(`   → Unsupported file type, skipping`);
      }

    } catch (error) {
      console.error(`   Error processing ${fileName}:`, error.message);
    }
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