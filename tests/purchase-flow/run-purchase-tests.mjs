// Purchase Flow Test Runner
// Runs comprehensive tests for the purchase system

import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import path from 'path';

const __dirname = path.dirname(new URL(import.meta.url).pathname);

console.log('🧪 VideoRemix Purchase Flow Test Suite\\n');

// Test categories
const testCategories = [
  {
    name: 'Unit Tests',
    command: 'npm test -- --testPathPattern=purchase-flow --passWithNoTests',
    description: 'Run unit tests for purchase components'
  },
  {
    name: 'Integration Tests', 
    command: 'node test-agent-functions.mjs',
    description: 'Test agent function integrations'
  },
  {
    name: 'E2E Tests',
    command: 'npx playwright test tests/purchase-flow/',
    description: 'Run end-to-end purchase flow tests'
  },
  {
    name: 'API Tests',
    command: 'node tests/purchase-flow/api-tests.mjs',
    description: 'Test purchase API endpoints'
  }
];

async function runTestCategory(category) {
  console.log(`\\n📋 Running ${category.name}...`);
  console.log(`   ${category.description}`);
  
  try {
    const result = execSync(category.command, { 
      encoding: 'utf8',
      stdio: 'pipe',
      cwd: process.cwd()
    });
    
    console.log('✅ PASSED');
    if (result.trim()) {
      console.log('   Output:', result.trim());
    }
    
    return { success: true, output: result };
  } catch (error) {
    console.log('❌ FAILED');
    console.log('   Error:', error.message);
    
    return { success: false, error: error.message };
  }
}

async function generateReport(results) {
  console.log('\\n📊 Test Report Summary\\n');
  
  const passed = results.filter(r => r.success).length;
  const total = results.length;
  const passRate = Math.round((passed / total) * 100);
  
  console.log(`Overall Pass Rate: ${passRate}% (${passed}/${total})\\n`);
  
  results.forEach((result, index) => {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${testCategories[index].name}`);
  });
  
  // Generate detailed report
  const reportPath = path.join(__dirname, 'test-results.json');
  const reportData = {
    timestamp: new Date().toISOString(),
    overall: {
      passed,
      total,
      passRate: `${passRate}%`
    },
    results: results.map((result, index) => ({
      category: testCategories[index].name,
      success: result.success,
      error: result.error || null,
      output: result.output || null
    }))
  };
  
  // Write report file
  const fs = await import('fs');
  fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
  console.log(`\\n📄 Detailed report saved to: ${reportPath}`);
  
  return passRate >= 80; // Consider 80%+ as passing
}

async function main() {
  console.log('🚀 Starting Purchase Flow Test Suite\\n');
  
  const results = [];
  
  for (const category of testCategories) {
    const result = await runTestCategory(category);
    results.push(result);
  }
  
  const overallSuccess = await generateReport(results);
  
  console.log('\\n' + '='.repeat(50));
  if (overallSuccess) {
    console.log('🎉 ALL TESTS PASSED - Production Ready!');
  } else {
    console.log('⚠️  SOME TESTS FAILED - Review and fix issues');
  }
  console.log('='.repeat(50));
  
  process.exit(overallSuccess ? 0 : 1);
}

main().catch(console.error);
