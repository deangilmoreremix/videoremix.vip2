#!/usr/bin/env node

// Final Comprehensive Test Suite
// Tests all fixes and optimizations implemented

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { config } from 'dotenv';

config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🎯 FINAL COMPREHENSIVE TEST SUITE');
console.log('================================\n');

// Test Results
const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  details: {}
};

function logTest(testName, passed, message = '') {
  testResults.total++;
  if (passed) {
    testResults.passed++;
    testResults.details[testName] = { status: 'PASS', message };
    console.log(`✅ ${testName}: PASS${message ? ' - ' + message : ''}`);
  } else {
    testResults.failed++;
    testResults.details[testName] = { status: 'FAIL', message };
    console.log(`❌ ${testName}: FAIL${message ? ' - ' + message : ''}`);
  }
}

// 1. ENVIRONMENT VALIDATION
console.log('1️⃣  ENVIRONMENT VALIDATION');
console.log('--------------------------');

const envValid = !!(supabaseUrl && supabaseAnonKey && supabaseServiceKey);
logTest('Environment Variables', envValid, envValid ? 'All required vars present' : 'Missing required vars');

// 2. BUILD VALIDATION
console.log('\n2️⃣  BUILD VALIDATION');
console.log('-------------------');

let buildValid = false;
try {
  // Check if dist directory exists and has files
  const fs = require('fs');
  const distExists = fs.existsSync('./dist');
  const indexExists = fs.existsSync('./dist/index.html');
  const assetsExist = fs.existsSync('./dist/assets');

  buildValid = distExists && indexExists && assetsExist;
  logTest('Build Output', buildValid, buildValid ? 'All build artifacts present' : 'Missing build artifacts');
} catch (error) {
  logTest('Build Output', false, `Error checking build: ${error.message}`);
}

// 3. CSP VALIDATION
console.log('\n3️⃣  CSP VALIDATION');
console.log('-----------------');

let cspValid = false;
try {
  const indexHtml = readFileSync('./index.html', 'utf8');
  const hasCSP = indexHtml.includes('Content-Security-Policy');
  const hasMediaSrc = indexHtml.includes('media-src');
  const hasConnectSrc = indexHtml.includes('connect-src');

  cspValid = hasCSP && hasMediaSrc && hasConnectSrc;
  logTest('Content Security Policy', cspValid, cspValid ? 'CSP properly configured' : 'CSP missing or incomplete');
} catch (error) {
  logTest('Content Security Policy', false, `Error checking CSP: ${error.message}`);
}

// 4. SERVICE WORKER VALIDATION
console.log('\n4️⃣  SERVICE WORKER VALIDATION');
console.log('----------------------------');

let swValid = false;
try {
  const fs = require('fs');
  const swExists = fs.existsSync('./public/sw.js');
  const swContent = swExists ? readFileSync('./public/sw.js', 'utf8') : '';

  const hasCacheLogic = swContent.includes('caches.open');
  const hasFetchHandler = swContent.includes('addEventListener(\'fetch\'');
  const hasInstallHandler = swContent.includes('addEventListener(\'install\'');

  swValid = swExists && hasCacheLogic && hasFetchHandler && hasInstallHandler;
  logTest('Service Worker', swValid, swValid ? 'SW properly configured' : 'SW missing or incomplete');
} catch (error) {
  logTest('Service Worker', false, `Error checking SW: ${error.message}`);
}

// 5. AUTHENTICATION FLOW TEST
console.log('\n5️⃣  AUTHENTICATION FLOW TEST');
console.log('----------------------------');

async function testAuthFlow() {
  try {
    const client = createClient(supabaseUrl, supabaseAnonKey);

    // Test sign in
    const { data: signInData, error: signInError } = await client.auth.signInWithPassword({
      email: 'thebiz4u@aol.com',
      password: 'VideoRemix2026'
    });

    if (signInError) {
      logTest('Authentication Flow', false, `Sign in failed: ${signInError.message}`);
      return;
    }

    logTest('Authentication Flow', true, 'Sign in successful');

    // Test session persistence
    const { data: sessionData } = await client.auth.getSession();
    const sessionValid = !!sessionData.session;
    logTest('Session Persistence', sessionValid, sessionValid ? 'Session maintained' : 'Session lost');

    // Test data access
    const { data: profileData, error: profileError } = await client
      .from('profiles')
      .select('*')
      .eq('user_id', signInData.user.id)
      .single();

    const profileAccess = !profileError && !!profileData;
    logTest('Database Access', profileAccess, profileAccess ? 'Profile data accessible' : 'Profile access failed');

    // Test dashboard preferences
    const { data: prefsData, error: prefsError } = await client
      .from('user_dashboard_preferences')
      .select('*')
      .eq('user_id', signInData.user.id);

    const prefsAccess = !prefsError;
    logTest('Dashboard Preferences', prefsAccess, prefsAccess ? 'Preferences accessible' : `Prefs error: ${prefsError?.message}`);

    // Clean up
    await client.auth.signOut();

  } catch (error) {
    logTest('Authentication Flow', false, `Unexpected error: ${error.message}`);
  }
}

