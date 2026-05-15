#!/usr/bin/env node

/**
 * Verifies that lucide-react is properly installed with all icon files.
 * This script helps catch issues with incomplete npm installs on CI/CD platforms.
 */

import { existsSync, readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, '../..');

const lucidePath = join(__dirname, 'node_modules', 'lucide-react');
const iconsPath = join(lucidePath, 'dist', 'esm', 'icons');

console.log('🔍 Verifying lucide-react installation...');

// Check if lucide-react is installed
if (!existsSync(lucidePath)) {
  console.error('❌ lucide-react is not installed');
  process.exit(1);
}

// Check if icons directory exists
if (!existsSync(iconsPath)) {
  console.error('❌ lucide-react icons directory is missing');
  console.error('   This usually means the npm install was incomplete.');
  console.error('   Try running: rm -rf node_modules && npm install');
  process.exit(1);
}

// Check for a sample icon file
const sampleIcon = join(iconsPath, 'a-arrow-down.js');
if (!existsSync(sampleIcon)) {
  console.error('❌ Sample icon file is missing');
  process.exit(1);
}

// Count icons
const iconFiles = readdirSync(iconsPath).filter(f => f.endsWith('.js'));
console.log(`✅ lucide-react is properly installed with ${iconFiles.length} icon files`);

// Verify package.json version
const pkgJson = JSON.parse(readFileSync(join(lucidePath, 'package.json'), 'utf8'));
console.log(`   Version: ${pkgJson.version}`);