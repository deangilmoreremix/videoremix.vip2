#!/usr/bin/env node

/**
 * App Registration Script
 *
 * Automatically adds new agent pages to:
 * 1. src/App.tsx - route imports and declarations
 * 2. src/data/appsData.ts - app metadata for dashboard
 * 3. src/pages/agents/index.ts (optional barrel export)
 *
 * Usage: node register-apps.js <generated-metadata.json>
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface GeneratedApp {
  appName: string;
  appSlug: string;
  componentName: string;
  category: string;
  uiType: string;
  complexity: string;
  template: string;
  outputPath?: string;
}

function toPascalCase(str: string): string {
  return str.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');
}

function toKebabCase(str: string): string {
  return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

function capitalizeWords(str: string): string {
  return str.split(/[-_]/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
}

function generateAppDescription(appName: string, category: string): string {
  // Generate generic description based on category
  const descriptions: Record<string, string> = {
    'starter_ai_agents': 'AI-powered assistant for automating everyday tasks.',
    'advanced_ai_agents': 'Advanced AI agent for complex workflows.',
    'rag_tutorials': 'Retrieval-augmented generation agent for document Q&A.',
    'voice_ai_agents': 'Voice-enabled AI agent with speech synthesis.',
    'mcp_ai_agents': 'Model Context Protocol agent for tool integration.',
  };
  return descriptions[category] || 'AI agent that helps you get things done.';
}

function generateGradientCategory(complexity: string): string {
  if (complexity === 'simple') return 'from-blue-600 to-blue-400';
  if (complexity === 'multi-agent') return 'from-purple-600 to-purple-400';
  if (complexity === 'rag') return 'from-green-600 to-green-400';
  if (complexity === 'complex') return 'from-orange-600 to-orange-400';
  return 'from-gray-600 to-gray-400';
}

function getIconComponent(uiType: string): string {
  const icons: Record<string, string> = {
    'chat': 'MessageSquare',
    'form': 'FileText',
    'multi-tab': 'Layers',
    'file-upload': 'Upload',
    'dashboard': 'BarChart3'
  };
  return icons[uiType] || 'Sparkles';
}

async function updateAppTsx(apps: GeneratedApp[]) {
  const appTsxPath = './src/App.tsx';
  if (!fs.existsSync(appTsxPath)) {
    console.error(`❌ App.tsx not found at ${appTsxPath}`);
    return false;
  }

  let content = fs.readFileSync(appTsxPath, 'utf-8');

  // 2. Add lazy import declarations
  // Insert before "// Generic pages" comment or after "const ToolsHubPage"
  const importBlock = apps.map(app => `  const ${app.componentName} = lazy(() => import("./pages/agents/${app.componentName}"));`).join('\n');
  const importInsertRegex = /(\/\/ Generic pages\n|const ToolsHubPage = lazy.*\n)/;
  if (content.match(importInsertRegex)) {
    content = content.replace(importInsertRegex, `${importBlock}\n\n$1`);
  } else {
    // Fallback: insert after last existing lazy import (before generic pages)
    content = content.replace(
      /(\/\/ Generic pages)/,
      `${importBlock}\n\n$1`
    );
  }

  // 2. Add route in Routes section
  // Find a good insertion point: after EmailGTMPage (last known agent) or after SocialBuzz page
  const routeInsertRegex = /(\s{2}const EmailGTMPage = lazy.*\n)/;
  const routeLine = apps.map(app => `  const ${app.componentName} = lazy(() => import("./pages/agents/${app.componentName}"));`).join('\n');
  
  if (content.match(routeInsertRegex)) {
    content = content.replace(routeInsertRegex, `$1\n${routeLine}\n`);
  } else {
    console.warn('⚠️  Could not find optimal route insertion point in App.tsx');
  }

  // 3. Add Route in Routes section
  // Insert before closing </Routes>
  const routesSection = content.match(/<Routes[\s\S]*?<\/Routes>/)?.[0];
  if (routesSection) {
    const newRoutes = apps.map(app => `        <Route path="/agent/${app.appSlug}" element={<${app.componentName} />} />`).join('\n          ');
    // Find last route and insert after
    const lastRouteMatch = content.match(/\s{8}<Route[^>]*>[\s\S]*?<\/Route>\s*$/m);
    if (lastRouteMatch) {
      content = content.replace(
        lastRouteMatch[0],
        lastRouteMatch[0] + '\n' + newRoutes + '\n'
      );
    } else {
      // Fallback: insert before </Routes>
      content = content.replace(
        /(\s{8}<\/Routes>)/,
        `  ${newRoutes}\n\n$1`
      );
    }
  }

  fs.writeFileSync(appTsxPath, content);
  console.log(`✅ Updated App.tsx with ${apps.length} new routes`);
  return true;
}

async function updateAppsData(apps: GeneratedApp[]) {
  const appsDataPath = './src/data/appsData.ts';
  if (!fs.existsSync(appsDataPath)) {
    console.error(`❌ appsData.ts not found at ${appsDataPath}`);
    return false;
  }

  let content = fs.readFileSync(appsDataPath, 'utf-8');

  // Build new app entries
  const newEntries = apps.map(app => `  {
    id: "${app.appSlug}",
    name: "${capitalizeWords(app.appName)}",
    description: "${generateAppDescription(app.appName, app.category)}",
    category: "${app.category.replace('_', '-')}",
    icon: Sparkles, // TODO: assign unique icons
    gradient: "bg-gradient-to-br ${generateGradientCategory(app.complexity)}",
    route: "/agent/${app.appSlug}",
    isNew: true,
    complexity: "${app.complexity}"
  },`).join('\n\n');

  // Insert before closing bracket of appsData array
  // Pattern: find the last comma-separated entry before '];'
  content = content.replace(
    /(\s{4}]\s*};)/,
    `  ${newEntries}\n$1`
  );

  fs.writeFileSync(appsDataPath, content);
  console.log(`✅ Updated appsData.ts with ${apps.length} new apps`);
  return true;
}

async function createAgentIndex(apps: GeneratedApp[]) {
  // Create src/pages/agents/index.ts for cleaner imports
  const indexPath = './src/pages/agents/index.ts';
  const exports = apps.map(app => `export { default as ${app.componentName} } from './${app.componentName}';`).join('\n');
  
  fs.writeFileSync(indexPath, `${exports}\n`);
  console.log(`✅ Created agents index.ts`);
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error('Usage: node register-apps.js <generated-metadata.json>');
    process.exit(1);
  }

  const metadataPath = args[0];
  if (!fs.existsSync(metadataPath)) {
    console.error(`File not found: ${metadataPath}`);
    process.exit(1);
  }

  const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
  
  // Normalize: could be single object or array
  const apps: GeneratedApp[] = Array.isArray(metadata) ? metadata : [metadata];

  console.log(`📝 Registering ${apps.length} apps...`);

  // Validate all apps have required fields
  const validApps = apps.filter(app => 
    app.appName && app.appSlug && app.componentName && app.template
  );

  if (validApps.length !== apps.length) {
    console.warn(`⚠️  Skipping ${apps.length - validApps.length} invalid apps`);
  }

  // Sort by complexity (simple first) for better routing order
  validApps.sort((a, b) => {
    const order = { 'simple': 0, 'tool-using': 1, 'rag': 2, 'multi-agent': 3, 'complex': 4 };
    return (order[a.complexity] || 99) - (order[b.complexity] || 99);
  });

  await updateAppTsx(validApps);
  await updateAppsData(validApps);
  await createAgentIndex(validApps);

  console.log(`\n✅ Registration complete! ${validApps.length} apps added.`);
  console.log('🔧 Next: Update any remaining references, run build to verify.');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
