import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_API_KEY) {
  console.error('❌ OPENAI_API_KEY environment variable not set.');
  process.exit(1);
}

const DATA_FILE = path.join(__dirname, '../src/data/generatedThumbnails.ts');
const OUTPUT_DIR = path.join(__dirname, '../public/app-thumbnails');

// Read and parse entries
const content = fs.readFileSync(DATA_FILE, 'utf-8');
const match = content.match(/export const generatedThumbnails\s*=\s*(\[[\s\S]*\]);?/);
if (!match) {
  console.error('❌ Could not find generatedThumbnails array in data file.');
  process.exit(1);
}

let entries;
try {
  entries = JSON.parse(match[1]);
} catch (e) {
  console.error('❌ Failed to parse array:', e.message);
  process.exit(1);
}

// Ensure output dir exists
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// Function to generate image via DALL-E
async function generateImage(prompt) {
  const response = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'dall-e-3',
      prompt,
      n: 1,
      size: '1024x1024',
      quality: 'hd',
      style: 'natural',
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenAI error ${response.status}: ${err}`);
  }

  const data = await response.json();
  if (!data.data?.[0]?.url) {
    throw new Error('Invalid response from OpenAI: missing image URL');
  }

  return data.data[0].url;
}

// Limit entries if specified via CLI arg
const limit = process.argv[2] ? parseInt(process.argv[2], 10) : entries.length;
const entriesToProcess = entries.slice(0, limit);

console.log(`🚀 Starting local thumbnail generation for ${entriesToProcess.length} entries...`);

let successCount = 0;
let skipCount = 0;
let errorCount = 0;

for (let i = 0; i < entriesToProcess.length; i++) {
  const entry = entriesToProcess[i];
  const appId = entry.metadata?.appId;
  if (!appId) {
    console.warn(`⚠️  Entry ${i} missing appId, skipping.`);
    continue;
  }

  const filename = `${appId}.png`;
  const outputPath = path.join(OUTPUT_DIR, filename);
  const localUrl = `/app-thumbnails/${filename}`;

  // Skip if file exists and URL already local
  if (entry.url.startsWith('/') && fs.existsSync(outputPath)) {
    console.log(`⏭️  Already exists: ${filename}, skipping.`);
    skipCount++;
    continue;
  }

  try {
    console.log(`[${i + 1}/${entriesToProcess.length}] Generating: ${appId}...`);

    // Generate image
    const imageUrl = await generateImage(entry.prompt);

    // Download image
    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) throw new Error(`Failed to download image: ${imgRes.status}`);
    const buffer = await imgRes.arrayBuffer();

    // Save to file
    fs.writeFileSync(outputPath, Buffer.from(buffer));

    // Update entry
    entry.url = localUrl;
    entry.metadata.generatedAt = new Date().toISOString();

    console.log(`   ✅ Saved: ${filename}`);
    successCount++;
  } catch (err) {
    console.error(`   ❌ Error for ${appId}:`, err.message);
    errorCount++;
  }

  // Rate limiting: wait 2 seconds before next (except last)
  if (i < entriesToProcess.length - 1) {
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
}

// Write back the entire entries array to the TS file
const now = new Date().toISOString();
const newContent = `// Auto-generated app thumbnails - Generated on ${now} - Includes ${entries.length} app thumbnails\n` +
                   `export const generatedThumbnails = ${JSON.stringify(entries, null, 2)};\n`;

fs.writeFileSync(DATA_FILE, newContent, 'utf-8');

console.log('\n📊 Summary:');
console.log(`✅ Generated: ${successCount}`);
console.log(`⏭️  Skipped: ${skipCount}`);
console.log(`❌ Errors: ${errorCount}`);
console.log(`📁 Files saved to: ${OUTPUT_DIR}`);
console.log(`📝 Updated data file: ${DATA_FILE}`);