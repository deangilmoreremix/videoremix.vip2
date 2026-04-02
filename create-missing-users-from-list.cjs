const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Function to fetch all users with pagination
async function fetchAllUsers() {
  let allUsers = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page: page,
      perPage: 50 // Adjust as needed
    });
    if (error) {
      console.error('Error fetching users:', error.message);
      break;
    }
    const users = data.users || [];
    allUsers = allUsers.concat(users);
    console.log(`Fetched page ${page}, got ${users.length} users, total so far: ${allUsers.length}`);
    hasMore = data.nextPage !== null && data.nextPage !== undefined;
    page++;
  }

  return allUsers;
}

// Function to create a user
async function createUser(email, password) {
  const { data, error } = await supabase.auth.admin.createUser({
    email: email,
    password: password,
    email_confirm: true // Automatically confirm the email
  });

  if (error) {
    console.error(`Error creating user ${email}:`, error.message);
    return { success: false, error: error.message };
  }

  console.log(`Created user: ${email}`);
  return { success: true, user: data.user };
}

// Main function
async function main() {
  // Read emails from file or use default list
  const args = process.argv.slice(2);
  let emailsToProcess = [];

  if (args.length > 0) {
    // Assume first argument is a file path
    const fs = require('fs');
    const filePath = args[0];
    try {
      const data = fs.readFileSync(filePath, 'utf8');
      // Split by newline and filter out empty lines and comments
      emailsToProcess = data.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0 && !line.startsWith('#'));
      console.log(`Read ${emailsToProcess.length} emails from ${filePath}`);
    } catch (err) {
      console.error(`Error reading file ${filePath}:`, err.message);
      process.exit(1);
    }
  } else {
    // Default list - user can modify this array
    emailsToProcess = [
      'example1@domain.com',
      'example2@domain.com',
      // Add more emails as needed
    ];
    console.log(`Using default list of ${emailsToProcess.length} emails`);
  }

  // Normalize emails (trim and lowercase)
  const normalizedEmails = emailsToProcess.map(email => email.trim().toLowerCase());

  // Fetch all existing users
  console.log('Fetching existing users...');
  const existingUsers = await fetchAllUsers();
  const existingEmailsSet = new Set(
    existingUsers
      .map(user => user.email?.toLowerCase().trim())
      .filter(email => email) // Remove null/undefined
  );

  console.log(`Found ${existingEmailsSet.size} existing unique emails`);

  // Process each email
  const results = {
    created: [],
    skipped: [],
    errors: []
  };

  for (const email of normalizedEmails) {
    if (existingEmailsSet.has(email)) {
      console.log(`Skipping ${email} - already exists`);
      results.skipped.push(email);
    } else {
      // Generate a random password
      const randomPassword = Math.random().toString(36).slice(-12) + 'Aa1!';
      const result = await createUser(email, randomPassword);
      if (result.success) {
        results.created.push({ email, password: randomPassword });
      } else {
        results.errors.push({ email, error: result.error });
      }
    }
  }

  // Print summary
  console.log('\n=== Summary ===');
  console.log(`✅ Created: ${results.created.length}`);
  console.log(`👤 Skipped (already existed): ${results.skipped.length}`);
  console.log(`❌ Errors: ${results.errors.length}`);

  if (results.created.length > 0) {
    console.log('\nCreated users (save these passwords securely):');
    results.created.forEach(({ email, password }) => {
      console.log(`${email}: ${password}`);
    });
  }

  if (results.errors.length > 0) {
    console.log('\nErrors:');
    results.errors.forEach(({ email, error }) => {
      console.log(`${email}: ${error}`);
    });
  }
}

// Run the script
main().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});