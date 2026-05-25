#!/usr/bin/env node

/**
 * 🎯 REVOLUTIONARY LAUNCH: Health Check Script
 * Validates system readiness for card tile & modal experience launch
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'blue') {
  console.log(`${colors[color]}[${new Date().toISOString()}] ${message}${colors.reset}`);
}

function success(message) {
  log(`✅ ${message}`, 'green');
}

function error(message) {
  log(`❌ ${message}`, 'red');
}

function warning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

async function checkFileExists(filePath, description) {
  try {
    await fs.promises.access(filePath);
    success(`${description} found`);
    return true;
  } catch {
    error(`${description} not found: ${filePath}`);
    return false;
  }
}

async function checkComponentExists(componentName) {
  const componentPath = path.join('src', 'components', `${componentName}.tsx`);
  return checkFileExists(componentPath, `Component: ${componentName}`);
}

async function checkEndpoint(url, description) {
  return new Promise((resolve) => {
    const req = https.request(url, { method: 'HEAD' }, (res) => {
      if (res.statusCode >= 200 && res.statusCode < 400) {
        success(`${description} accessible (${res.statusCode})`);
        resolve(true);
      } else {
        warning(`${description} returned ${res.statusCode}`);
        resolve(false);
      }
    });

    req.on('error', () => {
      error(`${description} not accessible`);
      resolve(false);
    });

    req.setTimeout(5000, () => {
      error(`${description} timeout`);
      req.destroy();
      resolve(false);
    });

    req.end();
  });
}

async function validateBuild() {
  log('🔨 Validating build process...');

  const requiredFiles = [
    'package.json',
    'src/components/ProductDetailModal.tsx',
    'src/components/dashboard/DashboardToolsSection.tsx',
    'src/data/extendedSalesCopy.ts',
    'src/types/extendedSalesCopy.ts'
  ];

  let allFilesExist = true;
  for (const file of requiredFiles) {
    if (!await checkFileExists(file, `Required file`)) {
      allFilesExist = false;
    }
  }

  return allFilesExist;
}

async function validateComponents() {
  log('🧩 Validating components...');

  const components = [
    'ProductDetailModal',
    'DashboardToolsSection',
    'LockedAppOverlay',
    'PurchaseModal'
  ];

  let allComponentsExist = true;
  for (const component of components) {
    if (!await checkComponentExists(component)) {
      allComponentsExist = false;
    }
  }

  return allComponentsExist;
}

async function validateData() {
  log('📊 Validating data structures...');

  try {
    const salesCopyPath = path.join('src', 'data', 'extendedSalesCopy.ts');
    const content = await fs.promises.readFile(salesCopyPath, 'utf8');

    if (content.includes('extendedSalesCopy')) {
      success('Extended sales copy data structure validated');
      return true;
    } else {
      error('Extended sales copy data structure invalid');
      return false;
    }
  } catch {
    error('Extended sales copy data file not accessible');
    return false;
  }
}

async function validateExternalServices() {
  log('🌐 Validating external services...');

  const services = [
    { url: 'https://api.supabase.co', description: 'Supabase API' },
    { url: 'https://videoremix.vip2', description: 'Production site' }
  ];

  let allServicesAccessible = true;
  for (const service of services) {
    if (!await checkEndpoint(service.url, service.description)) {
      allServicesAccessible = false;
    }
  }

  return allServicesAccessible;
}

async function validateEnvironment() {
  log('🔧 Validating environment...');

  const requiredEnvVars = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY'
  ];

  let envValid = true;
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      warning(`Environment variable not set: ${envVar}`);
      envValid = false;
    }
  }

  if (envValid) {
    success('Environment variables validated');
  }

  return envValid;
}

async function main() {
  console.log('🎯 REVOLUTIONARY LAUNCH: Health Check');
  console.log('=====================================\n');

  const results = await Promise.all([
    validateBuild(),
    validateComponents(),
    validateData(),
    validateExternalServices(),
    validateEnvironment()
  ]);

  const allPassed = results.every(result => result);

  console.log('\n' + '='.repeat(50));

  if (allPassed) {
    success('🎉 ALL HEALTH CHECKS PASSED!');
    success('🚀 System is ready for revolutionary launch!');
    process.exit(0);
  } else {
    error('💥 HEALTH CHECKS FAILED!');
    error('Please resolve issues before launching.');
    process.exit(1);
  }
}

main().catch(console.error);