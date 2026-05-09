#!/usr/bin/env node
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read the lock file
const lockFile = readFileSync(join(__dirname, '.env.lock'), 'utf-8');
const correctProjectId = lockFile.match(/LOCKED_PROJECT_ID=(.+)/)[1];
const correctUrl = lockFile.match(/LOCKED_SUPABASE_URL=(.+)/)[1];

// Read the .env file
const envFile = readFileSync(join(__dirname, '.env'), 'utf-8');
const currentUrl = envFile.match(/VITE_SUPABASE_URL=(.+)/)?.[1];

// Validate
if (!currentUrl) {
  console.error('❌ ERROR: VITE_SUPABASE_URL not found in .env file');
  process.exit(1);
}

if (currentUrl !== correctUrl) {
  console.error('❌ ERROR: Incorrect Supabase URL detected!');
  console.error(`   Current:  ${currentUrl}`);
  console.error(`   Expected: ${correctUrl}`);
  console.error(`   Project:  ${correctProjectId}`);
  console.error('');
  console.error('   Run: cp .env.example .env');
  process.exit(1);
}

// Check if the project ID in the URL matches
if (!currentUrl.includes(correctProjectId)) {
  console.error('❌ ERROR: Project ID mismatch!');
  console.error(`   URL contains wrong project ID`);
  console.error(`   Expected: ${correctProjectId}`);
  process.exit(1);
}

console.log('✅ Supabase configuration is correct');
console.log(`   Project: ${correctProjectId}`);
console.log(`   URL: ${correctUrl}`);