// 6. PERFORMANCE METRICS
console.log('\n6️⃣  PERFORMANCE ANALYSIS');
console.log('-----------------------');

function analyzePerformance() {
  try {
    const fs = require('fs');
    const assets = fs.readdirSync('./dist/assets');

    let totalSize = 0;
    let jsFiles = 0;
    let cssFiles = 0;
    let largestFile = { name: '', size: 0 };

    assets.forEach(asset => {
      const stats = fs.statSync(`./dist/assets/${asset}`);
      totalSize += stats.size;

      if (asset.endsWith('.js')) jsFiles++;
      if (asset.endsWith('.css')) cssFiles++;

      if (stats.size > largestFile.size) {
        largestFile = { name: asset, size: stats.size };
      }
    });

    const totalSizeMB = (totalSize / (1024 * 1024)).toFixed(2);
    const largestSizeKB = (largestFile.size / 1024).toFixed(1);

    logTest('Bundle Size', parseFloat(totalSizeMB) < 10, `Total: ${totalSizeMB}MB, Largest: ${largestFile.name} (${largestSizeKB}KB)`);
    logTest('Code Splitting', jsFiles > 5, `${jsFiles} JS chunks created`);
    logTest('Asset Optimization', cssFiles > 0, `${cssFiles} CSS files generated`);

  } catch (error) {
    logTest('Performance Analysis', false, `Error analyzing performance: ${error.message}`);
  }
}

// 7. ERROR HANDLING VALIDATION
console.log('\n7️⃣  ERROR HANDLING VALIDATION');
console.log('-----------------------------');

function validateErrorHandling() {
  try {
    // Check for error boundary components
    const fs = require('fs');
    const errorBoundaryExists = fs.existsSync('./src/components/GlobalErrorBoundary.tsx');
    const performanceMonitorExists = fs.existsSync('./src/utils/performanceMonitor.ts');

    logTest('Global Error Boundary', errorBoundaryExists, errorBoundaryExists ? 'Error boundary implemented' : 'Missing error boundary');
    logTest('Performance Monitoring', performanceMonitorExists, performanceMonitorExists ? 'Performance monitor active' : 'Missing performance monitor');

    // Check for lazy loading implementation
    const dashboardPage = fs.readFileSync('./src/pages/DashboardPage.tsx', 'utf8');
    const hasLazyLoading = dashboardPage.includes('lazy(()') && dashboardPage.includes('Suspense');
    const hasErrorBoundaries = dashboardPage.includes('ErrorBoundary');

    logTest('Lazy Loading', hasLazyLoading, hasLazyLoading ? 'Components lazy loaded' : 'Missing lazy loading');
    logTest('Component Error Boundaries', hasErrorBoundaries, hasErrorBoundaries ? 'Error boundaries in place' : 'Missing error boundaries');

  } catch (error) {
    logTest('Error Handling Validation', false, `Error checking implementations: ${error.message}`);
  }
}

// RUN ALL TESTS
async function runComprehensiveTest() {
  try {
    await testAuthFlow();
    analyzePerformance();
    validateErrorHandling();

    // Final Summary
    console.log('\n📊 COMPREHENSIVE TEST SUMMARY');
    console.log('=============================');
    console.log(`Total Tests: ${testResults.total}`);
    console.log(`Passed: ${testResults.passed} ✅`);
    console.log(`Failed: ${testResults.failed} ❌`);
    console.log(`Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);

    if (testResults.failed > 0) {
      console.log('\n❌ Failed Tests:');
      Object.entries(testResults.details).forEach(([test, result]) => {
        if (result.status === 'FAIL') {
          console.log(`  - ${test}: ${result.message}`);
        }
      });
    }

    console.log('\n🎯 RECOMMENDATIONS:');
    if (testResults.failed === 0) {
      console.log('  ✅ All systems operational - ready for production!');
      console.log('  🚀 Consider implementing the remaining optimization suggestions');
    } else {
      console.log('  🔧 Address failed tests before production deployment');
      console.log('  📞 Contact development team for failed test resolution');
    }

    // Exit with appropriate code
    process.exit(testResults.failed > 0 ? 1 : 0);

  } catch (error) {
    console.error('❌ Test suite failed:', error);
    process.exit(1);
  }
}

runComprehensiveTest();