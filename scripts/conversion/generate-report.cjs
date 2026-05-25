#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Parse App.tsx for agent routes
const appTsxContent = fs.readFileSync('src/App.tsx', 'utf8');

// Extract route components: element={<ComponentName />}
const routeRegex = /<Route\s+path="\/agent\/[^"]+"\s+element={<(\w+)\s*\/>}/g;
const routeComponents = new Set();
let match;
while ((match = routeRegex.exec(appTsxContent)) !== null) {
  routeComponents.add(match[1]);
}

// Also find all lazy imports of agent pages
const importRegex = /const\s+(\w+)\s*=\s*lazy\(\(\)\s*=>\s*import\(["']\.\/pages\/agents\/(\w+)\.tsx["']\)\)/g;
const declaredComponents = new Set();
while ((match = importRegex.exec(appTsxContent)) !== null) {
  declaredComponents.add(match[1]);
}

// List all .tsx agent component files
const agentsDir = 'src/pages/agents';
const allFiles = fs.readdirSync(agentsDir).filter(f => f.endsWith('.tsx'));
const nonAgentPages = ['index', 'AppPage', 'FinancialCoachPage', 'EmailGTMPage', 'ReasoningAgentPage', 'WebScrapingAgentPage', 'FinanceAgentPage', 'SocialBuzzAIPage', 'PodcastifyAIPage', 'ConsultProAIPage', 'LaunchRocketAIPage', 'SalesForceAIPage'];
const componentFiles = allFiles.filter(f => !nonAgentPages.includes(f.replace('.tsx', '')));
const componentNames = new Set(componentFiles.map(f => f.replace('.tsx', '')));

// Components referenced in routes but file doesn't exist
const missingFromRoutes = Array.from(routeComponents).filter(c => !componentNames.has(c));

// Components whose filenames start with a digit (invalid JS identifier)
const invalidSyntaxFiles = componentFiles.filter(f => /^\d/.test(f.replace('.tsx', '')));

// Read manifest
function readJSON(fp) {
  try { return JSON.parse(fs.readFileSync(fp, 'utf8')); } catch(e) { return null; }
}
const manifest = readJSON('scripts/conversion/output/registration-manifest.json');
const manifestAppNames = manifest ? manifest.map(e => e.appName) : [];

// Duplicates in manifest
const counts = {};
manifestAppNames.forEach(n => counts[n] = (counts[n]||0)+1);
const duplicates = Object.entries(counts).filter(([_,c]) => c>1).map(([n,c]) => `${n} (${c}x)`);

// Build errors
let buildErrors = [];
const buildLog = 'scripts/conversion/build-output.log';
if (fs.existsSync(buildLog)) {
  const log = fs.readFileSync(buildLog, 'utf8');
  buildErrors = log.split('\n').filter(l => l.includes('ERROR:') || l.includes('error during build') || l.includes('Syntax error'));
}

if (buildErrors.length > 0) {
  fs.writeFileSync('scripts/conversion/build-errors.log', buildErrors.join('\n'));
}

// Summary
const hasBuildErrors = buildErrors.length > 0 || invalidSyntaxFiles.length > 0;
const status = hasBuildErrors ? 'fail' : (missingFromRoutes.length > 0 ? 'partial' : 'pass');

console.log('=== ANALYSIS ===');
console.log(`Routes:                    ${routeComponents.size}`);
console.log(`Component files:           ${componentFiles.length}`);
console.log(`Valid syntax files:        ${componentFiles.length - invalidSyntaxFiles.length}`);
console.log(`Invalid syntax files:      ${invalidSyntaxFiles.length}`);
console.log(`Missing from routes:       ${missingFromRoutes.length}`);
console.log(`Manifest entries:          ${manifestAppNames.length}`);
console.log(`Duplicates in manifest:    ${duplicates.length}`);
console.log(`Build errors captured:     ${buildErrors.length > 0 ? 'Yes' : 'No'}`);

console.log('\n--- Missing in routes ---');
missingFromRoutes.slice(0, 20).forEach(c => console.log(`  ${c}`));

console.log('\n--- Invalid files ---');
invalidSyntaxFiles.slice(0, 10).forEach(f => console.log(`  ${f}`));

console.log('\n--- Duplicates ---');
duplicates.slice(0, 10).forEach(d => console.log(`  ${d}`));

console.log('\n--- Build error (first) ---');
if (buildErrors.length > 0) console.log(`  ${buildErrors[0]}`);

// Save report
const report = {
  total_agents_expected: 140,
  total_routes_registered: routeComponents.size,
  total_components_exist: componentFiles.length - invalidSyntaxFiles.length,
  total_apps_in_manifest: manifestAppNames.length,
  duplicates: duplicates,
  missing_components: missingFromRoutes,
  invalid_component_names: invalidSyntaxFiles,
  build_errors: buildErrors.slice(0, 20),
  status: status
};

fs.writeFileSync('scripts/conversion/validation-report.json', JSON.stringify(report, null, 2));
console.log('\nReport saved: scripts/conversion/validation-report.json');
console.log(`Status: ${status.toUpperCase()}`);
