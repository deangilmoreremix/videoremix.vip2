#!/usr/bin/env node

// Comprehensive Application Audit Script
// Analyzes network requests, console logs, and performance metrics

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { config } from 'dotenv';

config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 COMPREHENSIVE APPLICATION AUDIT');
console.log('==================================\n');

// 1. ENVIRONMENT CHECK
console.log('1️⃣  ENVIRONMENT ANALYSIS');
console.log('------------------------');

const envStatus = {
  supabaseUrl: !!supabaseUrl,
  supabaseAnonKey: !!supabaseAnonKey,
  supabaseServiceKey: !!supabaseServiceKey,
  nodeVersion: process.version,
  platform: process.platform
};

console.log('Environment Variables:');
Object.entries(envStatus).forEach(([key, value]) => {
  console.log(`  ${key}: ${value ? '✅' : '❌'}`);
});

console.log('\nSupabase Configuration:');
console.log(`  URL: ${supabaseUrl}`);
console.log(`  Anon Key: ${supabaseAnonKey ? 'Present' : 'Missing'}`);
console.log(`  Service Key: ${supabaseServiceKey ? 'Present' : 'Missing'}`);

// 2. NETWORK CONNECTIVITY TEST
console.log('\n2️⃣  NETWORK CONNECTIVITY TEST');
console.log('------------------------------');

async function testConnectivity() {
  try {
    // Test basic Supabase connection
    const client = createClient(supabaseUrl, supabaseAnonKey);
    const { data, error } = await client.auth.getSession();

    if (error) {
      console.log('❌ Supabase connection failed:', error.message);
      return false;
    }

    console.log('✅ Supabase basic connectivity: OK');
    return true;
  } catch (err) {
    console.log('❌ Network connectivity error:', err.message);
    return false;
  }
}

// 3. DATABASE HEALTH CHECK
console.log('\n3️⃣  DATABASE HEALTH CHECK');
console.log('------------------------');

async function checkDatabaseHealth() {
  try {
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Test basic table access
    const tables = ['profiles', 'user_roles', 'user_app_access', 'videos', 'user_dashboard_preferences'];
    const results = {};

    for (const table of tables) {
      try {
        const { count, error } = await adminClient
          .from(table)
          .select('*', { count: 'exact', head: true });

        if (error) {
          results[table] = `❌ Error: ${error.message}`;
        } else {
          results[table] = `✅ ${count} records`;
        }
      } catch (err) {
        results[table] = `❌ Exception: ${err.message}`;
      }
    }

    console.log('Database Tables Status:');
    Object.entries(results).forEach(([table, status]) => {
      console.log(`  ${table}: ${status}`);
    });

    return results;
  } catch (err) {
    console.log('❌ Database health check failed:', err.message);
    return null;
  }
}

// 4. APPLICATION COMPONENT ANALYSIS
console.log('\n4️⃣  COMPONENT DEPENDENCY ANALYSIS');
console.log('---------------------------------');

function analyzeDependencies() {
  try {
    const packageJson = JSON.parse(readFileSync('./package.json', 'utf8'));
    const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };

    const criticalDeps = [
      'react',
      'react-dom',
      '@supabase/supabase-js',
      'lucide-react',
      'framer-motion',
      'react-router-dom',
      'vite'
    ];

    console.log('Critical Dependencies Status:');
    criticalDeps.forEach(dep => {
      const version = dependencies[dep];
      console.log(`  ${dep}: ${version ? `✅ ${version}` : '❌ Missing'}`);
    });

    return dependencies;
  } catch (err) {
    console.log('❌ Failed to analyze dependencies:', err.message);
    return null;
  }
}

// 5. PERFORMANCE METRICS
console.log('\n5️⃣  PERFORMANCE ANALYSIS');
console.log('----------------------');

function analyzeBundle() {
  try {
    // Check if dist exists and analyze bundle size
    const fs = require('fs');
    if (fs.existsSync('./dist')) {
      console.log('✅ Build directory exists');

      // Check main bundle files
      const assets = fs.readdirSync('./dist/assets');
      console.log(`📦 Assets found: ${assets.length} files`);

      assets.forEach(asset => {
        if (asset.includes('.js')) {
          const stats = fs.statSync(`./dist/assets/${asset}`);
          const sizeKB = (stats.size / 1024).toFixed(1);
          console.log(`  ${asset}: ${sizeKB} KB`);
        }
      });
    } else {
      console.log('⚠️  No build directory found (development mode)');
    }
  } catch (err) {
    console.log('❌ Bundle analysis failed:', err.message);
  }
}

// 6. ERROR PATTERN ANALYSIS
console.log('\n6️⃣  ERROR PATTERN ANALYSIS');
console.log('-------------------------');

function analyzeKnownErrors() {
  const knownErrorPatterns = [
    {
      pattern: 'content_topFrameLifeline.js',
      description: 'Browser extension interference',
      severity: 'Low',
      solution: 'Ignore - browser extension related'
    },
    {
      pattern: 'flag-triangle-right.js',
      description: 'Lucide React icon loading failure',
      severity: 'Medium',
      solution: 'Check icon imports and usage'
    },
    {
      pattern: 'ERR_FAILED',
      description: 'Network resource loading failure',
      severity: 'High',
      solution: 'Check resource paths and availability'
    },
    {
      pattern: '401 Unauthorized',
      description: 'Authentication/permission error',
      severity: 'High',
      solution: 'Verify user roles and RLS policies'
    },
    {
      pattern: '23505',
      description: 'Duplicate key constraint violation',
      severity: 'Medium',
      solution: 'Check for duplicate inserts'
    }
  ];

  console.log('Known Error Patterns:');
  knownErrorPatterns.forEach(({ pattern, description, severity, solution }) => {
    console.log(`  ${pattern}: ${description}`);
    console.log(`    Severity: ${severity} | Solution: ${solution}`);
  });
}

// 7. RECOMMENDATIONS
console.log('\n7️⃣  RECOMMENDATIONS');
console.log('-----------------');

function generateRecommendations() {
  const recommendations = [
    '🚀 Implement lazy loading for large components',
    '🔒 Add comprehensive error boundaries',
    '⚡ Optimize bundle splitting and code splitting',
    '📱 Add service worker for offline functionality',
    '🔍 Implement performance monitoring',
    '🛠️ Add automated testing for critical paths',
    '📊 Implement client-side error reporting',
    '⚙️ Add environment-specific configurations'
  ];

  console.log('Optimization Recommendations:');
  recommendations.forEach(rec => console.log(`  ${rec}`));
}

// RUN THE AUDIT
async function runAudit() {
  try {
    // Run all checks
    const connectivityOk = await testConnectivity();
    const dbHealth = await checkDatabaseHealth();
    const deps = analyzeDependencies();
    analyzeBundle();
    analyzeKnownErrors();
    generateRecommendations();

    // Summary
    console.log('\n📊 AUDIT SUMMARY');
    console.log('===============');
    console.log(`Connectivity: ${connectivityOk ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Database: ${dbHealth ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Dependencies: ${deps ? '✅ PASS' : '❌ FAIL'}`);
    console.log('\n🎯 Next Steps:');
    console.log('1. Address high-severity errors first');
    console.log('2. Implement performance optimizations');
    console.log('3. Add comprehensive error handling');
    console.log('4. Test across multiple environments');

  } catch (error) {
    console.error('❌ Audit failed:', error);
  }
}

runAudit();