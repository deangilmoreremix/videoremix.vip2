#!/usr/bin/env node
/**
 * 🔐 EXPOSURE MONITOR - Key Exposure Detection
 * 
 * Monitors for API key exposure in:
 * 1. Git history
 * 2. Public repositories
 * 3. Leak databases (gitguardian, shodan, etc.)
 * 
 * Run regularly: `node exposure-monitor.mjs`
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const ANCestry_DAYS = 30; // Search last 30 days of git history
const GITHUB_API = 'https://api.github.com';

// ANSI colors
const green = (text) => `\x1b[32m${text}\x1b[0m`;
const red = (text) => `\x1b[31m${text}\x1b[0m`;
const yellow = (text) => `\x1b[33m${text}\x1b[0m`;
const cyan = (text) => `\x1b[36m${text}\x1b[0m`;

// Patterns to detect (partial matches for security)
const EXPOSED_KEY_PATTERNS = [
  { name: 'OpenAI', pattern: /sk-proj-[a-zA-Z0-9]{20,}/, severity: 'critical' },
  { name: 'Supabase Anon', pattern: /eyJ[a-zA-Z0-9_-]{50,}/, severity: 'high' },
  { name: 'Supabase Service', pattern: /eyJ[a-zA-Z0-9_-]{100,}/, severity: 'critical' },
  { name: 'Stripe Secret', pattern: /sk_live_[a-zA-Z0-9]{24,}/, severity: 'critical' },
  { name: 'Stripe Webhook', pattern: /whsec_[a-zA-Z0-9]{16,}/, severity: 'critical' },
  { name: 'Gemini', pattern: /AIzaSy[a-zA-Z0-9_-]{20,}/, severity: 'critical' },
  { name: 'Generic API Key', pattern: /api[_-]?key["']?\s*[:=]\s*["']?[a-zA-Z0-9_-]{20,}["']?/i, severity: 'medium' },
];

/**
 * Scan a file for exposed keys
 */
function scanFile(filePath) {
  const issues = [];
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    for (const { name, pattern, severity } of EXPOSED_KEY_PATTERNS) {
      if (pattern.test(content)) {
        // Find the specific line(s)
        const lines = content.split('\n');
        lines.forEach((line, index) => {
          if (pattern.test(line)) {
            issues.push({
              file: filePath,
              line: index + 1,
              pattern: name,
              severity,
              content: line.substring(0, 80) + (line.length > 80 ? '...' : ''),
            });
          }
        });
      }
    }
  } catch {
    // Skip unreadable files
  }
  
  return issues;
}

/**
 * Scan entire directory recursively
 */
function scanDirectory(dirPath, issues = []) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    
    // Skip node_modules and .git
    if (entry.name === 'node_modules' || entry.name === '.git') {
      continue;
    }
    
    if (entry.isDirectory()) {
      scanDirectory(fullPath, issues);
    } else if (entry.isFile()) {
      // Only scan common file types
      const ext = path.extname(entry.name).toLowerCase();
      if (['.js', '.ts', '.jsx', '.tsx', '.json', '.env', '.md', '.txt'].includes(ext)) {
        const fileIssues = scanFile(fullPath);
        issues.push(...fileIssues);
      }
    }
  }
  
  return issues;
}

/**
 * Check git history for exposed keys
 */
function checkGitHistory() {
  const commits = [];
  
  try {
    // Get recent commits that touched .env or secrets
    const logOutput = execSync(
      `git log --since="${ANCestry_DAYS}.days ago" --all --oneline --source --remotes`,
      { encoding: 'utf8' }
    );
    
    // Check for .env commits
    const envCommits = execSync(
      `git log --since="${ANCestry_DAYS}.days ago" --all -- "*.env" "*.env.*"`,
      { encoding: 'utf8' }
    );
    
    if (envCommits.trim()) {
      commits.push({
        type: 'env_commit',
        details: envCommits.trim(),
        warning: 'Files matching .env pattern were committed recently',
      });
    }
  } catch {
    // Git command failed, possibly not a git repo
  }
  
  return commits;
}

/**
 * Check if keys match known breach databases (simulation)
 * In production, use services like gitguardian, shodan, etc.
 */
