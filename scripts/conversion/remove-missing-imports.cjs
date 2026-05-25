const fs = require('fs');
const path = require('path');

let content = fs.readFileSync('src/App.tsx', 'utf-8');
const lines = content.split('\n');

const newLines = [];
const removedImports = [];
const removedRoutes = [];

for (const line of lines) {
  let keepLine = true;

  // Check lazy imports
  if (line.includes('const ') && line.includes('lazy(() => import("./pages/agents/')) {
    const match = line.match(/import\("\.\/pages\/agents\/([^"]+)"\)/);
    if (match) {
      const componentFile = match[1];
      const componentPath = path.join('src/pages/agents', componentFile + '.tsx');
      if (!fs.existsSync(componentPath)) {
        removedImports.push(componentFile);
        keepLine = false;
      }
    }
  }

  // Check routes
  if (line.includes('<Route path="/agent/') && line.includes('element={<')) {
    const match = line.match(/element=\{<(\w+) \/>\}/);
    if (match) {
      const componentName = match[1];
      const componentPath = path.join('src/pages/agents', componentName + '.tsx');
      if (!fs.existsSync(componentPath)) {
        removedRoutes.push(componentName);
        keepLine = false;
      }
    }
  }

  if (keepLine) {
    newLines.push(line);
  }
}

const newContent = newLines.join('\n');
fs.writeFileSync('src/App.tsx', newContent);

console.log(`Removed ${removedImports.length} missing imports and ${removedRoutes.length} missing routes`);
console.log('Total removed:', removedImports.length + removedRoutes.length);