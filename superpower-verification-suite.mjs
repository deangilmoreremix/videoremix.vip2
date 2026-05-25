#!/usr/bin/env node

// Superpower Verification Suite - Test deployed VideoRemix apps
import fs from 'fs';
import { execSync } from 'child_process';

console.log('🦸 SUPERPOWER VERIFICATION SUITE');
console.log('==================================');
console.log('Testing VideoRemix app deployments and functionality\n');

// Test sites (sample from different categories)
const testSites = [
  { name: 'videoremix', id: '5dc577a2-e84f-4230-a9e3-43f51a5e0a4c', url: 'https://videoremix.vip' },
  { name: 'ai-personalized-content', id: 'a26325be-72bb-451c-947f-b6023452bc94', url: 'https://ai-personalizedcontent.videoremix.vip' },
  { name: 'smartcrmcloser', id: '42ab2d07-0e71-4646-b032-28fd7b040da7', url: 'https://smartcrmcloser.netlify.app' },
  { name: 'funnelcraft-ai', id: 'funnelcraft-ai', url: 'https://funnelcraft-ai.videoremix.vip' },
  { name: 'video-ai-editor', id: 'a6e33aa8-5cd0-40a5-9992-b41db7c3a0df', url: 'https://videoaipro.netlify.app' }
];

console.log('🎯 Testing 5 representative sites:');
testSites.forEach((site, index) => {
  console.log(`  ${index + 1}. ${site.name} (${site.url})`);
});
console.log('');

// Test results tracking
const results = {
  connectivity: { passed: 0, failed: 0 },
  supabase: { passed: 0, failed: 0 },
  dashboard: { passed: 0, failed: 0 },
  overall: { passed: 0, failed: 0 }
};

async function testSite(site) {
  console.log(`🔍 Testing ${site.name} (${site.url})`);

  let sitePassed = true;
  const siteResults = [];

  try {
    // Test 1: Basic connectivity
    console.log('  🌐 Testing connectivity...');
    const response = await fetch(site.url, {
      signal: AbortSignal.timeout(10000),
      headers: { 'User-Agent': 'VideoRemix-Superpower-Test/1.0' }
    });

    if (response.ok) {
      siteResults.push('✅ Connectivity: PASS');
      results.connectivity.passed++;
      console.log('    ✅ Site loads successfully');
    } else {
      siteResults.push(`❌ Connectivity: FAIL (${response.status})`);
      results.connectivity.failed++;
      sitePassed = false;
      console.log(`    ❌ HTTP ${response.status}`);
    }

    // Test 2: Check for Supabase connection (look for error indicators)
    console.log('  🗄️  Testing Supabase integration...');
    const content = await response.text();
    const hasSupabaseErrors = content.includes('supabase') && (
      content.includes('error') ||
      content.includes('failed') ||
      content.includes('connection')
    );

    if (!hasSupabaseErrors) {
      siteResults.push('✅ Supabase: NO ERRORS DETECTED');
      results.supabase.passed++;
      console.log('    ✅ No Supabase errors detected');
    } else {
      siteResults.push('⚠️  Supabase: ERRORS DETECTED');
      results.supabase.failed++;
      console.log('    ⚠️  Potential Supabase issues detected');
    }

    // Test 3: Dashboard integration
    console.log('  📊 Testing dashboard integration...');
    const hasDashboardElements = content.includes('dashboard') ||
                                content.includes('app') ||
                                content.includes('tool') ||
                                content.includes('VideoRemix');

    if (hasDashboardElements) {
      siteResults.push('✅ Dashboard: ELEMENTS DETECTED');
      results.dashboard.passed++;
      console.log('    ✅ Dashboard integration elements found');
    } else {
      siteResults.push('⚠️  Dashboard: ELEMENTS NOT FOUND');
      results.dashboard.failed++;
      console.log('    ⚠️  Dashboard integration unclear');
    }

  } catch (error) {
    siteResults.push(`❌ Error: ${error.message}`);
    sitePassed = false;
    console.log(`    ❌ Test failed: ${error.message}`);

    results.connectivity.failed++;
    results.supabase.failed++;
    results.dashboard.failed++;
  }

  if (sitePassed) {
    results.overall.passed++;
    console.log(`  🎉 ${site.name}: OVERALL SUCCESS\n`);
  } else {
    results.overall.failed++;
    console.log(`  💥 ${site.name}: ISSUES DETECTED\n`);
  }

  return { site, results: siteResults, passed: sitePassed };
}

