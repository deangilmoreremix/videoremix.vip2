#!/usr/bin/env node
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Check if we're in CI environment
const isCI = process.env.CI === 'true' || 
             process.env.GITHUB_ACTIONS === 'true' ||
             process.env.NETLIFY === 'true' ||
             process.env.CI_ENVIRONMENT === 'true';

// Check if we're in a production build environment
const isProduction = process.env.NODE_ENV === 'production' ||
                      process.env.CONTEXT === 'production' ||
                      process.env.BRANCH === 'main' ||
                      (!isCI && !existsSync(join(__dirname, '.env.lock')));

// Always validate environment configuration
console.log('🔍 Validating environment configuration...');
console.log(`   Environment: ${isCI ? 'CI' : isProduction ? 'Production' : 'Development'}`);

if (isCI) {
  // CI validation - only check environment variables, no .env file required
  console.log('🚀 Running in CI mode - validating environment variables only...');
  
  let supabaseUrl = process.env.VITE_SUPABASE_URL;
  let supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    console.error('❌ ERROR: VITE_SUPABASE_URL environment variable not set');
    console.error('   Please add VITE_SUPABASE_URL to your CI environment variables');
    process.exit(1);
  }

  if (!supabaseAnonKey) {
    console.error('❌ ERROR: VITE_SUPABASE_ANON_KEY environment variable not set');
    console.error('   Please add VITE_SUPABASE_ANON_KEY to your CI environment variables');
    process.exit(1);
  }

  // Additional validation for production
  if (isProduction) {
    if (!supabaseUrl.startsWith('https://')) {
      console.error('❌ ERROR: VITE_SUPABASE_URL must use HTTPS in production');
      process.exit(1);
    }

    if (supabaseUrl.includes('localhost') || supabaseUrl.includes('127.0.0.1')) {
      console.error('❌ ERROR: VITE_SUPABASE_URL cannot point to localhost in production');
      process.exit(1);
    }
  }

  console.log('✅ CI environment validation passed');
  console.log(`   Supabase URL: ${supabaseUrl}`);
  process.exit(0);
}

if (isProduction) {
  // Production validation - check environment variables
  let supabaseUrl = process.env.VITE_SUPABASE_URL;
  let supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

  // In local production builds, also check .env file
  if (!supabaseUrl || !supabaseAnonKey) {
    try {
      const envPath = join(__dirname, '.env');
      if (existsSync(envPath)) {
        const envFile = readFileSync(envPath, 'utf-8');
        supabaseUrl = supabaseUrl || envFile.match(/VITE_SUPABASE_URL=(.+)/)?.[1];
        supabaseAnonKey = supabaseAnonKey || envFile.match(/VITE_SUPABASE_ANON_KEY=(.+)/)?.[1];
      }
    } catch (error) {
      // Ignore errors reading .env file
    }
  }

  if (!supabaseUrl) {
    console.error('❌ ERROR: VITE_SUPABASE_URL environment variable not set');
    console.error('   Set VITE_SUPABASE_URL in your environment or .env file');
    process.exit(1);
  }

  if (!supabaseAnonKey) {
    console.error('❌ ERROR: VITE_SUPABASE_ANON_KEY environment variable not set');
    console.error('   Set VITE_SUPABASE_ANON_KEY in your environment or .env file');
    process.exit(1);
  }

  // Additional validation for production
  if (!supabaseUrl.startsWith('https://')) {
    console.error('❌ ERROR: VITE_SUPABASE_URL must use HTTPS in production');
    process.exit(1);
  }

  if (supabaseUrl.includes('localhost') || supabaseUrl.includes('127.0.0.1')) {
    console.error('❌ ERROR: VITE_SUPABASE_URL cannot point to localhost in production');
    process.exit(1);
  }

  console.log('✅ Production environment validation passed');
  console.log(`   Supabase URL: ${supabaseUrl}`);
} else {
  // Local development validation
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
  const currentAnonKey = envFile.match(/VITE_SUPABASE_ANON_KEY=(.+)/)?.[1];

  // Validate URL
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

  // Validate anon key
  if (!currentAnonKey) {
    console.error('❌ ERROR: VITE_SUPABASE_ANON_KEY not found in .env file');
    console.error('   Add VITE_SUPABASE_ANON_KEY to your .env file');
    process.exit(1);
  }

  console.log('✅ Supabase configuration is correct');
  console.log(`   Project: ${correctProjectId}`);
  console.log(`   URL: ${correctUrl}`);
}
