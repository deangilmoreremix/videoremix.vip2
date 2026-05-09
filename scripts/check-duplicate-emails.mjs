import { readFileSync } from 'fs';
import { join } from 'path';

// Parse CSV function from comprehensive-user-import.mjs
function parseCSV(content) {
  const lines = content.split('\n').filter(line => line.trim());
  const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());

  const records = [];
  for (let i = 1; i < lines.length; i++) {
    const values = [];
    let current = '';
    let inQuotes = false;

    for (let j = 0; j < lines[i].length; j++) {
      const char = lines[i][j];

      if (char === '"' && (j === 0 || lines[i][j-1] !== '\\')) {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    values.push(current.trim());

    if (values.length >= headers.length) {
      const record = {};
      headers.forEach((header, index) => {
        record[header] = values[index] || '';
      });
      records.push(record);
    }
  }

  return records;
}

// CSV configs from comprehensive-user-import.mjs
const csvFiles = [
  {
    path: 'src/data/VR User List - PKS.csv',
    emailField: 'Customer Email',
    nameField: 'Customer Name',
    hasProducts: true,
    productField: 'Product'
  },
  {
    path: 'users_to_import_clean.csv',
    emailField: 'email',
    nameField: null, // Split into first_name, last_name
    firstNameField: 'first_name',
    lastNameField: 'last_name',
    hasProducts: true,
    productField: 'products_purchased'
  },
  {
    path: 'src/data/top_500_customers.csv',
    emailField: 'email',
    nameField: null, // Split into firstName, lastName
    firstNameField: 'firstName',
    lastNameField: 'lastName',
    hasProducts: false
  },
  {
    path: 'src/data/user_contacts_clean.csv',
    emailField: 'email',
    nameField: null, // Split into firstName, lastName
    firstNameField: 'firstName',
    lastNameField: 'lastName',
    hasProducts: false
  }
];

const allEmails = new Map();

for (const csvConfig of csvFiles) {
  const content = readFileSync(join(process.cwd(), csvConfig.path), 'utf-8');
  const records = parseCSV(content);
  
  for (const record of records) {
    const email = record[csvConfig.emailField]?.toLowerCase().trim();
    if (email && email.includes('@')) {
      if (!allEmails.has(email)) {
        allEmails.set(email, []);
      }
      allEmails.get(email).push(csvConfig.path);
    }
  }
}

// Check duplicates
const duplicates = [];
for (const [email, files] of allEmails) {
  if (files.length > 1) {
    duplicates.push({ email, files });
  }
}

console.log(`Total unique emails: ${allEmails.size}`);
console.log(`Duplicates found: ${duplicates.length}`);
if (duplicates.length > 0) {
  console.log('Duplicate emails:');
  duplicates.forEach(d => console.log(`${d.email}: ${d.files.join(', ')}`));
}