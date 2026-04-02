const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Function to get emails from CSV
function getCsvEmails(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    return new Set();
  }

  const fileContent = fs.readFileSync(filePath, 'utf8');
  const lines = fileContent.split('\n').filter(line => line.trim() !== '');

  if (lines.length === 0) {
    return new Set();
  }

  // Parse headers
  const headerLine = lines[0];
  const headers = headerLine.split(',').map(h => h.trim());
  const emailIndex = headers.findIndex(h => h.toLowerCase() === 'email');

  if (emailIndex === -1) {
    console.error('Could not find email column in CSV. Headers:', headers);
    return new Set();
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

  return emails;
}

// Function to get emails from Supabase auth
async function getSupabaseEmails() {
  let allEmails = new Set();
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page: page,
      perPage: 50
    });
    if (error) {
      console.error('Error fetching users:', error.message);
      break;
    }
    const users = data.users || [];
    users.forEach(user => {
      if (user.email) {
        allEmails.add(user.email.toLowerCase());
      }
    });
    hasMore = data.nextPage !== null && data.nextPage !== undefined;
    page++;
  }

  return allEmails;
}

// Main function
async function main() {
  const csvFilePath = process.argv[2] || '/workspaces/videoremix.vip2/users_to_import.csv';

  console.log('Reading emails from CSV...');
  const csvEmails = getCsvEmails(csvFilePath);
  console.log(`Found ${csvEmails.size} unique email addresses in CSV`);

  console.log('Fetching emails from Supabase auth...');
  const supabaseEmails = await getSupabaseEmails();
  console.log(`Found ${supabaseEmails.size} unique email addresses in Supabase auth`);

  // Find emails in CSV but not in Supabase
  const missingInSupabase = new Set(
    [...csvEmails].filter(email => !supabaseEmails.has(email))
  );

  // Find emails in Supabase but not in CSV
  const missingInCsv = new Set(
    [...supabaseEmails].filter(email => !csvEmails.has(email))
  );

  console.log('\n=== Comparison Results ===');
  console.log(`Emails in CSV but not in Supabase: ${missingInSupabase.size}`);
  if (missingInSupabase.size > 0) {
    console.log('Missing emails:');
    [...missingInSupabase].sort().forEach(email => {
      console.log(`  ${email}`);
    });
  }

  console.log(`\nEmails in Supabase but not in CSV: ${missingInCsv.size}`);
  if (missingInCsv.size > 0) {
    console.log('Extra emails in Supabase:');
    [...missingInCsv].sort().forEach(email => {
      console.log(`  ${email}`);
    });
  }

  if (missingInSupabase.size === 0) {
    console.log('\n✅ All CSV emails are present in Supabase auth!');
  } else {
    console.log(`\n❌ ${missingInSupabase.size} emails from CSV are missing in Supabase auth.`);
  }
}

main().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});