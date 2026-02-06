// Step 2: Check if user_roles entry was created
console.log('Step 2: Checking user_roles entry...');

// Wait a moment for trigger to execute
await new Promise(resolve => setTimeout(resolve, 1000));

const { data: roleData, error: roleError } = await adminClient
  .from('user_roles')
  .select('*')
  .eq('user_id', userId)
  .single();

if (roleError) {
  console.error('❌ Failed to fetch user role:', roleError.message);
  console.log('   This is the main issue - user_roles not created!');
} else if (roleData) {
  console.log('✅ User role found!');
  console.log(`   Role: ${roleData.role}`);
  console.log(`   Created at: ${roleData.created_at}`);
} else {
  console.error('❌ No user role found!');
}

// Confirm email manually if needed
const { data: userData, error: userError } = await adminClient
  .from('auth.users')
  .select('*')
  .eq('email', testEmail)
  .single();

if (userData) {
  console.log('\nStep 2.5: Checking email confirmation...');
  
  if (!userData.email_confirmed_at) {
    console.log('⚠️  Email not confirmed, confirming manually...');
    
    // Use admin client to confirm email
    const { error: confirmError } = await adminClient.auth.admin.updateUserById(userData.id, {
      email_confirmed: true
    });

    if (confirmError) {
      console.error('❌ Failed to confirm email:', confirmError.message);
    } else {
      console.log('✅ Email confirmed manually');
    }
  } else {
    console.log('✅ Email already confirmed');
  }
}

console.log('\nStep 3: Testing Login...');