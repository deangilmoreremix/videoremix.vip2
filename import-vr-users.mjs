#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

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
  return password + 'Aa1!'; // Ensure it meets requirements
}

function parseName(fullName) {
  if (!fullName) return { first: '', last: '' };
  const parts = fullName.trim().split(' ');
  if (parts.length === 1) {
    return { first: parts[0], last: '' };
  }
  const last = parts.pop();
  const first = parts.join(' ');
  return { first, last };
}

async function importVRUsers() {
  console.log('🚀 Starting VR User List import...\n');

  const csvPath = join(__dirname, 'src/data/VR User List - PKS.csv');
  const records = parseCSV(csvPath);

  console.log(`📄 Found ${records.length} records in CSV\n`);

  const results = {
    total: records.length,
    usersCreated: 0,
    usersExisting: 0,
    skipped: 0,
    failed: 0,
    errors: []
  };

  const userCache = new Map();
  let processedCount = 0;

  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    const rowNum = i + 2;

    const email = record['Customer Email']?.toLowerCase().trim();
    const customerName = record['Customer Name']?.trim();

    // Skip if no email
    if (!email || email === '-' || !email.includes('@')) {
      results.skipped++;
      continue;
    }

    // Skip if already processed this email
    if (userCache.has(email)) {
      continue;
    }

    try {
      processedCount++;

      // Check if user exists
      const { data: existingUsers } = await supabase.auth.admin.listUsers();
      const found = existingUsers?.users?.find(u => u.email === email);

      if (found) {
        userCache.set(email, found.id);
        results.usersExisting++;
        if (processedCount % 50 === 0) {
          console.log(`✓ Processed ${processedCount} unique users...`);
        }
        continue;
      }

      // Parse name
      const { first, last } = parseName(customerName);

      // Create new user
      const password = generateRandomPassword();
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          first_name: first,
          last_name: last,
          full_name: customerName
        }
      });

      if (createError) {
        throw new Error(`Failed to create user: ${createError.message}`);
      }

      const userId = newUser.user.id;
      userCache.set(email, userId);

      // Add user role
      await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role: 'user'
        });

      results.usersCreated++;

      if (processedCount % 10 === 0) {
        console.log(`✅ Created ${results.usersCreated} users (${processedCount}/${records.length} processed)...`);
      }

      // Rate limiting - wait 100ms between creates
      await new Promise(resolve => setTimeout(resolve, 100));

    } catch (error) {
      console.error(`❌ Row ${rowNum} (${email}): ${error.message}`);
      results.failed++;
      results.errors.push({ row: rowNum, email, error: error.message });
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 Import Summary');
  console.log('='.repeat(60));
  console.log(`Total records processed: ${results.total}`);
  console.log(`Unique users found: ${userCache.size}`);
  console.log(`✅ New users created: ${results.usersCreated}`);
  console.log(`✓  Existing users: ${results.usersExisting}`);
  console.log(`⏭️  Skipped (invalid): ${results.skipped}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log('='.repeat(60));

  if (results.errors.length > 0 && results.errors.length <= 10) {
    console.log('\n❌ Errors:');
    results.errors.forEach(err => {
      console.log(`   Row ${err.row} (${err.email}): ${err.error}`);
    });
  } else if (results.errors.length > 10) {
    console.log(`\n❌ ${results.errors.length} errors occurred (showing first 10):`);
    results.errors.slice(0, 10).forEach(err => {
      console.log(`   Row ${err.row} (${err.email}): ${err.error}`);
    });
  }

  console.log('\n✅ Import complete!');
}

importVRUsers().catch(console.error);
