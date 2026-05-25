#!/usr/bin/env node

// MASSIVE BULK ENVIRONMENT VARIABLE UPDATE - ALL NETLIFY APPS
// Superpower methodology for enterprise-scale deployment
const fs = require('fs');
const { execSync } = require('child_process');

console.log('🌟 MASSIVE BULK UPDATE: ALL NETLIFY APPS');
console.log('==========================================\n');

// Load ALL sites data
console.log('📂 Loading ALL Netlify sites data...');
const sitesData = JSON.parse(fs.readFileSync('sites.json', 'utf8'));
console.log(`✅ Found ${sitesData.length} total sites\n`);

// Environment variables to set (dashboard approach - no site URLs)
const envVars = {
  'VITE_SUPABASE_URL': 'https://bzxohkrxcwodllketcpz.supabase.co',
  'VITE_SUPABASE_ANON_KEY': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6eG9oa3J4Y3dvZGxsa2V0Y3B6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NjYzODUsImV4cCI6MjA4OTQ0MjM4NX0.ExeLy2sWZMnLY4VToGlbqr3F4SpNmrsE9Hw0lyAhb9A',
  'VITE_STRIPE_PUBLISHABLE_KEY': 'pk_live_51OyF7gDdmNBqrzmWn503WQHDLemPtD8MLID66D4cB89eA08s1O2BdgyPNVAH5txYt3SY9YnNczbMBnkkTkPCDkWz000doOUclm',
  'OPENAI_API_KEY': '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'
};

console.log('🔧 Environment variables to set for ALL apps:');
Object.entries(envVars).forEach(([key, value]) => {
  console.log(`  • ${key} = ${value.substring(0, 20)}...`);
});
console.log(`\n📊 OPERATION SCALE:`);
console.log(`  • Total sites: ${sitesData.length}`);
console.log(`  • Variables per site: ${Object.keys(envVars).length}`);
console.log(`  • Total operations: ${sitesData.length * Object.keys(envVars).length}`);
console.log(`  • Estimated time: ${Math.ceil((sitesData.length * Object.keys(envVars).length * 2) / 60)} minutes\n`);

// Track results
const results = {
  success: [],
  failed: [],
  startTime: new Date(),
  processedCount: 0
};

// Process ALL sites
console.log('🚀 STARTING MASSIVE BULK UPDATE...');
console.log('====================================\n');

for (let i = 0; i < sitesData.length; i++) {
  const site = sitesData[i];
  const siteId = site.site_id;
  const siteName = site.name;

  console.log(`[${i + 1}/${sitesData.length}] 🔄 Updating ${siteName} (${siteId})`);

  let siteSuccess = true;
  const siteResults = [];

  // Set each environment variable
  for (const [key, value] of Object.entries(envVars)) {
    try {
      const command = `netlify env:set "${key}" "${value}" --site "${siteId}"`;
      execSync(command, {
        stdio: 'pipe',
        timeout: 30000, // 30 second timeout per command
        maxBuffer: 1024 * 1024 // 1MB buffer
      });
      siteResults.push(`✅ ${key}`);
      console.log(`  ✅ ${key} set`);
    } catch (error) {
      const errorMsg = error.message.length > 100
        ? error.message.substring(0, 100) + '...'
        : error.message;
      siteResults.push(`❌ ${key}: ${errorMsg}`);
      console.log(`  ❌ ${key} failed: ${errorMsg}`);
      siteSuccess = false;
    }
  }

  // Record results
  results.processedCount++;
  if (siteSuccess) {
    results.success.push({
      name: siteName,
      id: siteId,
      results: siteResults
    });
  } else {
    results.failed.push({
      name: siteName,
      id: siteId,
      results: siteResults
    });
  }

  console.log(`  🎯 ${siteName}: ${siteSuccess ? 'SUCCESS' : 'PARTIAL/FAILED'}\n`);

  // Rate limiting - increased to 3 seconds for massive scale
  if (i < sitesData.length - 1) {
    console.log('⏱️  Rate limiting... (3 seconds)');
    execSync('sleep 3');
  }

  // Progress checkpoint every 50 sites
  if ((i + 1) % 50 === 0) {
    const progress = ((i + 1) / sitesData.length * 100).toFixed(1);
    const elapsed = (new Date() - results.startTime) / 1000 / 60; // minutes
    const eta = elapsed / (i + 1) * (sitesData.length - i - 1); // minutes

    console.log(`📊 PROGRESS CHECKPOINT: ${i + 1}/${sitesData.length} sites (${progress}%)`);
    console.log(`   ⏱️  Elapsed: ${elapsed.toFixed(1)} minutes`);
    console.log(`   🎯 ETA: ${eta.toFixed(1)} minutes remaining`);
    console.log(`   ✅ Success rate: ${((results.success.length / results.processedCount) * 100).toFixed(1)}%\n`);
  }
}

// Generate comprehensive final report
const endTime = new Date();
const totalTime = (endTime - results.startTime) / 1000 / 60; // minutes

console.log('\n🎊 MASSIVE BULK UPDATE COMPLETE!');
console.log('=================================\n');

console.log(`⏱️  TOTAL TIME: ${totalTime.toFixed(1)} minutes`);
console.log(`📊 SUMMARY:`);
console.log(`  ✅ Successful sites: ${results.success.length}`);
console.log(`  ❌ Failed sites: ${results.failed.length}`);
console.log(`  📈 Success Rate: ${((results.success.length / sitesData.length) * 100).toFixed(1)}%`);
console.log(`  🔄 Total Operations: ${results.processedCount * Object.keys(envVars).length}\n`);

if (results.success.length > 0) {
  console.log('✅ SUCCESSFUL SITES (first 10):');
  results.success.slice(0, 10).forEach(site => {
    console.log(`  • ${site.name} (${site.id})`);
  });
  if (results.success.length > 10) {
    console.log(`  ... and ${results.success.length - 10} more sites`);
  }
  console.log('');
}

if (results.failed.length > 0) {
  console.log('❌ FAILED SITES:');
  results.failed.forEach(site => {
    console.log(`  • ${site.name} (${site.id})`);
    site.results.forEach(result => console.log(`    ${result}`));
  });
  console.log('');
}

console.log('🎯 RESULT: MASSIVE BULK ENVIRONMENT VARIABLE UPDATE COMPLETED!');
console.log(`🚀 ${results.success.length} sites successfully configured for dashboard access`);
console.log('🔐 All apps now ready for centralized authentication and management');
console.log('\n💡 Dashboard Approach Benefits:');
console.log('  • No per-app authentication configuration needed');
console.log('  • Centralized user management');
console.log('  • Consistent environment across all apps');
console.log('  • Scalable architecture for growth');