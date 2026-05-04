import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read generatedThumbnails.ts
const generatedThumbnailsPath = path.join(__dirname, 'src/data/generatedThumbnails.ts');
const generatedContent = fs.readFileSync(generatedThumbnailsPath, 'utf-8');

// Extract the appIds
const appIdMatches = generatedContent.match(/appId: "(.*?)"/g) || [];
const generatedAppIds = new Set();
appIdMatches.forEach(match => {
  const id = match.replace('appId: "', '').replace('"', '');
  generatedAppIds.add(id);
});

console.log(`Found ${generatedAppIds.size} generated thumbnail IDs\n`);

// Read appsData.ts to get raw app IDs
const appsDataPath = path.join(__dirname, 'src/data/appsData.ts');
const appsContent = fs.readFileSync(appsDataPath, 'utf-8');

// Extract app IDs (looking for id: "xxx" pattern)
const idMatches = appsContent.match(/id: "(.*?)"/g) || [];
const appIds = [];
idMatches.forEach(match => {
  const id = match.replace('id: "', '').replace('"', '');
  appIds.push(id);
});

console.log(`Found ${appIds.length} app IDs in appsData\n`);

// Find matches
const matches = [];
appIds.forEach(id => {
  if (generatedAppIds.has(id)) {
    matches.push(id);
  }
});

console.log(`✅ Matching apps (${matches.length}):`);
matches.forEach(id => console.log(`   ${id}`));

// Show missing from appsData
console.log('\n❌ Generated thumbnails for apps NOT in appsData:');
let missingCount = 0;
generatedAppIds.forEach(id => {
  if (!appIds.includes(id)) {
    console.log(`   ${id}`);
    missingCount++;
  }
});
console.log(`\nTotal missing from appsData: ${missingCount}`);

// Check if any app in appsData has generatedThumbnail flag
const hasFlag = appsContent.includes('generatedThumbnail: true');
console.log(`\ngeneratedThumbnail flag present in appsData: ${hasFlag ? 'YES' : 'NO'}`);
