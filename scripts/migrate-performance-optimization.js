#!/usr/bin/env node
/**
 * Bulk Performance Optimization Migrator
 * Updates edge functions to use optimized clients
 */

const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(process.cwd(), '..');

function processFile(filePath, dryRun) {
  const original = fs.readFileSync(filePath, 'utf-8');
  let modified = original;
  let changed = false;

  // 1. Add performance imports if missing
  if (!modified.includes('createOptimizedOpenAIClient')) {
    const perfImport = "import { createOptimizedOpenAIClient, createOptimizedAnthropicClient } from '../_shared/performance-clients.ts';\n";
    const firstImport = modified.indexOf('import ');
    if (firstImport !== -1) {
      modified = modified.slice(0, firstImport) + perfImport + modified.slice(firstImport);
      changed = true;
    }
  }

  // 2. Replace OpenAI initialization
  if (modified.includes('new OpenAI({') && modified.includes('apiKey:')) {
    const replacement = `const openai = await createOptimizedOpenAIClient(
  Deno.env.get('OPENAI_API_KEY'),
  'rag' // Set based on function purpose: financial, content, rag, social, podcast
);`;
    modified = modified.replace(
      /const\s+openai\s*=\s*new\s+OpenAI\s*\([^)]+\)\s*;?/g,
      replacement
    );
    changed = true;
  }

  // 3. Replace Anthropic init
  if (modified.includes('new Anthropic({') && modified.includes('apiKey:')) {
    const replacement = `const anthropic = await createOptimizedAnthropicClient(
  Deno.env.get('ANTHROPIC_API_KEY')
);`;
    modified = modified.replace(
      /const\s+anthropic\s*=\s*new\s+Anthropic\s*\([^)]+\)\s*;?/g,
      replacement
    );
    changed = true;
  }

  // 4. Add cacheTtl to chat calls (simple heuristic)
  modified = modified.replace(
    /await\s+openai\.chat\.completions\.create\s*\(\s*\{[\s\S]*?model:\s*'gpt-4o[^']*'[\s\S]*?\}/g,
    (match) => {
      if (match.includes('cacheTtl')) return match;
      return match.replace(/}$/, '  cacheTtl: 300,\n}');
    }
  );

  // 5. Wrap embeddings with batcher
  if (modified.includes('openai.embeddings.create')) {
    if (!modified.includes('createEmbeddingBatcher')) {
      const batcherImport = "import { createEmbeddingBatcher } from '../_shared/embedding-batcher.ts';\n";
      const firstImport = modified.indexOf('import ');
      if (firstImport !== -1) {
        modified = modified.slice(0, firstImport) + batcherImport + modified.slice(firstImport);
        changed = true;
      }
    }

    modified = modified.replace(
      /const\s+response\s*=\s*await\s+openai\.embeddings\.create\s*\(\s*{\s*model:\s*'([^']+)',\s*input:\s*([^}]+)\s*}\s*\)/g,
      (match, model, inputVar) => {
        return `const embeddingBatcher = createEmbeddingBatcher(openai, { model: '${model}' });
  const response = await embeddingBatcher.get(${inputVar});`;
      }
    );
    changed = true;
  }

  return { changed, modified };
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run') || args.includes('-n');
  const apply = args.includes('--apply') || args.includes('-a');

  console.log('🚀 Performance Optimization Migrator\n');
  console.log(`Mode: ${dryRun ? 'DRY-RUN' : apply ? 'APPLY' : 'DRY-RUN'}\n`);

  const functionsDir = path.join(rootDir, 'supabase/functions');
  const dirs = fs.readdirSync(functionsDir).filter(f => {
    const full = path.join(functionsDir, f);
    return fs.statSync(full).isDirectory() && !f.startsWith('_') && !f.startsWith('admin-');
  });

  console.log(`Found ${dirs.length} edge functions\n`);

  let totalChanged = 0;
  for (const funcName of dirs) {
    const indexPath = path.join(functionsDir, funcName, 'index.ts');
    if (!fs.existsSync(indexPath)) continue;

    try {
      const { changed, modified } = processFile(indexPath, dryRun);

      if (changed) {
        totalChanged++;
        console.log(`📝 ${funcName}/index.ts`);
        if (dryRun) {
          console.log('  (changes would be applied)');
        } else if (apply) {
          fs.copyFileSync(indexPath, indexPath + '.bak');
          fs.writeFileSync(indexPath, modified);
          console.log('  ✓ Updated (backup: index.ts.bak)');
        }
      }
    } catch (error) {
      console.error(`❌ Error processing ${funcName}:`, error.message);
    }
  }

  console.log(`\n📊 Summary: ${totalChanged} functions would be modified`);
  if (dryRun) {
    console.log('\n⚠️  Run with --apply to apply changes\n');
  }
}

main().catch(console.error);
