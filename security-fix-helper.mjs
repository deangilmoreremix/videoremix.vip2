#!/usr/bin/env node
/**
 * Security Fix Helper Script
 * 
 * Run this to:
 * 1. Check if .env was committed to git
 * 2. Verify .gitignore protection
 * 3. Get instructions for rotating exposed secrets
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🔐 VIDEOREMIX SECURITY FIX HELPER');
console.log('='.repeat(50));

// Check 1: Is .env in git?
console.log('\n📋 Check 1: Git Status');
console.log('-'.repeat(30));
try {
  const gitStatus = execSync('git status --porcelain', { encoding: 'utf-8' });
  const envInGit = gitStatus.includes('.env');
  
  if (envInGit) {
    console.log('❌ ALERT: .env file is tracked by git!');
    console.log('⚠️  Your secrets may have been exposed.');
    console.log('\n🚨 IMMEDIATE ACTION REQUIRED:');
    console.log('1. Rotate all API keys immediately:');
    console.log('   - Supabase: Dashboard → Settings → API → Regenerate');
    console.log('   - Stripe: Dashboard → Developers → API Keys → Roll key');
    console.log('   - OpenAI: https://platform.openai.com/api-keys');
    console.log('   - Gemini: https://aistudio.google.com/app/apikeys');
  } else {
    console.log('✅ .env is NOT tracked by git');
  }
} catch (error) {
  console.log('⚠️  Could not check git status:', error.message);
}

// Check 2: Is .env in .gitignore?
console.log('\n📋 Check 2: .gitignore Protection');
console.log('-'.repeat(30));
const gitignorePath = '.gitignore';
if (fs.existsSync(gitignorePath)) {
  const gitignoreContent = fs.readFileSync(gitignorePath, 'utf-8');
  const hasEnvProtection = gitignoreContent.includes('.env');
  
  if (hasEnvProtection) {
    console.log('✅ .env is protected by .gitignore');
  } else {
    console.log('❌ .env is NOT in .gitignore!');
    console.log('\n🔧 FIX: Adding .env to .gitignore...');
    
    const updatedGitignore = '# Environment files\n.env\n.env.local\n.env.*.local\n\n' + gitignoreContent;
    fs.writeFileSync(gitignorePath, updatedGitignore);
    console.log('✅ Added .env protection to .gitignore');
  }
} else {
  console.log('❌ .gitignore file not found!');
}

// Check 3: Service role key check
console.log('\n📋 Check 3: Service Role Key');
console.log('-'.repeat(30));
const envPath = '.env';
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const hasServiceKey = envContent.includes('SUPABASE_SERVICE_ROLE_KEY');
  
  if (hasServiceKey) {
    console.log('⚠️  SERVICE_ROLE_KEY found in .env');
    console.log('⚠️  This key bypasses ALL security measures!');
    console.log('\n🔧 RECOMMENDATION:');
    console.log('1. Remove SUPABASE_SERVICE_ROLE_KEY from .env');
    console.log('2. Add it to your deployment platform (Netlify/Vercel)');
    console.log('3. Never use it in frontend code');
  } else {
    console.log('✅ No service role key in .env');
  }
}

console.log('\n' + '='.repeat(50));
console.log('📖 NEXT STEPS:');
console.log('1. If .env was committed, rotate ALL exposed keys NOW');
console.log('2. Review your git history: git log --oneline -20');
console.log('3. Consider using git filter-branch to remove .env from history');
console.log('   See: https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository');
console.log('='.repeat(50));
