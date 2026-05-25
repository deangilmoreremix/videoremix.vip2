#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';

// Helper: convert kebab-case slug to PascalCase with "Page" suffix
function slugToPascalCase(slug) {
  return slug.split('-')
    .filter(part => part.length > 0)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join('') + 'Page';
}

// Read App.tsx
const appTsx = fs.readFileSync('src/App.tsx', 'utf-8');

// Extract all agent route declarations: path="/agent/..."
const routeLineRegex = /<Route\s+path="\/agent\/([^"]+)"[^>]*element=\{<[^}]+Page\s*\/>/g;
const routes = [];
let m;
while ((m = routeLineRegex.exec(appTsx)) !== null) {
  routes.push(m[1]);
}

// Extract component import statements: const XPage = lazy(() => import("./pages/agents/FilePage"));
const importRegex = /const\s+([A-Za-z0-9_]+)\s*=\s*lazy\(\(\)\s*=>\s*import\("\.\/pages\/agents\/([^"]+)"\)\)/g;
const imports = [];
while ((m = importRegex.exec(appTsx)) !== null) {
  imports.push({ variable: m[1], file: m[2] });
}

// Read appsData.ts
const appsDataTs = fs.readFileSync('src/data/appsData.ts', 'utf-8');
const agentIdRegex = /id:\s*"([^"]+)",/g;
const appsIds = [];
while ((m = agentIdRegex.exec(appsDataTs)) !== null) {
  appsIds.push(m[1]);
}

// Read manifests
const manifest = JSON.parse(fs.readFileSync('scripts/conversion/output/registration-manifest.json', 'utf-8'));
const manifestApps = manifest.map(e => e.appName);

const flatManifest = JSON.parse(fs.readFileSync('scripts/conversion/output/flat-manifest.json', 'utf-8'));
const flatManifestApps = flatManifest.map(e => e.appName);

// Read generated-apps.json if exists
let generatedApps = [];
try {
  generatedApps = JSON.parse(fs.readFileSync('scripts/conversion/output/generated-apps.json', 'utf-8')).map(e => e.appName);
} catch (e) {}

// List actual component files
const agentsDir = 'src/pages/agents';
const componentFiles = fs.readdirSync(agentsDir)
  .filter(f => f.endsWith('.tsx'))
  .map(f => f.replace('.tsx', ''));

// Analyze duplicates in routes
const routeCounts = {};
routes.forEach(route => {
  routeCounts[route] = (routeCounts[route] || 0) + 1;
});
const duplicateRoutes = Object.entries(routeCounts)
  .filter(([_, count]) => count > 1)
  .map(([route, count]) => ({ route, count }));

// Analyze duplicates in manifest
const manifestCounts = {};
manifestApps.forEach(app => {
  manifestCounts[app] = (manifestCounts[app] || 0) + 1;
});
const duplicateManifest = Object.entries(manifestCounts)
  .filter(([_, count]) => count > 1)
  .map(([app, count]) => ({ app, count }));

// Expected component files from imports (unique)
const expectedFromImports = [...new Set(imports.map(i => i.file))];

// Expected component files from manifest (via appName -> PascalCase)
const expectedFromManifest = manifestApps.map(appName => slugToPascalCase(appName));

// Expected component files from routes
const expectedFromRoutes = [...new Set(routes.map(route => slugToPascalCase(route)))];

// Find missing components based on manifest expectations
const missingFromManifest = expectedFromManifest.filter(
  name => !componentFiles.includes(name)
);

// Find missing components based on imports (should be none if buildable)
const missingFromImports = expectedFromImports.filter(
  name => !componentFiles.includes(name)
);

// Find extra component files not referenced by any manifest entry
const extraComponents = componentFiles.filter(
  name => !expectedFromManifest.includes(name) && !expectedFromImports.includes(name)
);

// Routes not in appsData
const routesNotInApps = [...new Set(routes)].filter(route => !appsIds.includes(route));

// appsData entries not in routes
const appsNotInRoutes = appsIds.filter(id => !routes.includes(id));

// Summary counts
const totalUniqueRoutes = new Set(routes).size;
const totalUniqueImports = new Set(imports.map(i => i.file)).size;

console.log('\n========================================');
console.log('AGENT VALIDATION REPORT');
console.log('========================================\n');

console.log(`Total route declarations in App.tsx: ${routes.length}`);
console.log(`Total unique route paths: ${totalUniqueRoutes}`);
console.log(`Total component import statements: ${imports.length}`);
console.log(`Total unique imported files: ${totalUniqueImports}`);
console.log(`Total apps in appsData.ts: ${appsIds.length}`);
console.log(`Total entries in registration-manifest: ${manifestApps.length}`);
console.log(`Total entries in flat-manifest: ${flatManifestApps.length}`);
console.log(`Total entries in generated-apps: ${generatedApps.length}`);
console.log(`Total component files in src/pages/agents/: ${componentFiles.length}`);

console.log('\n--- Duplicate Route Declarations ---');
if (duplicateRoutes.length > 0) {
  duplicateRoutes.forEach(({route, count}) => {
    console.log(`  "${route}" appears ${count} times`);
  });
} else {
  console.log('  None');
}

