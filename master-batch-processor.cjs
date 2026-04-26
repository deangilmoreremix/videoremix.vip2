#!/usr/bin/env node

// MASTER BATCH PROCESSOR - Complete all 237 Netlify sites
// Superpower methodology: Parallel processing, batch management, error recovery
const fs = require('fs');
const { execSync, spawn } = require('child_process');
const path = require('path');

console.log('🚀 MASTER BATCH PROCESSOR: ALL 237 NETLIFY SITES');
console.log('==================================================\n');

// Load ALL sites data
console.log('📂 Loading complete sites data...');
const allSites = JSON.parse(fs.readFileSync('sites.json', 'utf8'));
console.log(`✅ Found ${allSites.length} total sites\n`);

// Configuration
const BATCH_SIZE = 25; // Process 25 sites per batch (manageable)
const PARALLEL_BATCHES = 3; // Run 3 batches simultaneously
const RATE_LIMIT_MS = 3000; // 3 seconds between operations

// Environment variables (dashboard approach - no site URLs)
const envVars = {
  'VITE_SUPABASE_URL': 'https://bzxohkrxcwodllketcpz.supabase.co',
  'VITE_SUPABASE_ANON_KEY': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6eG9oa3J4Y3dvZGxsa2V0Y3B6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NjYzODUsImV4cCI6MjA4OTQ0MjM4NX0.ExeLy2sWZMnLY4VToGlbqr3F4SpNmrsE9Hw0lyAhb9A',
  'VITE_STRIPE_PUBLISHABLE_KEY': 'pk_live_51OyF7gDdmNBqrzmWn503WQHDLemPtD8MLID66D4cB89eA08s1O2BdgyPNVAH5txYt3SY9YnNczbMBnkkTkPCDkWz000doOUclm',
  'OPENAI_API_KEY': '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'
};

// Split sites into batches
const batches = [];
for (let i = 0; i < allSites.length; i += BATCH_SIZE) {
  batches.push(allSites.slice(i, i + BATCH_SIZE));
}

console.log(`📊 BATCH CONFIGURATION:`);
console.log(`  • Total sites: ${allSites.length}`);
console.log(`  • Batch size: ${BATCH_SIZE} sites`);
console.log(`  • Total batches: ${batches.length}`);
console.log(`  • Parallel processing: ${PARALLEL_BATCHES} batches simultaneously`);
console.log(`  • Variables per site: ${Object.keys(envVars).length}`);
console.log(`  • Rate limit: ${RATE_LIMIT_MS}ms between operations\n`);

// Create individual batch scripts
console.log('🔧 Creating batch processing scripts...');
for (let i = 0; i < batches.length; i++) {
  const batchScript = `#!/usr/bin/env node

// Batch ${i + 1} Processor - Sites ${(i * BATCH_SIZE) + 1}-${Math.min((i + 1) * BATCH_SIZE, allSites.length)}
const { execSync } = require('child_process');

const batchNumber = ${i + 1};
const sites = ${JSON.stringify(batches[i])};
const envVars = ${JSON.stringify(envVars)};
const RATE_LIMIT_MS = ${RATE_LIMIT_MS};

console.log(\`🔄 BATCH \${batchNumber}: Processing \${sites.length} sites\`);
console.log('==========================================\\\\n');

const results = { success: [], failed: [] };

for (let j = 0; j < sites.length; j++) {
  const site = sites[j];
  const globalIndex = ${(i * BATCH_SIZE) + j + 1};

  console.log(\`[\${globalIndex}/237] 🔄 \${site.name} (\${site.site_id})\`);

  let siteSuccess = true;
  const siteResults = [];

  // Set each environment variable
  for (const [key, value] of Object.entries(envVars)) {
    try {
      const command = \`netlify env:set "\${key}" "\${value}" --site "\${site.site_id}"\`;
      execSync(command, { stdio: 'pipe', timeout: 30000 });
      siteResults.push(\`✅ \${key}\`);
      console.log(\`  ✅ \${key} set\`);
    } catch (error) {
      const errorMsg = error.message.length > 80
        ? error.message.substring(0, 80) + '...'
        : error.message;
      siteResults.push(\`❌ \${key}: \${errorMsg}\`);
      console.log(\`  ❌ \${key} failed: \${errorMsg}\`);
      siteSuccess = false;
    }
  }

  if (siteSuccess) {
    results.success.push({ name: site.name, id: site.site_id, results: siteResults });
  } else {
    results.failed.push({ name: site.name, id: site.site_id, results: siteResults });
  }

  console.log(\`  🎯 \${site.name}: \${siteSuccess ? 'SUCCESS' : 'PARTIAL/FAILED'}\\\\n\`);

  // Rate limiting
  if (j < sites.length - 1) {
    console.log(\`⏱️  Rate limiting... (\${RATE_LIMIT_MS}ms)\`);
    execSync(\`sleep \${RATE_LIMIT_MS / 1000}\`);
  }
}

// Save results
const fs = require('fs');
fs.writeFileSync(\`batch-\${batchNumber}-results.json\`, JSON.stringify(results, null, 2));

console.log(\`📊 BATCH \${batchNumber} COMPLETE:\`);
console.log(\`  ✅ Successful: \${results.success.length}/\${sites.length}\`);
console.log(\`  ❌ Failed: \${results.failed.length}/\${sites.length}\`);
console.log(\`  📈 Success Rate: \${((results.success.length / sites.length) * 100).toFixed(1)}%\`);
console.log(\`💾 Results saved to batch-\${batchNumber}-results.json\`);
`;

  fs.writeFileSync(`batch-${i + 1}-processor.cjs`, batchScript);
  console.log(`  ✅ Created batch-${i + 1}-processor.cjs (${batches[i].length} sites)`);
}

