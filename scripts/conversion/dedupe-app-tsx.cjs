const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf-8');

// Find all lazy import lines
const lines = content.split('\n');
const seenImports = new Set();
const dedupedLines = [];

for (const line of lines) {
  if (line.includes('const ') && line.includes('lazy(() => import(') && line.includes('pages/agents/')) {
    // Extract the component name
    const match = line.match(/const (\w+) = lazy/);
    if (match) {
      const componentName = match[1];
      if (seenImports.has(componentName)) {
        console.log(`Removing duplicate: ${componentName}`);
        continue;
      }
      seenImports.add(componentName);
    }
  }
  dedupedLines.push(line);
}

const dedupedContent = dedupedLines.join('\n');
fs.writeFileSync('src/App.tsx', dedupedContent);
console.log(`Removed duplicates, kept ${seenImports.size} unique imports`);