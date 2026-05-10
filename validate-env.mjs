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

// Read environment variables from either .env file or process.env
let currentUrl;
try {
  const envFile = readFileSync(join(__dirname, '.env'), 'utf-8');
  currentUrl = envFile.match(/VITE_SUPABASE_URL=(.+)/)?.[1];
} catch (error) {
  // .env file doesn't exist, check process.env (for production deployments)
  currentUrl = process.env.VITE_SUPABASE_URL;
}

// Validate
if (!currentUrl) {
  console.error('❌ ERROR: VITE_SUPABASE_URL not found in .env file or environment variables');
  console.error('   For local development: copy .env.example to .env');
  console.error('   For production: set VITE_SUPABASE_URL environment variable');
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
