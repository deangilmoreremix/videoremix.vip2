const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkUsers() {
  const { data: { users }, error } = await supabase.auth.admin.listUsers();
  if (error) {
    console.error('Error:', error.message);
    return;
  }
  
  console.log('Total users:', users.length);
  
  // Let's see some sample user emails to understand the format
  console.log('\nFirst 5 user emails:');
  users.slice(0, 5).forEach(u => {
    console.log('  -', u.email);
  });
  
  console.log('\nLast 5 user emails:');
  users.slice(-5).forEach(u => {
    console.log('  -', u.email);
  });
  
  // Now check for our specific targets with various matching strategies
  const targets = [
    'larrylawrence1@gmail.com',
    'trcole3@theritegroup.com', 
    'ejo1ed@gmail.com'
  ];
  
  console.log('\n=== Checking for target users ===');
  for (const targetEmail of targets) {
    // Exact match
    const exactMatch = users.find(u => u.email === targetEmail);
    // Case insensitive match
    const caseInsensitiveMatch = users.find(u => u.email.toLowerCase() === targetEmail.toLowerCase());
    // Trimmed match
    const trimmedMatch = users.find(u => u.email.trim() === targetEmail);
    // Trimmed + case insensitive
    const trimmedCiMatch = users.find(u => u.email.trim().toLowerCase() === targetEmail.trim().toLowerCase());
    
    console.log('\nTarget: ' + targetEmail);
    console.log('  Exact match: ' + (exactMatch ? 'YES' : 'NO'));
    console.log('  Case insensitive: ' + (caseInsensitiveMatch ? 'YES' : 'NO'));
    console.log('  Trimmed: ' + (trimmedMatch ? 'YES' : 'NO'));
    console.log('  Trimmed + CI: ' + (trimmedCiMatch ? 'YES' : 'NO'));
    
    if (exactMatch) {
      console.log('    ID: ' + exactMatch.id);
      console.log('    Created: ' + exactMatch.created_at);
      console.log('    Email in DB: [' + exactMatch.email + ']');
    }
  }
}

checkUsers().catch(console.error);