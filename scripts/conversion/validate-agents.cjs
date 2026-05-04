#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Helper to read and parse files
function readJSON(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (e) {
    return null;
  }
}

// Extract component names from App.tsx (lazy imports and Route elements)
const appTsxContent = fs.readFileSync('src/App.tsx', 'utf8');

// Extract all const declarations with lazy imports for agent pages
const importRegex = /const\s+(\w+)\s*=\s*lazy\(\(\)\s*=>\s*import\(["']\.\/pages\/agents\/(\w+)Page\.tsx["']\)\)/g;
const routeRegex = /<Route\s+path="\/agent\/[^"]+"\s+element={<(\w+) \/>}/g;

const importedComponents = new Set();
const routeComponents = new Set();

let match;
while ((match = importRegex.exec(appTsxContent)) !== null) {
  importedComponents.add(match[1]);
}
while ((match = routeRegex.exec(appTsxContent)) !== null) {
  routeComponents.add(match[1]);
}

// Extract agent IDs from appsData.ts
const appsDataContent = fs.readFileSync('src/data/appsData.ts', 'utf8');
const agentIdRegex = /id:\s*"([^"]+)",/g;
const allAppIds = [];
while ((match = agentIdRegex.exec(appsDataContent)) !== null) {
  allAppIds.push(match[1]);
}

// Only count AI agent apps (category: "ai-agents" appears in the objects)
// We need to count entries with category "ai-agents"
const aiAgentEntries = [];
const entryRegex = /\{[^}]*category:\s*"ai-agents"[^}]*\}/gs;
let entryMatch;
while ((entryMatch = entryRegex.exec(appsDataContent)) !== null) {
  const entry = entryMatch[0];
  const idMatch = entry.match(/id:\s*"([^"]+)",/);
  if (idMatch) {
    aiAgentEntries.push(idMatch[1]);
  }
}

// Read manifest
const manifest = readJSON('scripts/conversion/output/registration-manifest.json');
const manifestAppNames = manifest ? manifest.map(entry => entry.appName) : [];

// Count component files in src/pages/agents/
const componentFiles = fs.readdirSync('src/pages/agents').filter(f => f.endsWith('.tsx'));
const componentFilenames = componentFiles.map(f => f.replace('.tsx', ''));

// Remove non-agent pages from component count
const nonAgentPages = ['index', 'AppPage', 'FinancialCoachPage', 'EmailGTMPage', 'ReasoningAgentPage', 'WebScrapingAgentPage', 'FinanceAgentPage', 'SocialBuzzAIPage', 'PodcastifyAIPage', 'ConsultProAIPage', 'LaunchRocketAIPage', 'SalesForceAIPage'];
const agentComponentFilenames = componentFilenames.filter(f => !nonAgentPages.includes(f));

// Analyze duplicates in manifest
const manifestCounts = {};
manifestAppNames.forEach(name => {
  manifestCounts[name] = (manifestCounts[name] || 0) + 1;
});
const duplicates = Object.entries(manifestCounts).filter(([_, count]) => count > 1).map(([name, count]) => ({ name, count }));

// Find missing components (registered in manifest but no file exists)
const manifestComponentNames = manifest ? manifest.map(entry => entry.componentName) : [];
const missingComponents = manifestComponentNames.filter(compName => {
  // Check if file exists - convert PascalCase to filename
  const filename = compName + '.tsx';
  return !fs.existsSync(path.join('src/pages/agents', filename));
});

// Find components in App.tsx that aren't in manifest
const missingFromManifest = Array.from(routeComponents).filter(comp => !manifestComponentNames.includes(comp));

// Stats
const totalManifestEntries = manifest ? manifest.length : 0;
const totalRoutesRegistered = routeComponents.size;
const totalComponentsExist = agentComponentFilenames.length;
const totalAppsInManifest = manifestAppNames.length;

console.log('=== VALIDATION SUMMARY ===');
console.log(`Total manifest entries: ${totalManifestEntries}`);
console.log(`Total AI agent entries in appsData.ts: ${aiAgentEntries.length}`);
console.log(`Total unique route components in App.tsx: ${totalRoutesRegistered}`);
console.log(`Total component files in src/pages/agents/: ${agentComponentFilenames.length}`);
console.log(`Duplicates in manifest: ${duplicates.length}`);
console.log(`Missing components (in manifest but no file): ${missingComponents.length}`);
console.log(`Components in routes but not in manifest: ${missingFromManifest.length}`);

if (duplicates.length > 0) {
  console.log('\nDuplicates:');
  duplicates.forEach(d => console.log(`  ${d.name}: ${d.count} times`));
}

if (missingComponents.length > 0) {
  console.log('\nMissing components:');
  missingComponents.slice(0, 20).forEach(c => console.log(`  ${c}`));
  if (missingComponents.length > 20) console.log(`  ... and ${missingComponents.length - 20} more`);
}

if (missingFromManifest.length > 0) {
  console.log('\nComponents in routes but not in manifest:');
  missingFromManifest.slice(0, 20).forEach(c => console.log(`  ${c}`));
  if (missingFromManifest.length > 20) console.log(`  ... and ${missingFromManifest.length - 20} more`);
}

// Now run the build and capture errors
console.log('\n=== RUNNING BUILD ===');
