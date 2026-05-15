import { bundles } from './src/data/bundleData.js';

const allApps = new Set();
bundles.forEach(bundle => {
  bundle.apps.forEach(app => allApps.add(app));
});

console.log(`Total unique apps: ${allApps.size}`);
console.log('\nAll app slugs:');
Array.from(allApps).sort().forEach(slug => console.log(`- ${slug}`));

console.log('\nBundle breakdown:');
bundles.forEach(bundle => {
  console.log(`${bundle.id}: ${bundle.apps.length} apps`);
});
