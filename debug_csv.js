import fs from 'fs';
import path from 'path';

function parseCSVLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"' && (i === 0 || line[i-1] !== '\\')) {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  values.push(current.trim());
  return values;
}

// Test with first few lines
const fileContent = fs.readFileSync('/workspaces/videoremix.vip2/users_to_import.csv', 'utf8');
const lines = fileContent.split('\n').filter(line => line.trim() !== '');

console.log('Total lines:', lines.length);

const headerValues = parseCSVLine(lines[0]);
const headers = headerValues.map(h => h.trim());
console.log('Headers:', headers);

for (let i = 1; i <= 3 && i < lines.length; i++) {
  const line = lines[i].trim();
  if (line === '') continue;
  
  console.log(`\nLine ${i+1}:`);
  console.log('Raw:', line);
  
  const values = parseCSVLine(line);
  console.log('Values count:', values.length);
  values.forEach((val, idx) => {
    console.log(`  [${idx}] ${headers[idx] || 'unknown'}: "${val}"`);
  });
  
  const emailIndex = headers.findIndex(h => h.toLowerCase() === 'email');
  const productIndex = headers.findIndex(h => h.toLowerCase() === 'products_purchased');
  
  if (emailIndex !== -1 && productIndex !== -1) {
    console.log(`  Email: "${values[emailIndex]}"`);
    console.log(`  Products: "${values[productIndex]}"`);
  }
}