console.log('\n--- Duplicate Manifest Entries ---');
if (duplicateManifest.length > 0) {
  duplicateManifest.forEach(({app, count}) => {
    console.log(`  "${app}" appears ${count} times`);
  });
} else {
  console.log('  None');
}

console.log('\n--- Routes Not in appsData ---');
if (routesNotInApps.length > 0) {
  routesNotInApps.forEach(route => console.log(`  ${route}`));
} else {
  console.log('  None');
}

console.log('\n--- appsData Entries Not in Routes ---');
if (appsNotInRoutes.length > 0) {
  appsNotInRoutes.forEach(id => console.log(`  ${id}`));
} else {
  console.log('  None (all appsData entries have routes)');
}

console.log('\n--- Missing Component Files (expected from manifest) ---');
if (missingFromManifest.length > 0) {
  missingFromManifest.slice(0, 20).forEach(name => console.log(`  ${name}`));
  if (missingFromManifest.length > 20) {
    console.log(`  ... and ${missingFromManifest.length - 20} more`);
  }
} else {
  console.log('  None');
}

console.log('\n--- Extra Component Files (not referenced by manifest) ---');
if (extraComponents.length > 0) {
  extraComponents.slice(0, 20).forEach(name => console.log(`  ${name}`));
  if (extraComponents.length > 20) {
    console.log(`  ... and ${extraComponents.length - 20} more`);
  }
} else {
  console.log('  None');
}

console.log('\n--- Missing Component Files (expected from imports) ---');
if (missingFromImports.length > 0) {
  missingFromImports.forEach(name => console.log(`  ${name}`));
} else {
  console.log('  None');
}

// Build validation
console.log('\n--- Build Validation ---');
const buildResult = await executeBuild();
console.log(`Build exit code: ${buildResult.code}`);
console.log(`Build output lines: ${buildResult.output.length}`);

// Parse build errors
const errorLines = buildResult.output.filter(line => 
  line.includes('error') || 
  line.includes('ERROR') || 
  line.includes('Failed') ||
  line.includes('duplicate')
);

const warningLines = buildResult.output.filter(line =>
  line.includes('warning') ||
  line.includes('WARNING')
);

console.log(`Total error lines: ${errorLines.length}`);
console.log(`Total warning lines: ${warningLines.length}`);

// Detect duplicate symbol errors
const duplicateSymbolErrors = errorLines.filter(line => 
  line.includes('has already been declared') ||
  line.includes('Duplicate identifier')
);

console.log(`Duplicate symbol errors: ${duplicateSymbolErrors.length}`);

// Save full output if errors
if (errorLines.length > 0) {
  fs.writeFileSync('scripts/conversion/build-errors.log', buildResult.output.join('\n'));
  console.log('Full build log saved to scripts/conversion/build-errors.log');
}

// Build final report
const report = {
  total_agents_expected: 140,
  total_routes_registered: routes.length,
  total_unique_routes: totalUniqueRoutes,
  total_imports: imports.length,
  total_unique_imports: totalUniqueImports,
  total_apps_in_appsData: appsIds.length,
  total_apps_in_manifest: manifestApps.length,
  total_apps_in_flat_manifest: flatManifestApps.length,
  total_apps_in_generated: generatedApps.length,
  total_component_files: componentFiles.length,
  duplicates: {
    routes: duplicateRoutes,
    manifest: duplicateManifest
  },
  missing_components_from_manifest: missingFromManifest,
  missing_components_from_imports: missingFromImports,
  extra_components: extraComponents,
  routes_not_in_appsData: routesNotInApps,
  appsData_not_in_routes: appsNotInRoutes,
  build: {
    exit_code: buildResult.code,
    error_count: errorLines.length,
    warning_count: warningLines.length,
    duplicate_symbol_errors: duplicateSymbolErrors.length,
    errors: errorLines.slice(0, 50), // first 50 errors
    warnings: warningLines.slice(0, 20)
  },
  status: buildResult.code === 0 ? 'pass' : (errorLines.length > 0 ? 'fail' : 'partial')
};

fs.writeFileSync('scripts/conversion/validation-report.json', JSON.stringify(report, null, 2));
console.log('\n✅ Validation report saved to scripts/conversion/validation-report.json');

// Helper function to run build
async function executeBuild() {
  return new Promise((resolve) => {
    const lines = [];
    const proc = exec('npm run build', { cwd: process.cwd() }, (error, stdout, stderr) => {
      const output = stdout.split('\n').concat(stderr.split('\n')).filter(l => l.trim());
      resolve({
        code: error ? error.code : 0,
        output: output
      });
    });
    proc.stdout.on('data', (data) => { 
      const newLines = data.toString().split('\n').filter(l => l.trim());
      lines.push(...newLines);
    });
    proc.stderr.on('data', (data) => { 
      const newLines = data.toString().split('\n').filter(l => l.trim());
      lines.push(...newLines);
    });
    proc.on('exit', (code) => {
      setTimeout(() => resolve({ code, output: lines }), 2000);
    });
  });
}
