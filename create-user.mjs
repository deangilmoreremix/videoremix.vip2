import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Read .env file
const envFile = readFileSync('.env', 'utf-8');
const envVars = {};
envFile.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    envVars[key.trim()] = valueParts.join('=').trim();
  }
});

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables!');
  console.error('Need: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createUser() {
  console.log('Ensuring user exists as regular user...\n');

  const email = 'deanvideoremix.io@gmail.com';
  const password = 'VideoRemix2025';

  try {
    // Check if user already exists (with pagination)
    let existingUser = null;
    let page = 1;
    const perPage = 1000; // Large number to get all

    while (!existingUser) {
      const { data: usersData, error: listError } = await supabase.auth.admin.listUsers({
        page: page,
        perPage: perPage
      });

      if (listError) {
        console.error('Error listing users:', listError.message);
        process.exit(1);
      }

      if (!usersData?.users || usersData.users.length === 0) {
        break; // No more users
      }

      existingUser = usersData.users.find(u => u.email === email);
      page++;
    }

    let userId;

    if (existingUser) {
      console.log('✓ User already exists!');
      console.log(`  Email: ${email}`);
      console.log(`  User ID: ${existingUser.id}`);

      // Update password to ensure it's correct
      console.log('Updating password...');
      const { error: updateError } = await supabase.auth.admin.updateUserById(existingUser.id, {
        password: password
      });

      if (updateError) {
        console.error('Error updating password:', updateError.message);
        process.exit(1);
      }

      console.log('✓ Password updated');
      userId = existingUser.id;
    } else {
      // Try to create new user
      console.log('Creating new user...');
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true,
        user_metadata: {
          first_name: 'Dean',
          last_name: 'VideoRemix'
        }
      });

      if (createError) {
        if (createError.message.includes('already been registered')) {
          console.log('User already exists, fetching user details...');
          // Re-fetch users to get the existing user
          const { data: refetchedUsers } = await supabase.auth.admin.listUsers();
          const existingUserAgain = refetchedUsers?.users.find(u => u.email === email);
          if (existingUserAgain) {
            userId = existingUserAgain.id;
            console.log('✓ Found existing user');
            console.log(`  User ID: ${userId}`);
          } else {
            console.error('Could not find existing user');
            process.exit(1);
          }
        } else {
          console.error('Error creating user:', createError.message);
          process.exit(1);
        }
      } else {
        console.log('✓ User created successfully');
        console.log(`  User ID: ${newUser.user.id}`);
        userId = newUser.user.id;
      }
    }

    // Ensure user is a regular user (no admin roles)
    console.log('\nChecking user role...');

    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle();

    if (roleData) {
      console.log(`Current role: ${roleData.role}`);

      if (roleData.role === 'super_admin' || roleData.role === 'admin') {
        console.log('Removing admin role to make user regular...');
        await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId);
        console.log('✓ Admin role removed - user is now regular');
      } else {
        console.log('✓ User has regular role');
      }
    } else {
      console.log('✓ No role assigned - user is regular');
    }

    console.log('\n=== Success! ===');
    console.log('User is set up as regular user!\n');
    console.log('=== Login Credentials ===');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log('\nYou can now sign in at: http://localhost:5173/signin');

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

createUser();