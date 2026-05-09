#!/usr/bin/env node
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read the lock file
const lockFile = readFileSync(join(__dirname, '.env.lock'), 'utf-8');
const correctProjectId = lockFile.match(/LOCKED_PROJECT_ID=(.+)/)[1];
const correctUrl = lockFile.match(/LOCKED_SUPABASE_URL=(.+)/)[1];

// Try to read .env file, but don't fail if it doesn't exist (for Netlify builds)
let currentUrl = null;
const envPath = join(__dirname, '.env');

if (existsSync(envPath)) {
  // Local development - validate .env file
  const envFile = readFileSync(envPath, 'utf-8');
  currentUrl = envFile.match(/VITE_SUPABASE_URL=(.+)/)?.[1];
  
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

  console.log('✅ Supabase configuration is correct (from .env)');
  console.log(`   Project: ${correctProjectId}`);
  console.log(`   URL: ${currentUrl}`);
} else {
  // Netlify/production - check process.env
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ ERROR: Missing required environment variables!');
    if (!supabaseUrl) console.error('   Missing: VITE_SUPABASE_URL');
    if (!supabaseAnonKey) console.error('   Missing: VITE_SUPABASE_ANON_KEY');
    console.error('   Set these in Netlify dashboard or netlify.toml');
    process.exit(1);
  }

  console.log('✅ Supabase configuration is correct (from environment variables)');
  console.log(`   Project: ${correctProjectId}`);
  console.log(`   URL: ${supabaseUrl}`);
}
