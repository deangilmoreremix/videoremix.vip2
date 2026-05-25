#!/usr/bin/env node
/**
 * Update Edge Functions to use user-provided API keys instead of env vars.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const supabaseDir = path.join(rootDir, 'supabase', 'functions');

function usesUserKeys(content) {
  return content.includes('user_api_keys') || content.includes('encrypted_api_key');
}

function injectUserKeyFetcher(content, provider) {
  const lines = content.split('\n');
  let insertIndex = -1;

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('const supabase') || lines[i].includes('createClient')) {
      insertIndex = i + 1;
      break;
    }
  }

  if (insertIndex === -1) {
    insertIndex = 0;
  }

  const injectCode = `
// Fetch user's API key from Supabase (user-provided keys)
async function getUserApiKey(user_id, provider) {
  const { data, error } = await supabase
    .from('user_api_keys')
    .select('encrypted_api_key')
    .eq('user_id', user_id)
    .eq('provider', provider)
    .single();

  if (error || !data) {
    return null;
  }
  return data.encrypted_api_key;
}

// Verify JWT token to get user_id
async function verifyUser(req) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.substring(7);
  try {
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) return null;
    return { user_id: user.id };
  } catch (e) {
    console.error('JWT verification failed:', e);
    return null;
  }
}
`;

  lines.splice(insertIndex, 0, injectCode);
  return lines.join('\n');
}

function processFunctionFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');

  if (usesUserKeys(content)) {
    console.log(`   Already uses user keys: ${path.basename(path.dirname(filePath))}`);
    return false;
  }

  const functionName = path.basename(path.dirname(filePath));
  let provider = 'openai';

  if (functionName.includes('anthropic') || content.includes('Anthropic')) {
    provider = 'anthropic';
  } else if (functionName.includes('gemini') || content.includes('google-generativeai')) {
    provider = 'gemini';
  } else if (functionName.includes('elevenlabs') || functionName.includes('podcast')) {
    provider = 'elevenlabs';
  } else if (functionName.includes('cohere')) {
    provider = 'cohere';
  } else if (functionName.includes('together')) {
    provider = 'together';
  }

  let newContent = injectUserKeyFetcher(content, provider);

  // Add before Deno.serve handler
  const serveMatch = newContent.match(/Deno\.serve\(async\s*\(req:\s*Request\)\s*=>\s*{/);
  if (serveMatch) {
    const insertPos = serveMatch.index;
    const prelude = `
  // Verify authentication and get user's API key
  const { user_id } = await verifyUser(req);
  if (!user_id) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }

  // Get user's ${provider} API key
  const userApiKey = await getUserApiKey(user_id, '${provider}');
  if (!userApiKey) {
    return jsonResponse({ 
      error: 'API_KEY_MISSING',
      message: 'Please add your ${provider} API key in your profile.',
      provider: '${provider}'
    }, 403);
  }

  // Parse body
  let body;
  try {
    body = await req.json();
  } catch (e) {
    // body remains undefined for non-JSON requests
  }
`;
    newContent = newContent.slice(0, insertPos) + prelude + newContent.slice(insertPos);
  }

  // Replace env var usage with userApiKey
  const envVarPattern = new RegExp(`apiKey:\\s*Deno\\.env\\.get\\(['"]${provider.toUpperCase()}_API_KEY['"]\\)`, 'g');
  newContent = newContent.replace(envVarPattern, 'apiKey: userApiKey');

  // Also handle cases where the key is stored in a variable first
  // e.g., const openai = new OpenAI({ apiKey: Deno.env.get('OPENAI_API_KEY') });
  newContent = newContent.replace(
    new RegExp(`apiKey:\\s*Deno\\.env\\.get\\(['"]${provider.toUpperCase()}_API_KEY['"]\\)`, 'g'),
    'apiKey: userApiKey'
  );

  fs.writeFileSync(filePath, newContent, 'utf-8');
  console.log(`   Updated: ${functionName} (using ${provider})`);
  return true;
}

function main() {
  const functions = fs
    .readdirSync(supabaseDir)
    .filter((f) => f !== '_shared' && fs.statSync(path.join(supabaseDir, f)).isDirectory());

  console.log(`\n🔍 Processing ${functions.length} Edge Functions\n`);

  let updated = 0;
  let skipped = 0;

  for (const func of functions) {
    const indexPath = path.join(supabaseDir, func, 'index.ts');
    if (!fs.existsSync(indexPath)) {
      skipped++;
      continue;
    }

    try {
      if (processFunctionFile(indexPath)) {
        updated++;
      } else {
        skipped++;
      }
    } catch (error) {
      console.error(`❌ Error processing ${func}:`, error.message);
      skipped++;
    }
  }

  console.log(`\n📊 Update complete: ${updated} updated, ${skipped} skipped\n`);
}

main();
