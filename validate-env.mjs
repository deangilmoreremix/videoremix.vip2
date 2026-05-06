#!/usr/bin/env node
import { existsSync, readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, isAbsolute, join } from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const envPath = join(__dirname, '.env');
const envLocalPath = join(__dirname, '.env.local');
const envDevelopmentPath = join(__dirname, '.env.development');
const envLaunchPath = join(__dirname, '.env.launch');
const envExamplePath = join(__dirname, '.env.example');
const legacyEnvPath = join(__dirname, 'env');
const customEnvPath = process.env.ENV_PATH
  ? (isAbsolute(process.env.ENV_PATH) ? process.env.ENV_PATH : join(__dirname, process.env.ENV_PATH))
  : null;
const lockFilePath = join(__dirname, '.env.lock');

let correctProjectId;
let correctUrl;
try {
  const lockFile = readFileSync(lockFilePath, 'utf-8');
  correctProjectId = lockFile.match(/LOCKED_PROJECT_ID=(.+)/)?.[1]?.trim();
  correctUrl = lockFile.match(/LOCKED_SUPABASE_URL=(.+)/)?.[1]?.trim();

  if (!correctProjectId || !correctUrl) {
    console.error('❌ ERROR: .env.lock is missing required keys');
    process.exit(1);
  }
} catch (error) {
  console.error('❌ ERROR: Cannot read .env.lock — ensure it exists and is readable');
  console.error(`   ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}

const envCandidates = [
  envPath,
  envLocalPath,
  envDevelopmentPath,
  envLaunchPath,
  envExamplePath,
  legacyEnvPath,
  ...(customEnvPath ? [customEnvPath] : []),
];

for (const candidate of envCandidates) {
  if (existsSync(candidate)) {
    dotenv.config({ path: candidate, override: false });
  }
}

let currentUrl = process.env.VITE_SUPABASE_URL?.trim();

if (!currentUrl) {
  for (const candidate of envCandidates) {
    try {
      const envFile = readFileSync(candidate, 'utf-8');
      const urlMatch = envFile.match(/^VITE_SUPABASE_URL=([^#\n]+)/m);
      currentUrl = urlMatch ? urlMatch[1].trim() : undefined;
      if (currentUrl) break;
    } catch {
      // File missing/unreadable, continue checking other candidates
    }
  }
}

if (!currentUrl) {
  const existingCandidates = envCandidates
    .filter((file) => existsSync(file))
    .map((file) => file.replace(`${__dirname}/`, ''))
    .join(', ') || 'none';
  console.error('❌ ERROR: VITE_SUPABASE_URL not found in environment files or shell env');
  console.error(`   Checked files: ${existingCandidates}`);
  process.exit(1);
}

if (currentUrl !== correctUrl) {
  console.error('❌ ERROR: Incorrect Supabase URL detected!');
  console.error(`   Current:  ${currentUrl}`);
  console.error(`   Expected: ${correctUrl}`);
  console.error(`   Project:  ${correctProjectId}`);
  console.error('');
  console.error('   Run: cp .env.example .env');
  console.error('   Or set ENV_PATH=<your-env-file> for non-standard env filenames.');
  process.exit(1);
}

if (!currentUrl.includes(correctProjectId)) {
  console.error('❌ ERROR: Project ID mismatch!');
  console.error('   URL contains wrong project ID');
  console.error(`   Expected: ${correctProjectId}`);
  process.exit(1);
}

console.log('✅ Supabase configuration is correct');
console.log(`   Project: ${correctProjectId}`);
console.log(`   URL: ${correctUrl}`);
