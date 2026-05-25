#!/usr/bin/env node
/**
 * Rename Edge Functions that start with numbers (invalid for Supabase)
 * Supabase requires function names to start with letters.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const supabaseDir = path.join(rootDir, 'supabase', 'functions');

// Mapping of number-prefixed names to valid names
const renameMapping = {
  '1-starter-agent': 'tutorial-starter-agent',
  '4-running-agents': 'tutorial-running-agents',
  '5-1-in-memory-conversation-agent': 'tutorial-memory-conversation-agent',
  '5-2-persistent-conversation-agent': 'tutorial-persistent-conversation-agent',
  '51-in-memory-conversation-agent': 'tutorial-memory-conversation-agent-alt',
  '52-persistent-conversation-agent': 'tutorial-persistent-conversation-agent-alt',
  '6-1-agent-lifecycle-callbacks': 'tutorial-agent-lifecycle-callbacks',
  '6-2-llm-interaction-callbacks': 'tutorial-llm-interaction-callbacks',
  '6-3-tool-execution-callbacks': 'tutorial-tool-execution-callbacks',
  '61-agent-lifecycle-callbacks': 'tutorial-agent-lifecycle-callbacks-alt',
  '62-llm-interaction-callbacks': 'tutorial-llm-interaction-callbacks-alt',
  '63-tool-execution-callbacks': 'tutorial-tool-execution-callbacks-alt',
  '7-plugins': 'tutorial-plugins',
  '7-sessions': 'tutorial-sessions',
  '9-1-sequential-agent': 'tutorial-sequential-agent',
  '9-2-loop-agent': 'tutorial-loop-agent',
  '9-3-parallel-agent': 'tutorial-parallel-agent',
  '91-sequential-agent': 'tutorial-sequential-agent-alt',
  '92-loop-agent': 'tutorial-loop-agent-alt',
  '93-parallel-agent': 'tutorial-parallel-agent-alt',
};

console.log('\n🔄 Renaming invalid function names...\n');

let renamed = 0;

for (const [oldName, newName] of Object.entries(renameMapping)) {
  const oldPath = path.join(supabaseDir, oldName);
  const newPath = path.join(supabaseDir, newName);

  if (fs.existsSync(oldPath)) {
    try {
      fs.renameSync(oldPath, newPath);
      console.log(`✅ Renamed: ${oldName} → ${newName}`);
      renamed++;
    } catch (error) {
      console.error(`❌ Failed to rename ${oldName}:`, error.message);
    }
  } else {
    console.log(`⚠️  Function not found: ${oldName}`);
  }
}

console.log(`\n📊 Renamed ${renamed} functions\n`);

// Now update React page imports to match new function names
const agentsDir = path.join(rootDir, 'src', 'pages', 'agents');
const reverseMapping = Object.fromEntries(
  Object.entries(renameMapping).map(([old, new_]) => [new_, old])
);

console.log('🔄 Updating React page fetch URLs...\n');

let updated = 0;

for (const [newName, oldName] of Object.entries(reverseMapping)) {
  const oldFetchPattern = new RegExp(`fetch\\([^)]*\\/functions\\/v1\\/${oldName}[^)]*\\)`, 'g');
  const newFetchPattern = `/functions/v1/${newName}`;

  // Find React files that import/use these functions
  const files = fs.readdirSync(agentsDir).filter(f => f.endsWith('.tsx'));

  for (const file of files) {
    const filePath = path.join(agentsDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');

    if (content.includes(`/functions/v1/${oldName}`)) {
      const updatedContent = content.replace(
        new RegExp(`/functions/v1/${oldName}`, 'g'),
        `/functions/v1/${newName}`
      );

      fs.writeFileSync(filePath, updatedContent, 'utf-8');
      console.log(`✅ Updated ${file}: ${oldName} → ${newName}`);
      updated++;
    }
  }
}

console.log(`\n📊 Updated ${updated} React page references\n`);

console.log('⚠️  Next: Run database migration in Supabase Dashboard, then re-run deployment\n');
