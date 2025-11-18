import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
const envPath = join(__dirname, '.env');
const envContent = readFileSync(envPath, 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length) {
    envVars[key.trim()] = valueParts.join('=').trim();
  }
});

const SUPABASE_URL = envVars.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = envVars.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

// Create Supabase admin client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Parse CSV
function parseCSV(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());
  const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());

  const records = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const record = {};
    headers.forEach((header, index) => {
      record[header] = values[index] || '';
    });
    records.push(record);
  }

  return records;
}

function parseCSVLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  values.push(current.trim());
  return values;
}

function generateRandomPassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < 16; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

function mapProductToSlug(productName) {
  const normalizedName = productName.toLowerCase();

  if (normalizedName.includes('monthly')) {
    return 'personalizer-monthly';
  } else if (normalizedName.includes('lifetime')) {
    return 'personalizer-lifetime';
  } else if (normalizedName.includes('yearly')) {
    return 'personalizer-yearly';
  } else if (normalizedName.includes('writing toolkit')) {
    return 'personalizer-writing-toolkit';
  } else if (normalizedName.includes('text-video')) {
    return 'personalizer-text-video-editor';
  } else if (normalizedName.includes('url video')) {
    return 'personalizer-url-video';
  } else if (normalizedName.includes('interactive shopping')) {
    return 'personalizer-interactive-shopping';
  } else if (normalizedName.includes('video and image transformer')) {
    return 'personalizer-video-transformer';
  }

  return null;
}

async function importUsers() {
  console.log('🚀 Starting user import from CSV...\n');

  const csvPath = join(__dirname, 'src/data/personalizer  copy.csv');
  const records = parseCSV(csvPath);

  console.log(`📄 Found ${records.length} purchase records\n`);

  const results = {
    total: records.length,
    successful: 0,
    skipped: 0,
    failed: 0,
    errors: []
  };

  const userCache = new Map();

  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    const rowNum = i + 2; // +2 because of 0-index and header row

    const email = record['CUSTOMER EMAIL']?.toLowerCase().trim();
    const productName = record['PRODUCT NAME'];
    const status = record['PAYMENT STATUS'];
    const amount = parseFloat(record['AMOUNT']?.replace('$', '') || '0');
    const date = record['DATE'];
    const zaxaaTxnId = record['ZAXAA TXN ID'];
    const paypalTxnId = record['PAYPAL TXN ID'];
    const customerName = record['CUSTOMER NAME'];

    // Skip if no email or refunded
    if (!email || email === '-' || status.toLowerCase().includes('refund')) {
      console.log(`⏭️  Row ${rowNum}: Skipped (${!email ? 'no email' : 'refunded'})`);
      results.skipped++;
      continue;
    }

    try {
      let userId;

      // Check cache first
      if (userCache.has(email)) {
        userId = userCache.get(email);
        console.log(`✓ Row ${rowNum}: Using cached user for ${email}`);
      } else {
        // Check if user exists
        const { data: existingUser } = await supabase.auth.admin.listUsers();
        const found = existingUser?.users?.find(u => u.email === email);

        if (found) {
          userId = found.id;
          userCache.set(email, userId);
          console.log(`✓ Row ${rowNum}: Found existing user ${email}`);
        } else {
          // Create new user
          const password = generateRandomPassword();
          const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: {
              full_name: customerName
            }
          });

          if (createError) {
            throw new Error(`Failed to create user: ${createError.message}`);
          }

          userId = newUser.user.id;
          userCache.set(email, userId);
          console.log(`✅ Row ${rowNum}: Created new user ${email}`);
        }
      }

      // Get product ID
      const productSlug = mapProductToSlug(productName);
      if (!productSlug) {
        throw new Error(`Unknown product: ${productName}`);
      }

      // Record the purchase (simplified - you'll need products_catalog table)
      console.log(`   💳 Purchase: ${productName} ($${amount}) - ${status}`);

      results.successful++;

    } catch (error) {
      console.error(`❌ Row ${rowNum}: Error - ${error.message}`);
      results.failed++;
      results.errors.push({ row: rowNum, email, error: error.message });
    }
  }

  console.log('\n📊 Import Summary:');
  console.log(`   Total records: ${results.total}`);
  console.log(`   ✅ Successful: ${results.successful}`);
  console.log(`   ⏭️  Skipped: ${results.skipped}`);
  console.log(`   ❌ Failed: ${results.failed}`);
  console.log(`   👥 Unique users created: ${userCache.size}`);

  if (results.errors.length > 0) {
    console.log('\n❌ Errors:');
    results.errors.forEach(err => {
      console.log(`   Row ${err.row} (${err.email}): ${err.error}`);
    });
  }
}

// Run the import
importUsers().catch(console.error);
