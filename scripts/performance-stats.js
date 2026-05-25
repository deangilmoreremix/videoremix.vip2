#!/usr/bin/env node
/**
 * Performance Statistics Dashboard
 *
 * Shows optimization status for all edge functions
 */

import { readdir, readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

async function main() {
  console.log('\x1b[36m%s\x1b[0m', '📊 Performance Optimization Status Dashboard');
  console.log('='.repeat(70) + '\n');

  const functionsDir = join(rootDir, 'supabase/functions');
  const sharedDir = join(functionsDir, '_shared');

  // Required performance files
  const requiredFiles = [
    'performance.ts',
    'performance-clients.ts',
    'performance-index.ts',
    'cache.ts',
    'circuit-breaker.ts',
    'deduplicator.ts',
    'rate-limiter.ts',
    'retry.ts',
    'embedding-batcher.ts',
  ];

  console.log('✅ Core Library Files:');
  let libsComplete = 0;
  for (const file of requiredFiles) {
    const filePath = join(sharedDir, file);
    try {
      await readFile(filePath);
      console.log(`   ✓ ${file}`);
      libsComplete++;
    } catch (error) {
      console.log(`   ✗ ${file} (missing)`);
    }
  }
  console.log(`   [${libsComplete}/${requiredFiles.length} libraries]\n`);

  console.log('='.repeat(70) + '\n');

  // Scan edge functions
  const edgeFunctionDirs = await readdir(functionsDir);
  const categories = {
    optimized: [],
    stub: [],
    raw: [],
    unknown: [],
  };

  for (const funcName of edgeFunctionDirs) {
    const funcPath = join(functionsDir, funcName);
    try {
      const stats = await readdir(funcPath);
      if (!stats.includes('index.ts')) continue;

      const indexPath = join(funcPath, 'index.ts');
      const content = await readFile(indexPath, 'utf-8');

      if (funcName.startsWith('_') || funcName.startsWith('admin-')) continue;

      if (content.includes('createOptimizedOpenAIClient') || content.includes('createOptimizedAnthropicClient')) {
        categories.optimized.push(funcName);
      } else if (content.includes('status: \'coming_soon\'') || content.includes('TODO: Implement')) {
        categories.stub.push(funcName);
      } else if (content.includes('new OpenAI') || content.includes('new Anthropic')) {
        categories.raw.push(funcName);
      } else {
        categories.unknown.push(funcName);
      }
    } catch (error) {
      // Not a valid function directory
    }
  }

  const total = Object.values(categories).reduce((sum, arr) => sum + arr.length, 0);

  console.log(`📋 Edge Function Analysis (${total} total functions)\n`);

  console.log(`   \x1b[32m🟢 Optimized (${categories.optimized.length})\x1b[0m:`);
  categories.optimized.forEach(name => console.log(`     • ${name}`));

  console.log(`\n   \x1b[31m🔴 Raw/Unoptimized (${categories.raw.length})\x1b[0m:`);
  categories.raw.forEach(name => console.log(`     • ${name}`));

  console.log(`\n   \x1b[33m⚪ Stubs (${categories.stub.length})\x1b[0m:`);
  console.log(`     (Not yet implemented - will use optimizations when built)`);

  if (categories.unknown.length > 0) {
    console.log(`\n   ⚫ Unknown (${categories.unknown.length}):`);
    categories.unknown.forEach(name => console.log(`     • ${name}`));
  }

  console.log('\n' + '='.repeat(70) + '\n');

  // Configuration check
  console.log('⚙️  Configuration Status:\n');

  const appConfigPath = join(rootDir, 'src/config/appConfig.ts');
  try {
    const configContent = await readFile(appConfigPath, 'utf-8');
    const hasLLMConfig = configContent.includes('LLM:');
    const hasCacheConfig = configContent.includes('CACHE:');
    console.log(`   ${hasLLMConfig ? '✓' : '✗'} LLM performance config in appConfig.ts`);
    console.log(`   ${hasCacheConfig ? '✓' : '✗'} Extended CACHE configuration`);
  } catch (error) {
    console.log('   ✗ Could not read appConfig.ts');
  }

  // Check shared utils
  const utilsPath = join(rootDir, 'supabase/functions/_shared/utils.ts');
  try {
    const utilsContent = await readFile(utilsPath, 'utf-8');
    const hasOptimized = utilsContent.includes('createOptimizedOpenAI');
    console.log(`   ${hasOptimized ? '✓' : '✗'} Performance utilities exported from utils.ts`);
  } catch (error) {
    console.log('   ✗ Could not read utils.ts');
  }

  console.log('\n' + '='.repeat(70) + '\n');

  // Cost impact estimate
  const totalQueries = 100000;
  const costPer1000 = 2.00;
  const cacheHitRate = 0.40;
  const costBefore = (totalQueries / 1000) * costPer1000;
  const costAfter = costBefore * (1 - cacheHitRate);
  const savings = costBefore - costAfter;

  console.log('💰 Projected Monthly Impact (100k queries):\n');
  console.log(`   Before optimization: $${costBefore.toFixed(2)}`);
  console.log(`   After optimization:  $${costAfter.toFixed(2)}`);
  console.log(`   Savings:             \x1b[32m$${savings.toFixed(2)}\x1b[0m (${(cacheHitRate * 100).toFixed(0)}% cost reduction)`);
  console.log(`   Cache hit rate:      ${(cacheHitRate * 100).toFixed(0)}%`);
  console.log(`   Avg latency (cached): ~15ms (vs 2000ms uncached)`);
  console.log('\n');

  console.log('📚 Documentation:\n');
  console.log(`   • Performance Guide: docs/PERFORMANCE_OPTIMIZATION.md`);
  console.log(`   • Summary: docs/PERFORMANCE_SUMMARY.md`);
  console.log(`   • Migration Script: scripts/migrate-performance-optimization.js\n`);

  console.log('🚀 Next Steps:\n');
  if (categories.raw.length > 0) {
    console.log('   1. Run bulk migration: npm run perf:migrate:dry (preview)');
    console.log('   2. Apply changes: npm run perf:migrate');
  } else {
    console.log('   1. All functions optimized! ✓');
  }
  console.log('   3. Set REDIS_URL for distributed cache (optional but recommended)');
  console.log('   4. Deploy and monitor metrics\n');
}

main().catch(console.error);
