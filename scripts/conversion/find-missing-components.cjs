const fs = require('fs');
const path = require('path');

const content = fs.readFileSync('src/App.tsx', 'utf-8');
const lines = content.split('\n');

const missingComponents = [];

for (const line of lines) {
  if (line.includes('const ') && line.includes('lazy(() => import("./pages/agents/')) {
    const match = line.match(/import\("\.\/pages\/agents\/([^"]+)"\)/);
    if (match) {
      const componentFile = match[1];
      const componentPath = path.join('src/pages/agents', componentFile + '.tsx');
      if (!fs.existsSync(componentPath)) {
        missingComponents.push(componentFile);
      }
    }
  }
}

console.log('Missing component files:');
missingComponents.forEach(comp => console.log(`- ${comp}`));
console.log(`\nTotal missing: ${missingComponents.length}`);