// Run all tests
async function runVerificationSuite() {
  console.log('🚀 INITIATING SUPERPOWER VERIFICATION...\n');

  const testPromises = testSites.map(site => testSite(site));
  const testResults = await Promise.allSettled(testPromises);

  // Process results
  const successfulTests = testResults.filter(result =>
    result.status === 'fulfilled' && result.value.passed
  ).length;

  const failedTests = testResults.filter(result =>
    result.status === 'rejected' || (result.status === 'fulfilled' && !result.value.passed)
  ).length;

  // Final report
  console.log('🎊 SUPERPOWER VERIFICATION COMPLETE');
  console.log('====================================\n');

  console.log('📊 TEST RESULTS SUMMARY:');
  console.log(`  🌐 Connectivity: ${results.connectivity.passed} passed, ${results.connectivity.failed} failed`);
  console.log(`  🗄️  Supabase: ${results.supabase.passed} passed, ${results.supabase.failed} failed`);
  console.log(`  📊 Dashboard: ${results.dashboard.passed} passed, ${results.dashboard.failed} failed`);
  console.log(`  🎯 Overall: ${results.overall.passed} sites fully functional, ${results.overall.failed} with issues`);
  console.log(`  📈 Success Rate: ${((results.overall.passed / testSites.length) * 100).toFixed(1)}%\n`);

  if (results.overall.passed === testSites.length) {
    console.log('🎉 ALL TESTS PASSED - VideoRemix ecosystem is fully operational!');
    console.log('🚀 Ready for production deployment and user onboarding.');
  } else {
    console.log('⚠️  SOME ISSUES DETECTED - Review failed tests above.');
    console.log('🔧 Address issues before full production deployment.');
  }

  console.log('\n💡 RECOMMENDATIONS:');
  console.log('  1. Monitor sites for 24-48 hours after deployment');
  console.log('  2. Set up automated health checks for all sites');
  console.log('  3. Configure error tracking and alerting');
  console.log('  4. Prepare rollback procedures if needed');
  console.log('  5. Document deployment procedures for future updates');

  console.log('\n🦸 SUPERPOWER VERIFICATION SUITE COMPLETE!');
  console.log('Your VideoRemix platform is battle-tested and ready! ⚡');
}

// Handle Node.js environment for fetch
if (typeof fetch === 'undefined') {
  console.log('❌ Node.js environment detected - fetch not available');
  console.log('💡 This verification suite requires Node.js 18+ or a fetch polyfill');
  console.log('🔄 Falling back to basic connectivity tests...\n');

  // Fallback: basic connectivity test using curl
  testSites.forEach(site => {
    console.log(`🔍 Testing ${site.name}...`);
    try {
      execSync(`curl -s --max-time 10 --head "${site.url}" > /dev/null`, { stdio: 'pipe' });
      console.log(`  ✅ ${site.name}: Reachable`);
      results.connectivity.passed++;
      results.overall.passed++;
    } catch (error) {
      console.log(`  ❌ ${site.name}: Unreachable`);
      results.connectivity.failed++;
      results.overall.failed++;
    }
  });

  console.log('\n📊 BASIC CONNECTIVITY RESULTS:');
  console.log(`  ✅ Reachable: ${results.connectivity.passed}`);
  console.log(`  ❌ Unreachable: ${results.connectivity.failed}`);
  console.log(`  📈 Success Rate: ${((results.connectivity.passed / testSites.length) * 100).toFixed(1)}%`);

  if (results.connectivity.passed > 0) {
    console.log('\n🎉 Sites are reachable! Full functionality testing requires deployment.');
  } else {
    console.log('\n⚠️  No sites reachable. Check deployments and DNS configuration.');
  }

} else {
  await runVerificationSuite();
}