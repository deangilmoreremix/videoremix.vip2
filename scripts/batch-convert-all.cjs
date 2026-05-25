#!/usr/bin/env node

const fs = require('fs');
const { execSync } = require('child_process');

console.log('Starting batch conversion of all Streamlit apps...');

// Find all Streamlit apps
const findCommand = "find awesome-llm-apps -name 'app.py' -type f -exec dirname {} \\; | sort | uniq";
const streamlitApps = execSync(findCommand, { encoding: 'utf8' }).trim().split('\n').filter(Boolean);

console.log(`Found ${streamlitApps.length} Streamlit apps to convert`);

let successCount = 0;
let failureCount = 0;
const newApps = [];

for (const appDir of streamlitApps) {
  console.log(`Converting ${appDir}...`);

  try {
    // Step 1: Analyze
    const metadataOutput = execSync(`node scripts/analyze-streamlit-app.cjs "${appDir}"`, { encoding: 'utf8' });
    const metadata = JSON.parse(metadataOutput.trim());

    // Step 2: Generate Netlify function
    const functionName = execSync(`node scripts/generate-netlify-function.cjs '${JSON.stringify(metadata)}'`, { encoding: 'utf8' }).trim();

    // Step 3: Generate React component
    execSync(`node scripts/generate-react-component.cjs '${JSON.stringify(metadata)}' "${functionName}"`, { encoding: 'utf8' });

    // Prepare app metadata for registration
    const appSlug = appDir.split('/').pop().toLowerCase().replace(/[^a-z0-9]/g, '_');
    const appName = metadata.appName || 'Unknown App';
    const componentName = `App${appName.replace(/[^a-zA-Z0-9]/g, "").replace(/^[0-9]+/, "")}App`;

    newApps.push({
      slug: appSlug,
      name: appName,
      component: componentName
    });

    successCount++;
    console.log(`Successfully converted ${appDir}`);
  } catch (error) {
    console.error(`Failed to convert ${appDir}:`, error.message);
    failureCount++;
  }
}

console.log(`Conversion complete: ${successCount} successful, ${failureCount} failed`);

// Register all new apps
if (newApps.length > 0) {
  try {
    execSync(`node scripts/register-apps.cjs '${JSON.stringify(newApps)}'`, { encoding: 'utf8' });
    console.log(`Registered ${newApps.length} new apps`);
  } catch (error) {
    console.error('Failed to register apps:', error.message);
  }
}

console.log('Batch conversion finished!');
