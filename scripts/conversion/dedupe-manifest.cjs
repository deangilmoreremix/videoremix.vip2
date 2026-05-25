const fs = require('fs');
const path = require('path');

const manifestPath = path.join(__dirname, 'output', 'flat-manifest.json');
const dedupedPath = path.join(__dirname, 'output', 'flat-manifest-deduped.json');

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

// Make componentName unique by appending category if needed
const componentNameCounts = {};
manifest.forEach(app => {
  const baseName = app.componentName;
  if (!componentNameCounts[baseName]) {
    componentNameCounts[baseName] = 0;
  }
  componentNameCounts[baseName]++;
});

// Now assign unique componentNames
const seen = new Set();
const deduped = manifest.filter(app => {
  if (seen.has(app.appSlug)) {
    return false;
  }
  seen.add(app.appSlug);
  return true;
});

// For the remaining apps, make componentName unique
const usedComponentNames = new Set();
deduped.forEach(app => {
  let componentName = app.componentName;
  let counter = 1;
  while (usedComponentNames.has(componentName)) {
    // Remove 'Page' suffix and add category prefix
    const baseName = componentName.replace('Page', '');
    componentName = `${app.category.replace(/[-_]/g, '')}${baseName}Page`;
    if (counter > 1) {
      componentName = componentName.replace('Page', `${counter}Page`);
    }
    counter++;
  }
  app.componentName = componentName;
  usedComponentNames.add(componentName);
});

fs.writeFileSync(dedupedPath, JSON.stringify(deduped, null, 2));
console.log(`Deduped ${manifest.length} to ${deduped.length} apps with unique componentNames`);