const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Function to get emails and names from CSV
function getCsvUsers(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    return [];
  }

  const fileContent = fs.readFileSync(filePath, 'utf8');
  const lines = fileContent.split('\n').filter(line => line.trim() !== '');

  if (lines.length === 0) {
    return [];
  }

  // Parse headers
  const headerLine = lines[0];
  const headers = headerLine.split(',').map(h => h.trim());
  const emailIndex = headers.findIndex(h => h.toLowerCase() === 'email');
  const firstNameIndex = headers.findIndex(h => h.toLowerCase() === 'first_name');
  const lastNameIndex = headers.findIndex(h => h.toLowerCase() === 'last_name');

  if (emailIndex === -1) {
    console.error('Could not find email column in CSV. Headers:', headers);
    return [];
  }

  // Extract users from data rows
  const users = [];

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
    const firstName = values[firstNameIndex] || '';
    const lastName = values[lastNameIndex] || '';
    const fullName = `${firstName} ${lastName}`.trim();

    if (email) {
      users.push({
        email: email.toLowerCase(),
        first_name: firstName,
        last_name: lastName,
        full_name: fullName
      });
    }
  }

  return users;
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

  console.log('Reading users from CSV...');
  const csvUsers = getCsvUsers(csvFilePath);
  console.log(`Found ${csvUsers.length} users in CSV`);

  console.log('Fetching emails from Supabase auth...');
  const supabaseEmails = await getSupabaseEmails();
  console.log(`Found ${supabaseEmails.size} unique email addresses in Supabase auth`);

  // Filter CSV users to those not in Supabase
  const missingUsers = csvUsers.filter(user => !supabaseEmails.has(user.email));
  console.log(`Found ${missingUsers.length} users in CSV that are missing in Supabase`);

  if (missingUsers.length === 0) {
    console.log('✅ All CSV users are already in Supabase auth!');
    return;
  }

  console.log('\nCreating missing users...');
  let createdCount = 0;
  let errorCount = 0;

  for (const user of missingUsers) {
    try {
      const randomPassword = Math.random().toString(36).slice(-12) + 'Aa1!';
      const { data, error } = await supabase.auth.admin.createUser({
        email: user.email,
        password: randomPassword,
        email_confirm: true,
        user_metadata: {
          full_name: user.full_name,
          first_name: user.first_name,
          last_name: user.last_name
        }
      });

      if (error) {
        console.error(`❌ Failed to create ${user.email}:`, error.message);
        errorCount++;
      } else {
        console.log(`🎉 Created user: ${user.email} (ID: ${data.user.id})`);
        createdCount++;
      }
    } catch (err) {
      console.error(`❌ Exception creating ${user.email}:`, err.message);
      errorCount++;
    }
  }

  console.log('\n=== Summary ===');
  console.log(`✅ Created: ${createdCount}`);
  console.log(`❌ Errors: ${errorCount}`);

  if (createdCount > 0) {
    console.log('\nNext steps:');
    console.log('  1. Run the purchase processing script to grant app access based on purchases');
    console.log('  2. Verify the results');
  }
}

main().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});