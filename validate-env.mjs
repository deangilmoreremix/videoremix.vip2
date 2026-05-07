#!/usr/bin/env node
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const envPath = join(__dirname, '.env');
const lockFilePath = join(__dirname, '.env.lock');

// Read .env.lock to get locked values if available
let correctProjectId, correctUrl;
if (existsSync(lockFilePath)) {
  const lockFile = readFileSync(lockFilePath, 'utf-8');
  correctProjectId = lockFile.match(/LOCKED_PROJECT_ID=(.+)/)?.[1];
  correctUrl = lockFile.match(/LOCKED_SUPABASE_URL=(.+)/)?.[1];
}

// Read .env file
let envVars = {};
if (existsSync(envPath)) {
  const envFile = readFileSync(envPath, 'utf-8');
  envFile.split('\n').forEach(line => {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      envVars[match[1].trim()] = match[2].trim();
    }
  });
}

// Required environment variables
const requiredVars = [
  { name: 'VITE_SUPABASE_URL', required: true },
  { name: 'VITE_SUPABASE_ANON_KEY', required: true },
];

// Optional but recommended
const optionalVars = [
  { name: 'VITE_OPENAI_API_KEY', required: false },
  { name: 'VITE_ANTHROPIC_API_KEY', required: false },
  { name: 'VITE_SENTRY_DSN', required: false },
];

let hasErrors = false;

// Check required variables
console.log('🔍 Validating environment variables...\n');

for (const { name } of requiredVars) {
  const value = process.env[name] || envVars[name];
  
  if (!value) {
    console.error(`❌ ERROR: ${name} is not set`);
    hasErrors = true;
  } else if (name === 'VITE_SUPABASE_URL') {
    // Validate Supabase URL format
    if (!value.includes('supabase.co')) {
      console.error(`❌ ERROR: ${name} does not appear to be a valid Supabase URL`);
      console.error(`   Got: ${value}`);
      hasErrors = true;
    }
    
    // Check against locked project ID if available
    if (correctProjectId && !value.includes(correctProjectId)) {
      console.error(`❌ ERROR: Project ID mismatch in ${name}`);
      console.error(`   Expected: ${correctProjectId}`);
      console.error(`   URL: ${value}`);
      hasErrors = true;
    }
  } else if (name === 'VITE_SUPABASE_ANON_KEY') {
    // Validate anon key format (should start with eyJ)
    if (!value.startsWith('eyJ')) {
      console.error(`❌ ERROR: ${name} does not appear to be a valid Supabase anon key`);
      console.error(`   Anon keys should start with 'eyJ...'`);
      hasErrors = true;
    }
  }
}

// Check optional variables
for (const { name } of optionalVars) {
  const value = process.env[name] || envVars[name];
  if (!value) {
    console.warn(`⚠️  WARNING: ${name} is not set (optional but recommended)`);
  }
}

// Summary
console.log('');
if (hasErrors) {
  console.error('❌ Environment validation failed!');
  console.error('   Please check your .env file or environment variables.');
  process.exit(1);
} else {
  console.log('✅ All required environment variables are set');
  
  // Show non-sensitive info
  if (envVars.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL) {
    const url = process.env.VITE_SUPABASE_URL || envVars.VITE_SUPABASE_URL;
    const projectId = url.match(/https:\/\/([^.]+)/)?.[1] || 'unknown';
    console.log(`   Project: ${projectId}`);
    console.log(`   URL: ${url}`);
  }
  console.log('');
}
