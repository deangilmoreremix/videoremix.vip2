#!/usr/bin/env node
/**
 * Replace supabase.auth.getSession() pattern with useSupabaseToken hook
 * in admin and other files.
 *
 * Pattern to replace:
 *   const {
 *     data: { session },
 *     error: sessionError,
 *   } = await supabase.auth.getSession();
 *
 *   if (sessionError || !session) {
 *     setError("Authentication required. Please log in again.");
 *     return;
 *   }
 *
 *   ... session.access_token ...
 *
 * With:
 *   const token = await getToken();
 *
 *   if (!token) {
 *     setError("Authentication required. Please log in again.");
 *     return;
 *   }
 *
 *   ... token ...
 */
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

const files = [
  'src/components/admin/AdminFeaturesManagement.tsx',
  'src/components/admin/AdminAppsManagement.tsx',
  'src/components/admin/AdminUsersManagement.tsx',
  'src/components/admin/AdminVideosManagement.tsx',
  'src/components/admin/AdminPurchasesManagement.tsx',
  'src/components/admin/AdminBulkImport.tsx',
  'src/components/personalizer/PersonalizerDialog.tsx',
  'src/components/ai/primitives/RealtimeVoiceSession.tsx',
];

for (const relPath of files) {
  const filePath = join(projectRoot, relPath);
  let content = readFileSync(filePath, 'utf-8');
  let modified = false;

  // Add import if not present
  if (!content.includes('useSupabaseToken')) {
    // Find the last import line and add after it
    const importRegex = /import .* from .*;?\n/g;
    let lastImportMatch;
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      lastImportMatch = match;
    }
    if (lastImportMatch) {
      const insertPos = lastImportMatch.index + lastImportMatch[0].length;
      const importLine = `import { useSupabaseToken } from "../../hooks/useSupabaseToken";\n`;
      // Adjust path depth
      const depth = (relPath.match(/\//g) || []).length;
      const importPath = '../'.repeat(depth) + 'hooks/useSupabaseToken';
      const adjustedImport = `import { useSupabaseToken } from "${importPath}";\n`;
      content = content.slice(0, insertPos) + adjustedImport + content.slice(insertPos);
      modified = true;
    }
  }

  // Add hook call at the top of the component
  if (!content.includes('const getToken = useSupabaseToken()')) {
    // Find the first function component or function declaration
    const componentMatch = content.match(/(const|function)\s+\w+[^{]*\{/);
    if (componentMatch) {
      const insertPos = componentMatch.index + componentMatch[0].length;
      content = content.slice(0, insertPos) + '\n  const getToken = useSupabaseToken();' + content.slice(insertPos);
      modified = true;
    }
  }

  // Replace the getSession pattern
  const getSessionPattern = /const\s*\{\s*data:\s*\{\s*session\s*\}[^}]*\}\s*=\s*await\s+supabase\.auth\.getSession\(\);?/g;
  if (getSessionPattern.test(content)) {
    content = content.replace(getSessionPattern, 'const token = await getToken();');
    modified = true;
  }

  // Replace the error check pattern
  const errorCheckPattern = /if\s*\(sessionError\s*\|\|\s*!session\)\s*\{/g;
  if (errorCheckPattern.test(content)) {
    content = content.replace(errorCheckPattern, 'if (!token) {');
    modified = true;
  }

  // Replace session.access_token with token
  const tokenPattern = /session\.access_token/g;
  if (tokenPattern.test(content)) {
    content = content.replace(tokenPattern, 'token');
    modified = true;
  }

  if (modified) {
    writeFileSync(filePath, content, 'utf-8');
    console.log(`✓ Updated: ${relPath}`);
  } else {
    console.log(`  Skipped (no changes): ${relPath}`);
  }
}