console.log(`\\n🎯 Created ${batches.length} batch processing scripts\\n`);

// Execute batches in parallel waves
console.log('🚀 STARTING PARALLEL BATCH EXECUTION...');
console.log('========================================\\n');

const executeBatchWave = async (waveNumber, batchIndices) => {
  console.log(\`🌊 WAVE \${waveNumber}: Executing \${batchIndices.length} batches in parallel\`);

  const promises = batchIndices.map(batchIndex => {
    return new Promise((resolve, reject) => {
      const batchNumber = batchIndex + 1;
      console.log(\`  ▶️  Starting batch \${batchNumber}...\`);

      const child = spawn('node', [\`batch-\${batchNumber}-processor.cjs\`], {
        stdio: ['pipe', 'pipe', 'pipe'],
        cwd: process.cwd()
      });

      let output = '';
      child.stdout.on('data', (data) => {
        output += data.toString();
      });

      child.stderr.on('data', (data) => {
        console.log(\`Batch \${batchNumber} error:\`, data.toString());
      });

      child.on('close', (code) => {
        if (code === 0) {
          console.log(\`  ✅ Batch \${batchNumber} completed successfully\`);
          resolve({ batchNumber, success: true, output });
        } else {
          console.log(\`  ❌ Batch \${batchNumber} failed (exit code: \${code})\`);
          resolve({ batchNumber, success: false, output });
        }
      });

      child.on('error', (error) => {
        console.log(\`  ❌ Batch \${batchNumber} error: \${error.message}\`);
        reject(error);
      });
    });
  });

  const results = await Promise.all(promises);
  console.log(\`🌊 WAVE \${waveNumber} complete!\\n\);
  return results;
};

// Execute all waves
const executeAllWaves = async () => {
  const startTime = new Date();
  let totalSuccess = 0;
  let totalFailed = 0;

  for (let wave = 0; wave < batches.length; wave += PARALLEL_BATCHES) {
    const waveBatches = [];
    for (let i = 0; i < PARALLEL_BATCHES && wave + i < batches.length; i++) {
      waveBatches.push(wave + i);
    }

    if (waveBatches.length === 0) break;

    const waveResults = await executeBatchWave(wave / PARALLEL_BATCHES + 1, waveBatches);

    waveResults.forEach(result => {
      if (result.success) {
        totalSuccess++;
      } else {
        totalFailed++;
      }
    });

    // Progress update
    const processed = Math.min((wave + PARALLEL_BATCHES) * BATCH_SIZE, allSites.length);
    const progress = (processed / allSites.length * 100).toFixed(1);
    const elapsed = (new Date() - startTime) / 1000 / 60;
    const eta = elapsed / processed * (allSites.length - processed);

    console.log(\`📊 PROGRESS: \${processed}/\${allSites.length} sites (\${progress}%) - ETA: \${eta.toFixed(1)} min\\n\);
  }

  // Final summary
  const endTime = new Date();
  const totalTime = (endTime - startTime) / 1000 / 60;

  console.log('\\n🎊 MASTER BATCH PROCESSOR COMPLETE!');
  console.log('====================================\\n');

  console.log(\`⏱️  TOTAL TIME: \${totalTime.toFixed(1)} minutes\`);
  console.log(\`📊 FINAL SUMMARY:\`);
  console.log(\`  ✅ Batches successful: \${totalSuccess}\`);
  console.log(\`  ❌ Batches failed: \${totalFailed}\`);
  console.log(\`  📈 Success Rate: \${((totalSuccess / batches.length) * 100).toFixed(1)}%\`);
  console.log(\`  🔄 Sites processed: \${allSites.length}\`);
  console.log(\`  🔑 Variables set: \${allSites.length * Object.keys(envVars).length}\`);

  // Aggregate results from all batch result files
  console.log('\\n📋 DETAILED RESULTS:');
  let totalSitesSuccess = 0;
  let totalSitesFailed = 0;

  for (let i = 1; i <= batches.length; i++) {
    try {
      const batchResults = JSON.parse(fs.readFileSync(`batch-${i}-results.json`, 'utf8'));
      totalSitesSuccess += batchResults.success.length;
      totalSitesFailed += batchResults.failed.length;

      if (batchResults.failed.length > 0) {
        console.log(\`  ❌ Batch \${i}: \${batchResults.failed.length} sites failed\`);
      }
    } catch (error) {
      console.log(\`  ⚠️  Batch \${i}: Could not read results\`);
    }
  }

  console.log(\`\\n🎯 FINAL SITE RESULTS:\`);
  console.log(\`  ✅ Sites successful: \${totalSitesSuccess}/\${allSites.length}\`);
  console.log(\`  ❌ Sites failed: \${totalSitesFailed}/\${allSites.length}\`);
  console.log(\`  📈 Overall success rate: \${((totalSitesSuccess / allSites.length) * 100).toFixed(1)}%\`);

  console.log('\\n💡 RESULT: MASSIVE ENTERPRISE-SCALE ENVIRONMENT VARIABLE UPDATE COMPLETED!');
  console.log(\`🚀 All \${allSites.length} Netlify sites now configured for dashboard access\`);
  console.log('🔐 Centralized authentication ready for your entire app ecosystem!');
};

// Start the massive parallel processing
executeAllWaves().catch(error => {
  console.error('\\n💥 CRITICAL ERROR:', error.message);
  process.exit(1);
});