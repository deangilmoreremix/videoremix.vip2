// Network Request Failure Analysis
// Identify and fix resource loading issues

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

console.log('🔍 NETWORK REQUEST FAILURE ANALYSIS');
console.log('====================================\n');

// Check Vite configuration
console.log('1️⃣  VITE CONFIGURATION CHECK');
console.log('----------------------------');

try {
  const viteConfig = readFileSync('./vite.config.ts', 'utf8');
  console.log('✅ Vite config found');

  // Check for problematic configurations
  if (viteConfig.includes('flag-triangle-right')) {
    console.log('⚠️  flag-triangle-right found in config');
  }

  // Check for CSP or security headers
  if (viteConfig.includes('Content-Security-Policy') || viteConfig.includes('CSP')) {
    console.log('📋 CSP configuration detected');
  }

} catch (error) {
  console.log('❌ Vite config not found or unreadable');
}

// Check for problematic imports
console.log('\n2️⃣  PROBLEMATIC IMPORTS ANALYSIS');
console.log('-------------------------------');

function findProblematicImports() {
  const files = [
    'src/pages/DashboardPage.tsx',
    'src/components/dashboard/DashboardToolsSection.tsx',
    'src/components/dashboard/DashboardPersonalizerSection.tsx'
  ];

  const problematicPatterns = [
    'flag-triangle-right',
    'triangle-right',
    'lucide-react/dist',
    'lucide-react/esm'
  ];

  files.forEach(file => {
    try {
      if (existsSync(file)) {
        const content = readFileSync(file, 'utf8');
        problematicPatterns.forEach(pattern => {
          if (content.includes(pattern)) {
            console.log(`⚠️  Found ${pattern} in ${file}`);
          }
        });
      }
    } catch (error) {
      console.log(`❌ Could not check ${file}:`, error.message);
    }
  });
}

findProblematicImports();

// Check lucide-react version and imports
console.log('\n3️⃣  LUCIDE REACT ANALYSIS');
console.log('-----------------------');

try {
  const packageJson = JSON.parse(readFileSync('./package.json', 'utf8'));
  const lucideVersion = packageJson.dependencies['lucide-react'] || packageJson.devDependencies['lucide-react'];

  console.log(`Lucide React version: ${lucideVersion}`);

  // Check for problematic icon imports
  const iconImports = [
    'TriangleRight',
    'FlagTriangleRight',
    'Triangle',
    'Flag'
  ];

  // Scan common files for icon usage
  const filesToCheck = [
    'src/pages/DashboardPage.tsx',
    'src/components/dashboard/DashboardToolsSection.tsx'
  ];

  filesToCheck.forEach(file => {
    try {
      const content = readFileSync(file, 'utf8');
      iconImports.forEach(icon => {
        if (content.includes(icon)) {
          console.log(`🔍 ${icon} used in ${file}`);
        }
      });
    } catch (error) {
      // File might not exist, skip
    }
  });

} catch (error) {
  console.log('❌ Could not analyze lucide-react:', error.message);
}

// Check for missing assets
console.log('\n4️⃣  ASSET AVAILABILITY CHECK');
console.log('----------------------------');

const commonAssets = [
  'src/assets/',
  'public/',
  'dist/assets/'
];

commonAssets.forEach(dir => {
  try {
    if (existsSync(dir)) {
      console.log(`✅ ${dir} exists`);
    } else {
      console.log(`❌ ${dir} missing`);
    }
  } catch (error) {
    console.log(`❌ Could not check ${dir}:`, error.message);
  }
});

// Check for CSP issues
console.log('\n5️⃣  CSP AND SECURITY ANALYSIS');
console.log('----------------------------');

// Check for CSP headers in HTML
try {
  const indexHtml = readFileSync('./index.html', 'utf8');
  if (indexHtml.includes('Content-Security-Policy') || indexHtml.includes('CSP')) {
    console.log('📋 CSP found in index.html');
  }

  // Check for media-src restrictions
  if (indexHtml.includes('media-src')) {
    console.log('🎵 media-src CSP directive found');
  } else {
    console.log('⚠️  No media-src CSP directive (may block media loading)');
  }

} catch (error) {
    console.log('❌ Could not check index.html:', error.message);
}

// Recommendations
console.log('\n🎯 RECOMMENDATIONS');
console.log('==================');

const recommendations = [
  '🔧 Update CSP to allow media-src for video content',
  '🛠️ Fix any problematic lucide-react icon imports',
  '📦 Ensure all assets are properly referenced',
  '🌐 Add proper error handling for failed resource loads',
  '⚡ Implement lazy loading for large components',
  '🔄 Add retry logic for failed network requests'
];

recommendations.forEach(rec => console.log(`  ${rec}`));

console.log('\n📊 ANALYSIS COMPLETE');
console.log('===================');
console.log('Next: Implement fixes for identified issues');