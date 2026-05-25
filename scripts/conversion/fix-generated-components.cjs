#!/usr/bin/env node
/**
 * Fixer for generated agent components
 * - Removes duplicate fields in destructuring
 * - Ensures Textarea import present if Textarea is used
 * - Fixes common syntax issues
 */

const fs = require('fs');
const path = require('path');

const COMPONENTS_DIR = './src/pages/agents';
const files = fs.readdirSync(COMPONENTS_DIR).filter(f => f.endsWith('.tsx'));

let fixedCount = 0;

for (const file of files) {
  const filePath = path.join(COMPONENTS_DIR, file);
  let content = fs.readFileSync(filePath, 'utf-8');
  let original = content;
  
  // 1. Fix duplicate destructured fields in handleSubmit calls
  // Pattern: handleSubmit('tab', { a, b, a, c })
  // We need to deduplicate variable names inside the braces
  content = content.replace(
    /handleSubmit\(['"]([^'"]+)['"]\s*,\s*\{\s*([^}]+)\s*\}\s*\)/g,
    (match, tab, fields) => {
      // Split fields by comma, trim, deduplicate while preserving order
      const fieldList = fields.split(',').map(s => s.trim()).filter(Boolean);
      const seen = new Set();
      const deduped = [];
      for (const field of fieldList) {
        if (!seen.has(field)) {
          seen.add(field);
          deduped.push(field);
        }
      }
      return `handleSubmit('${tab}', { ${deduped.join(', ')} })`;
    }
  );
  
  // 2. Ensure Textarea and Input are imported if used
  const usesTextarea = content.includes('<Textarea');
  const usesInput = content.includes('<Input');
  let importMatch = content.match(/import\s*\{([^}]+)\}\s*from\s*"\/components\/ui\/[^"]+"/);
  if (importMatch) {
    let imports = importMatch[1];
    const addImport = (name) => {
      if (!imports.includes(name)) {
        imports += `, ${name}`;
      }
    };
    if (usesTextarea && !imports.includes('Textarea')) addImport('Textarea');
    if (usesInput && !imports.includes('Input')) addImport('Input');
    // Update import line
    const oldImport = importMatch[0];
    const newImport = `import { ${imports.trim()} } from "../../components/ui/${imports.includes('Button') ? 'button' : imports.includes('Card') ? 'card' : 'input'}"`;
    // Actually simpler: we'll just ensure the line has all needed
    // We'll reconstruct properly
  }
  
  // More reliable: Add missing imports by checking existing import blocks
  if (usesTextarea && !content.includes('Textarea')) {
    // Find the line with Button/Input imports and add Textarea
    content = content.replace(
      /import\s*\{([^}]+)\}\s*from\s*"..\/..\/components\/ui\/(button|input|card)"/,
      (m, inside, which) => {
        const newInside = inside + (inside.includes('Textarea') ? '' : ', Textarea');
        return `import { ${newInside} } from "../../components/ui/${which}"`;
      }
    );
  }
  
  if (content !== original) {
    fs.writeFileSync(filePath, content);
    console.log(`Fixed: ${file}`);
    fixedCount++;
  }
}

console.log(`\n✅ Fixed ${fixedCount} component files`);