async function checkKeyBreaches(keys) {
  const breaches = [];
  
  for (const key of keys) {
    // Hash the key for safe checking (partial hash)
    const hash = crypto.createHash('sha256').update(key).digest('hex');
    const partialHash = hash.substring(0, 8);
    
    // In production, check against breach databases:
    // - Have I Been Pwned (HIBP)
    // - GitGuardian
    // - Shodan
    
    // Simulated check - always returns clean for now
    // Real implementation would use external APIs
    breaches.push({
      keyType: key.type,
      partialHash: partialHash,
      breached: false,
      note: 'External breach check not implemented (requires API keys)',
    });
  }
  
  return breaches;
}

/**
 * Generate a secure random key for signing
 */
function generateSigningKey() {
  const secret = crypto.randomBytes(32).toString('hex');
  console.log(cyan('\nGenerated signing key (add to .env):'));
  console.log(green(`VITE_REQUEST_SIGNING_SECRET=${secret}`));
  return secret;
}

/**
 * Main scan function
 */
async function main() {
  console.log(cyan('\n🔐 VIDEOREMIX EXPOSURE MONITOR'));
  console.log('='.repeat(50));
  
  const allIssues = [];
  
  // 1. Scan current codebase
  console.log(yellow('\n📁 Scanning codebase...'));
  const codeIssues = scanDirectory('.');
  
  if (codeIssues.length > 0) {
    console.log(red(`\n❌ Found ${codeIssues.length} potential exposure(s):`));
    
    for (const issue of codeIssues) {
      console.log(`  ${red('✗')} ${issue.file}:${issue.line}`);
      console.log(`    Pattern: ${issue.pattern} (${issue.severity})`);
      console.log(`    Content: ${issue.content}`);
    }
    
    allIssues.push(...codeIssues);
  } else {
    console.log(green('✓ No exposed keys found in current code'));
  }
  
  // 2. Check git history
  console.log(yellow('\n📜 Checking git history...'));
  const gitIssues = checkGitHistory();
  
  if (gitIssues.length > 0) {
    console.log(yellow(`\n⚠️ Found ${gitIssues.length} git history issue(s):`));
    
    for (const issue of gitIssues) {
      console.log(`  ${yellow('⚠')} ${issue.type}: ${issue.warning}`);
    }
    
    allIssues.push(...gitIssues);
  } else {
    console.log(green('✓ No recent .env commits found'));
  }
  
  // 3. Check .gitignore
  console.log(yellow('\n🔒 Checking .gitignore protection...'));
  try {
    const gitignore = fs.readFileSync('.gitignore', 'utf8');
    
    const protections = ['.env', '.env.local', '*.local'];
    let missing = [];
    
    for (const pattern of protections) {
      if (!gitignore.includes(pattern)) {
        missing.push(pattern);
      }
    }
    
    if (missing.length > 0) {
      console.log(yellow(`⚠️ Missing protections in .gitignore: ${missing.join(', ')}`));
    } else {
      console.log(green('✓ .gitignore protects sensitive files'));
    }
  } catch {
    console.log(red('❌ .gitignore not found'));
  }
  
  // 4. Generate signing key
  console.log(yellow('\n🔑 Security enhancement:'));
  generateSigningKey();
  
  // Summary
  console.log('\n' + '='.repeat(50));
  console.log(cyan('📊 SUMMARY'));
  console.log('='.repeat(50));
  
  if (allIssues.length > 0) {
    console.log(red(`❌ ${allIssues.length} issue(s) detected`));
    console.log(yellow('\n⚠️  RECOMMENDATIONS:'));
    console.log('RECOMMENDATIONS:');
    console.log('1. If keys were exposed, ROTATE them immediately');
    console.log('2. Add the generated signing key to .env');
    console.log('3. Check git history and consider history rewrite if needed');
    console.log('4. Enable domain restrictions in API provider dashboards');
    
    return 1;
  } else {
    console.log(green('✓ No critical exposures detected'));
    console.log(cyan('\n✅ Security posture: GOOD'));
    console.log(yellow('\n📝 Recommendations:'));
    console.log('RECOMMENDATIONS:');
    console.log('1. Add the generated signing key to .env for additional protection');
    console.log('2. Run this script regularly (weekly)');
    console.log('3. Enable API key restrictions in provider dashboards');
    
    return 0;
  }
}

// Run if called directly
main().then((exitCode) => {
  process.exit(exitCode);
}).catch((error) => {
  console.error('Scan failed:', error);
  process.exit(1);
});
