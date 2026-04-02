const fs = require('fs');
const path = require('path');

const filePath = process.argv[2] || '/workspaces/videoremix.vip2/users_to_import.csv';

if (!fs.existsSync(filePath)) {
  console.error(`File not found: ${filePath}`);
  process.exit(1);
}

const fileContent = fs.readFileSync(filePath, 'utf8');
const lines = fileContent.split('\n').filter(line => line.trim() !== '');

if (lines.length === 0) {
  console.log('CSV file is empty');
  process.exit(0);
}

// Parse headers
const headerLine = lines[0];
const headers = headerLine.split(',').map(h => h.trim());
const emailIndex = headers.findIndex(h => h.toLowerCase() === 'email');

if (emailIndex === -1) {
  console.error('Could not find email column in CSV. Headers:', headers);
  process.exit(1);
}

// Extract emails from data rows
const emails = new Set();

for (let i = 1; i < lines.length; i++) {
  const line = lines[i].trim();
  if (line === '') continue;

  // Parse CSV line respecting quotes
  const values = [];
  let current = '';
  let inQuotes = false;

  for (let j = 0; j < line.length; j++) {
    const char = line[j];

    if (char === '"' && (j === 0 || line[j-1] !== '\\')) {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  // Add the last field
  values.push(current.trim());

  // We expect at least 8 fields (if total_spend has no comma)
  // If total_spend has commas, we will have more fields.
  if (values.length < 8) {
    // Skip rows with insufficient columns
    continue;
  }

  const email = values[emailIndex];
  if (email) {
    emails.add(email.toLowerCase());
  }
}

console.log(`Found ${emails.size} unique email addresses in CSV:`);
const sortedEmails = Array.from(emails).sort();
sortedEmails.forEach((email, index) => {
  console.log(`${index + 1}: ${email}`);
});