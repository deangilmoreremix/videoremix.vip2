const fs = require('fs');
const manifest = JSON.parse(fs.readFileSync('scripts/conversion/output/flat-manifest-deduped.json', 'utf8'));

const componentNames = manifest.map(app => app.componentName);
const unique = new Set(componentNames);

console.log(`Total apps: ${manifest.length}`);
console.log(`Unique componentNames: ${unique.size}`);

if (componentNames.length !== unique.size) {
  const duplicates = componentNames.filter((name, index) => componentNames.indexOf(name) !== index);
  console.log('Duplicates:', [...new Set(duplicates)]);
}