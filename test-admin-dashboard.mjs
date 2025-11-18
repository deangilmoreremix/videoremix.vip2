#!/usr/bin/env node

/**
 * Admin Dashboard Test Suite
 * Tests all admin edge functions to ensure they're working correctly
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  section: (msg) => console.log(`\n${colors.cyan}━━━ ${msg} ━━━${colors.reset}`)
};

// Test Results Tracker
const results = {
  passed: 0,
  failed: 0,
  warnings: 0,
  tests: []
};

async function testFunction(name, testFn) {
  try {
    await testFn();
    results.passed++;
    results.tests.push({ name, status: 'passed' });
    log.success(`${name}`);
  } catch (error) {
    results.failed++;
    results.tests.push({ name, status: 'failed', error: error.message });
    log.error(`${name}: ${error.message}`);
  }
}

// Test 1: Database Connection
log.section('Testing Database Connection');

await testFunction('Database connection', async () => {
  const { data, error } = await supabase.from('apps').select('count').limit(1);
  if (error) throw error;
});

// Test 2: Admin Dashboard Stats Function
log.section('Testing Admin Edge Functions');

await testFunction('admin-dashboard-stats', async () => {
  const response = await fetch(`${supabaseUrl}/functions/v1/admin-dashboard-stats`, {
    headers: {
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${await response.text()}`);
  }

  const data = await response.json();
  if (!data.success) throw new Error('Function returned success=false');
  if (!data.data) throw new Error('No data returned');
});

await testFunction('admin-apps (GET)', async () => {
  const response = await fetch(`${supabaseUrl}/functions/v1/admin-apps`, {
    headers: {
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json();
  if (!data.success) throw new Error('Failed to fetch apps');
  if (!Array.isArray(data.data)) throw new Error('Invalid data format');
  log.info(`  Found ${data.data.length} apps`);
});

await testFunction('admin-features (GET)', async () => {
  const response = await fetch(`${supabaseUrl}/functions/v1/admin-features`, {
    headers: {
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json();
  if (!data.success) throw new Error('Failed to fetch features');
  if (!Array.isArray(data.data)) throw new Error('Invalid data format');
  log.info(`  Found ${data.data.length} features`);
});

await testFunction('admin-users (GET)', async () => {
  const response = await fetch(`${supabaseUrl}/functions/v1/admin-users`, {
    headers: {
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json();
  if (!data.success) throw new Error('Failed to fetch users');
  if (!Array.isArray(data.data)) throw new Error('Invalid data format');
  log.info(`  Found ${data.data.length} users`);
});

await testFunction('admin-purchases (GET)', async () => {
  const response = await fetch(`${supabaseUrl}/functions/v1/admin-purchases`, {
    headers: {
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json();
  if (!data.success) throw new Error('Failed to fetch purchases');
  if (!Array.isArray(data.data)) throw new Error('Invalid data format');
  log.info(`  Found ${data.data.length} purchases`);
});

await testFunction('admin-subscriptions (GET)', async () => {
  const response = await fetch(`${supabaseUrl}/functions/v1/admin-subscriptions`, {
    headers: {
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json();
  if (!data.success) throw new Error('Failed to fetch subscriptions');
  if (!Array.isArray(data.data)) throw new Error('Invalid data format');
  log.info(`  Found ${data.data.length} subscriptions`);
});

await testFunction('admin-videos (GET)', async () => {
  const response = await fetch(`${supabaseUrl}/functions/v1/admin-videos`, {
    headers: {
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json();
  if (!data.success) throw new Error('Failed to fetch videos');
  if (!Array.isArray(data.data)) throw new Error('Invalid data format');
  log.info(`  Found ${data.data.length} videos`);
});

// Test 3: Database Tables and Schema
log.section('Testing Database Schema');

await testFunction('apps table structure', async () => {
  const { data, error } = await supabase
    .from('apps')
    .select('id, name, slug, item_type, is_suite, feature_count, parent_app_id')
    .limit(1);

  if (error) throw error;
  if (!data || data.length === 0) throw new Error('No apps found');

  const app = data[0];
  if (!app.id || !app.name || !app.slug) throw new Error('Missing required fields');
  log.info(`  Verified: ${app.name} (${app.item_type || 'no type'})`);
});

await testFunction('app_feature_links table', async () => {
  const { data, error } = await supabase
    .from('app_feature_links')
    .select('app_id, feature_id, sort_order')
    .limit(5);

  if (error) throw error;
  log.info(`  Found ${data?.length || 0} feature links`);
});

await testFunction('user_app_access table', async () => {
  const { data, error } = await supabase
    .from('user_app_access')
    .select('user_id, app_id, granted_at')
    .limit(5);

  if (error) throw error;
  log.info(`  Found ${data?.length || 0} access grants`);
});

await testFunction('purchases table', async () => {
  const { data, error } = await supabase
    .from('purchases')
    .select('id, user_id, product_id, platform, status')
    .limit(5);

  if (error) throw error;
  log.info(`  Found ${data?.length || 0} purchases`);
});

await testFunction('subscription_status table', async () => {
  const { data, error } = await supabase
    .from('subscription_status')
    .select('id, user_id, status, current_period_end')
    .limit(5);

  if (error) throw error;
  log.info(`  Found ${data?.length || 0} subscriptions`);
});

// Test 4: Data Integrity
log.section('Testing Data Integrity');

await testFunction('App-Feature hierarchy', async () => {
  const { data: suiteApps, error: suiteError } = await supabase
    .from('apps')
    .select('id, name, is_suite, feature_count')
    .eq('is_suite', true)
    .eq('item_type', 'app');

  if (suiteError) throw suiteError;

  log.info(`  Found ${suiteApps.length} suite apps`);

  for (const app of suiteApps.slice(0, 3)) {
    const { data: features, error: featuresError } = await supabase
      .from('app_feature_links')
      .select('feature_id')
      .eq('app_id', app.id);

    if (featuresError) throw featuresError;

    if (features.length !== app.feature_count) {
      log.warning(`  ${app.name}: feature_count=${app.feature_count} but links=${features.length}`);
      results.warnings++;
    }
  }
});

await testFunction('User access consistency', async () => {
  const { data: access, error } = await supabase
    .from('user_app_access')
    .select('user_id, app_id, apps(name, item_type)')
    .limit(10);

  if (error) throw error;

  const validAccess = access.filter(a => a.apps && a.apps.name);
  log.info(`  Verified ${validAccess.length} access records have valid apps`);
});

// Test 5: Admin Roles
log.section('Testing Admin Roles');

await testFunction('Admin users exist', async () => {
  const { data, error } = await supabase
    .from('user_roles')
    .select('user_id, role, profiles(email)')
    .in('role', ['super_admin', 'admin']);

  if (error) throw error;
  if (!data || data.length === 0) {
    log.warning('  No admin users found - you may need to create one');
    results.warnings++;
  } else {
    log.info(`  Found ${data.length} admin users`);
  }
});

// Test 6: App-Feature Relationships
log.section('Testing App-Feature Relationships');

await testFunction('17 main apps structure', async () => {
  const { data, error } = await supabase
    .from('apps')
    .select('name, slug, item_type, is_suite')
    .in('item_type', ['app', 'standalone'])
    .eq('is_active', true)
    .order('sort_order');

  if (error) throw error;

  const suites = data.filter(a => a.is_suite);
  const standalone = data.filter(a => !a.is_suite);

  log.info(`  Total: ${data.length} apps`);
  log.info(`  Suites: ${suites.length}`);
  log.info(`  Standalone: ${standalone.length}`);

  if (data.length < 15 || data.length > 20) {
    log.warning(`  Expected ~17 apps, found ${data.length}`);
    results.warnings++;
  }
});

// Final Summary
log.section('Test Summary');

const total = results.passed + results.failed;
const passRate = ((results.passed / total) * 100).toFixed(1);

console.log('');
console.log(`Total Tests:   ${total}`);
console.log(`${colors.green}Passed:        ${results.passed}${colors.reset}`);
console.log(`${colors.red}Failed:        ${results.failed}${colors.reset}`);
console.log(`${colors.yellow}Warnings:      ${results.warnings}${colors.reset}`);
console.log(`Pass Rate:     ${passRate}%`);
console.log('');

if (results.failed > 0) {
  console.log(`${colors.red}Some tests failed. Please review errors above.${colors.reset}`);
  process.exit(1);
} else if (results.warnings > 0) {
  console.log(`${colors.yellow}All tests passed with warnings. Please review.${colors.reset}`);
  process.exit(0);
} else {
  console.log(`${colors.green}✓ All tests passed successfully!${colors.reset}`);
  process.exit(0);
}
