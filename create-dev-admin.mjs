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

async function createDevAdmin() {
  console.log('Creating dev admin user...\n');

  const email = 'dev@videoremix.vip';
  const password = 'DevPassword123!';

  try {
    // Check if user already exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users.find(u => u.email === email);

    if (existingUser) {
      console.log('✓ Dev admin user already exists!');
      console.log(`  Email: ${email}`);
      console.log(`  User ID: ${existingUser.id}\n`);

      // Check role
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', existingUser.id)
        .maybeSingle();

      if (roleData) {
        console.log(`✓ Current role: ${roleData.role}`);

        if (roleData.role !== 'super_admin') {
          console.log('\nUpdating role to super_admin...');
          await supabase
            .from('user_roles')
            .update({ role: 'super_admin' })
            .eq('user_id', existingUser.id);
          console.log('✓ Role updated to super_admin');
        }
      } else {
        console.log('\nCreating super_admin role...');
        await supabase
          .from('user_roles')
          .insert({ user_id: existingUser.id, role: 'super_admin' });
        console.log('✓ Role created');
      }

      console.log('\n=== Dev Admin Credentials ===');
      console.log(`Email: ${email}`);
      console.log(`Password: ${password}`);
      console.log('\nYou can now use the "Dev Login" button at /admin/login');
      return;
    }

    // Create new user
    console.log('Creating new admin user...');
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: {
        first_name: 'Dev',
        last_name: 'Admin'
      }
    });

    if (createError) {
      console.error('Error creating user:', createError.message);
      process.exit(1);
    }

    console.log('✓ User created successfully');
    console.log(`  User ID: ${newUser.user.id}`);

    // The user_roles entry should be created automatically by the trigger
    // But let's verify and create if needed
    console.log('\nChecking user role...');

    // Wait a moment for trigger to execute
    await new Promise(resolve => setTimeout(resolve, 1000));

    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', newUser.user.id)
      .maybeSingle();

    if (roleData) {
      console.log(`✓ Role exists: ${roleData.role}`);

      if (roleData.role !== 'super_admin') {
        console.log('Updating to super_admin...');
        await supabase
          .from('user_roles')
          .update({ role: 'super_admin' })
          .eq('user_id', newUser.user.id);
        console.log('✓ Role updated to super_admin');
      }
    } else {
      console.log('Creating super_admin role...');
      await supabase
        .from('user_roles')
        .insert({ user_id: newUser.user.id, role: 'super_admin' });
      console.log('✓ Role created');
    }

    console.log('\n=== Success! ===');
    console.log('Dev admin user created successfully!\n');
    console.log('=== Login Credentials ===');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log('\nGo to: http://localhost:5173/admin/login');
    console.log('Click the "Dev Login" button or enter credentials manually');

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

createDevAdmin();
