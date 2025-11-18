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
const supabaseAnonKey = envVars.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing environment variables!');
  console.error('Need: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

async function createDevAdmin() {
  console.log('Creating dev admin user...\n');

  const email = 'dev@videoremix.vip';
  const password = 'DevPassword123!';
  const fullName = 'Dev Admin';

  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/create-super-admin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify({
        email,
        password,
        fullName
      })
    });

    const result = await response.json();

    if (response.ok && result.success) {
      console.log('✓ Dev admin user created successfully!\n');
      console.log('=== Login Credentials ===');
      console.log(`Email: ${email}`);
      console.log(`Password: ${password}`);
      console.log(`User ID: ${result.userId}`);
      console.log('\nGo to your application and use the "Dev Login" button');
      console.log('or enter the credentials manually at /admin/login');
    } else {
      console.error('Error:', result.error || 'Unknown error');
      if (result.error && result.error.includes('already exists')) {
        console.log('\n=== User already exists ===');
        console.log(`Email: ${email}`);
        console.log(`Password: ${password}`);
        console.log('\nTry logging in with these credentials');
      }
    }
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

createDevAdmin();
