#!/usr/bin/env node

// Bulk Environment Variable Update Script for VideoRemix Apps
// Uses superpower methodology: systematic, efficient, error-handling

const fs = require('fs');
const { execSync } = require('child_process');

console.log('🚀 VIDEOREMIX BULK ENVIRONMENT VARIABLE UPDATE');
console.log('================================================\n');

// Load sites data
console.log('📂 Loading sites data...');
const sitesData = JSON.parse(fs.readFileSync('sites.json', 'utf8'));
console.log(`✅ Found ${sitesData.length} total sites\n`);

// Filter for VideoRemix-related sites
const videoremixSites = sitesData.filter(site => {
  const name = site.name.toLowerCase();
  return name.includes('video') ||
         name.includes('remix') ||
         name.includes('personalizer') ||
         name.includes('ai-') ||
         name.includes('smart') ||
         name.includes('crm') ||
         name.includes('sales') ||
         name.includes('funnel');
});

console.log(`🎯 Found ${videoremixSites.length} VideoRemix-related sites:`);
videoremixSites.forEach(site => {
  console.log(`  • ${site.name} (${site.site_id})`);
});
console.log('');

// Environment variables to set
const envVars = {
  'VITE_SUPABASE_URL': 'https://bzxohkrxcwodllketcpz.supabase.co',
  'VITE_SUPABASE_ANON_KEY': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6eG9oa3J4Y3dvZGxsa2V0Y3B6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NjYzODUsImV4cCI6MjA4OTQ0MjM4NX0.ExeLy2sWZMnLY4VToGlbqr3F4SpNmrsE9Hw0lyAhb9A',
  'VITE_STRIPE_PUBLISHABLE_KEY': 'pk_live_51OyF7gDdmNBqrzmWn503WQHDLemPtD8MLID66D4cB89eA08s1O2BdgyPNVAH5txYt3SY9YnNczbMBnkkTkPCDkWz000doOUclm',
  'OPENAI_API_KEY': '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'
};

console.log('🔧 Environment variables to set:');
Object.entries(envVars).forEach(([key, value]) => {
  console.log(`  • ${key} = ${value.substring(0, 20)}...`);
});
console.log('');

// Track results
const results = {
  success: [],
  failed: [],
  skipped: []
};

// Process each site
console.log('🚀 Starting bulk update...');
console.log('=====================================\n');

for (let i = 0; i < videoremixSites.length; i++) {
  const site = videoremixSites[i];
  const siteId = site.site_id;
  const siteName = site.name;

  console.log(`[${i + 1}/${videoremixSites.length}] 🔄 Updating ${siteName} (${siteId})`);

  let siteSuccess = true;
  const siteResults = [];

  // Set each environment variable
  for (const [key, value] of Object.entries(envVars)) {
    try {
      const command = `netlify env:set "${key}" "${value}" --site "${siteId}"`;
      execSync(command, { stdio: 'pipe' });
      siteResults.push(`✅ ${key}`);
      console.log(`  ✅ ${key} set`);
    } catch (error) {
      siteResults.push(`❌ ${key}: ${error.message}`);
      console.log(`  ❌ ${key} failed: ${error.message}`);
      siteSuccess = false;
    }
  }

  // Record results
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

  // Rate limiting - avoid hitting Netlify API limits
  if (i < videoremixSites.length - 1) {
    console.log('⏱️  Rate limiting... (2 seconds)');
    execSync('sleep 2');
  }
}

// Generate report
console.log('\n🎊 BULK UPDATE COMPLETE!');
console.log('========================\n');

console.log(`📊 SUMMARY:`);
console.log(`  ✅ Successful: ${results.success.length}`);
console.log(`  ❌ Failed: ${results.failed.length}`);
console.log(`  📈 Success Rate: ${((results.success.length / videoremixSites.length) * 100).toFixed(1)}%\n`);

if (results.failed.length > 0) {
  console.log('❌ FAILED SITES:');
  results.failed.forEach(site => {
    console.log(`  • ${site.name} (${site.id})`);
    site.results.forEach(result => console.log(`    ${result}`));
  });
  console.log('');
}

console.log('✅ SUCCESSFUL SITES:');
results.success.forEach(site => {
  console.log(`  • ${site.name} (${site.id})`);
});

console.log('\n💡 Next Steps:');
console.log('  1. Review failed sites and retry manually if needed');
console.log('  2. Test deployments to verify variables are working');
console.log('  3. Monitor for any API rate limit issues');

console.log('\n🎉 VideoRemix environment variables bulk update completed!');
console.log(`🚀 ${results.success.length} sites ready for deployment!`);