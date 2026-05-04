#!/usr/bin/env node

const fs = require('fs');

/**
 * Register new apps in App.tsx and appsData.ts
 * Usage: node scripts/register-apps.ts <app-metadata-json>
 */

function registerApps(newApps) {
  // Read current appsData.ts
  const appsDataPath = 'src/data/appsData.ts';
  let appsDataContent = fs.readFileSync(appsDataPath, 'utf8');

  // Add new apps to appsData
  const newAppsData = newApps.map(app => `
  {
    id: '${app.slug}',
    name: '${app.name}',
    description: '${app.description || 'Auto-generated app'}',
    category: '${app.category || 'AI Tools'}',
    icon: '${app.icon || '🤖'}',
    featured: false,
    tags: ${JSON.stringify(app.tags || [])},
    component: lazy(() => import('../components/apps/${app.component}')),
    apiEndpoint: '/.netlify/functions/${app.slug}',
    createdAt: new Date().toISOString()
  }`).join(',\n');

  // Insert before the closing bracket
  appsDataContent = appsDataContent.replace(
    /(export const appsData.*?= \[[\s\S]*?)(\];)/,
    `$1${newAppsData},\n$2`
  );

  fs.writeFileSync(appsDataPath, appsDataContent);
  console.log('Updated appsData.ts');

  // Read current App.tsx
  const appTsxPath = 'src/App.tsx';
  let appTsxContent = fs.readFileSync(appTsxPath, 'utf8');

  // Add new routes
  const newRoutes = newApps.map(app => `
          <Route path="/agent/${app.slug}" element={<${app.component} />} />`).join('\n');

  // Insert before the closing Routes
  appTsxContent = appTsxContent.replace(
    /(.*<Routes>[\s\S]*?)(<\/Routes>)/,
    `$1${newRoutes}\n$2`
  );

  fs.writeFileSync(appTsxPath, appTsxContent);
  console.log('Updated App.tsx');
}

// Main execution
const newAppsJson = process.argv[2];
if (!newAppsJson) {
  console.error('Usage: node scripts/register-apps.ts <new-apps-json>');
  process.exit(1);
}

const newApps = JSON.parse(newAppsJson);
registerApps(newApps);