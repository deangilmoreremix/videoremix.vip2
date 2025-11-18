#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
const env = readFileSync(join(__dirname, '.env'), 'utf-8');
const envVars = {};
env.split('\n').forEach(line => {
  const [key, ...value] = line.split('=');
  if (key && value.length) {
    envVars[key.trim()] = value.join('=').trim();
  }
});

const supabase = createClient(
  envVars.VITE_SUPABASE_URL,
  envVars.SUPABASE_SERVICE_ROLE_KEY
);

// Parse CSV function
function parseCSV(csvText) {
  const lines = csvText.split('\n');
  const headers = parseCSVLine(lines[0]);
  const data = [];

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;

    const values = parseCSVLine(lines[i]);
    if (values.length < headers.length) continue;

    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index];
    });
    data.push(row);
  }

  return data;
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

async function main() {
  console.log('🚀 Starting bulk buyer import from CSV...\n');

  // Get CSV file path from command line args
  const csvFilePath = process.argv[2];

  if (!csvFilePath) {
    console.error('❌ Error: Please provide CSV file path');
    console.error('   Usage: node bulk-import-buyers.mjs <path-to-csv-file>');
    console.error('   Example: node bulk-import-buyers.mjs ./src/data/personalizer.csv\n');
    process.exit(1);
  }

  // Check if CSV file exists
  try {
    readFileSync(csvFilePath, 'utf-8');
  } catch (error) {
    console.error(`❌ Error: Cannot read CSV file at ${csvFilePath}`);
    console.error(`   ${error.message}\n`);
    process.exit(1);
  }

  // Read and parse CSV
  console.log('📖 Reading CSV file...');
  const csvText = readFileSync(csvFilePath, 'utf-8');
  const rows = parseCSV(csvText);
  console.log(`   Found ${rows.length} rows\n`);

  // Call the edge function
  console.log('☁️  Sending data to import function...\n');

  try {
    const response = await fetch(
      `${envVars.VITE_SUPABASE_URL}/functions/v1/import-personalizer-purchases`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${envVars.SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: rows }),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    console.log('📊 Import Results:\n');
    console.log(`   Total Rows:          ${result.total}`);
    console.log(`   ✅ Successful:       ${result.successful}`);
    console.log(`   ⏭️  Skipped:          ${result.skipped}`);
    console.log(`   ❌ Failed:           ${result.failed}`);
    console.log(`   👤 New Users:        ${result.usersCreated || 0}`);
    console.log(`   👥 Existing Users:   ${result.usersExisting || 0}`);
    console.log(`   🔐 App Access:       ${result.accessGranted || 0}`);

    if (result.errors && result.errors.length > 0) {
      console.log('\n⚠️  Errors encountered:');
      result.errors.slice(0, 10).forEach(error => {
        console.log(`   - ${error}`);
      });
      if (result.errors.length > 10) {
        console.log(`   ... and ${result.errors.length - 10} more errors`);
      }
    }

    console.log('\n✨ Import complete!\n');

    if (result.failed > 0) {
      console.log('💡 Tip: Check the errors above to see what went wrong.');
      console.log('   You can re-run the import after fixing the issues.\n');
    }

  } catch (error) {
    console.error('❌ Import failed:', error.message);
    process.exit(1);
  }
}

main().catch(console.error);
