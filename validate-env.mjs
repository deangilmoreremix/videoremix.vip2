#!/usr/bin/env node
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Check if we're in a production build environment
const isProduction = process.env.NODE_ENV === 'production' ||
                    process.env.CONTEXT === 'production' ||
                    process.env.BRANCH === 'main' ||
                    !existsSync(join(__dirname, '.env.lock'));

if (isProduction) {
  console.log('⚠️  Skipping environment validation in production build');
  console.log('   Environment variables should be set in Netlify dashboard');
  process.exit(0);
}

// Local development validation
console.log('🔍 Validating environment configuration...');

// Read the lock file
const lockFile = readFileSync(join(__dirname, '.env.lock'), 'utf-8');
const correctProjectId = lockFile.match(/LOCKED_PROJECT_ID=(.+)/)?.[1];
const correctUrl = lockFile.match(/LOCKED_SUPABASE_URL=(.+)/)?.[1];

if (!correctProjectId || !correctUrl) {
  console.error('❌ ERROR: Invalid .env.lock file format');
  process.exit(1);
}

// Read environment variables from .env file
const envPath = join(__dirname, '.env');
if (!existsSync(envPath)) {
  console.error('❌ ERROR: .env file not found');
  console.error('   Run: cp .env.example .env');
  process.exit(1);
}

const envFile = readFileSync(envPath, 'utf-8');
const currentUrl = envFile.match(/VITE_SUPABASE_URL=(.+)/)?.[1];

// Validate
if (!currentUrl) {
  console.error('❌ ERROR: VITE_SUPABASE_URL not found in .env file');
  console.error('   Add VITE_SUPABASE_URL to your .env file');
  process.exit(1);
}

if (currentUrl !== correctUrl) {
  console.error('❌ ERROR: Incorrect Supabase URL detected!');
  console.error(`   Current:  ${currentUrl}`);
  console.error(`   Expected: ${correctUrl}`);
  console.error(`   Project:  ${correctProjectId}`);
  console.error('');
  console.error('   Update your .env file with the correct URL');
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
