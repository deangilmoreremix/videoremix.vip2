#!/usr/bin/env node
/**
 * Deploy all Supabase Edge Functions
 *
 * Usage:
 * 1. Ensure SUPABASE_ACCESS_TOKEN and SUPABASE_URL are set in .env
 * 2. Run: node scripts/deploy-functions.js
 *
 * This will deploy all functions in supabase/functions/ (excluding _shared)
 * in batches to avoid rate limits.
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const supabaseDir = path.join(rootDir, 'supabase', 'functions');
const sharedDir = path.join(supabaseDir, '_shared');

// Get all function directories (exclude _shared)
const functions = fs
  .readdirSync(supabaseDir)
  .filter((f) => f !== '_shared' && fs.statSync(path.join(supabaseDir, f)).isDirectory())
  .sort();

console.log(`\n🚀 Deploying ${functions.length} Supabase Edge Functions\n`);

// Check for required environment variables
const hasAccessToken = !!process.env.SUPABASE_ACCESS_TOKEN;
const hasSupabaseUrl = !!process.env.VITE_SUPABASE_URL;

if (!hasAccessToken) {
  console.error('❌ SUPABASE_ACCESS_TOKEN is not set in environment');
  console.error('   Get it from Supabase Dashboard: Project Settings → API → Access Token');
  process.exit(1);
}

if (!hasSupabaseUrl) {
  console.error('❌ VITE_SUPABASE_URL is not set in environment');
  console.error('   Example: https://xyz.supabase.co');
  process.exit(1);
}

const projectRef = process.env.VITE_SUPABASE_URL.split('//')[1]?.split('.')[0];
if (!projectRef) {
  console.error('❌ Could not parse project ref from VITE_SUPABASE_URL');
  process.exit(1);
}

console.log(`📦 Project ref: ${projectRef}`);

let deployed = 0;
let failed = 0;

// Deploy in batches of 5 to avoid rate limiting
const batchSize = 5;
for (let i = 0; i < functions.length; i += batchSize) {
  const batch = functions.slice(i, i + batchSize);
  console.log(`\n📦 Batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(functions.length / batchSize)}:`);

  for (const func of batch) {
    try {
      console.log(`   Deploying ${func}...`);
      execSync(`supabase functions deploy ${func} --project-ref ${projectRef}`, {
        stdio: 'inherit',
        env: process.env,
      });
      deployed++;
    } catch (error) {
      console.error(`   ❌ Failed to deploy ${func}`);
      failed++;
    }
  }

  if (i + batchSize < functions.length) {
    console.log('   ⏳ Waiting 15 seconds before next batch...');
    // Sleep 15 seconds between batches
      new Promise(resolve => setTimeout(resolve, 15000));
  }
}

console.log(`\n📊 Deployment complete:`);
console.log(`   ✅ Successfully deployed: ${deployed}`);
console.log(`   ❌ Failed: ${failed}`);
console.log(`   Total: ${functions.length}`);

// Write report
const report = {
  timestamp: new Date().toISOString(),
  projectRef,
  total: functions.length,
  deployed,
  failed,
};

fs.writeFileSync(
  path.join(rootDir, 'docs', 'deployment-report.json'),
  JSON.stringify(report, null, 2)
);
console.log(`\n📄 Report saved to docs/deployment-report.json`);
