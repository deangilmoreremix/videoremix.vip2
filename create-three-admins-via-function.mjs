import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

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

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const adminAccounts = [
  {
    email: 'dean@videoremix.vip',
    password: 'VideoRemix2025!Dean',
    fullName: 'Dean'
  },
  {
    email: 'victor@videoremix.vip',
    password: 'VideoRemix2025!Victor',
    fullName: 'Victor'
  },
  {
    email: 'samuel@videoremix.vip',
    password: 'VideoRemix2025!Samuel',
    fullName: 'Samuel'
  }
];

async function createAdminViaFunction(email, password, fullName) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🔍 Creating: ${email}`);
  console.log(`${'='.repeat(60)}`);

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

    const data = await response.json();

    if (response.ok && data.success) {
      console.log('✅ Admin account created successfully!');
      console.log(`   User ID: ${data.userId}`);
      return {
        success: true,
        email,
        password,
        userId: data.userId,
        fullName,
        role: 'super_admin'
      };
    } else {
      console.log('❌ Failed to create admin account');
      console.log(`   Error: ${data.error || 'Unknown error'}`);
      return {
        success: false,
        email,
        error: data.error || 'Unknown error'
      };
    }
  } catch (error) {
    console.log('❌ Network or connection error');
    console.log(`   Error: ${error.message}`);
    return {
      success: false,
      email,
      error: error.message
    };
  }
}

async function createAllAdmins() {
  console.log('\n🚀 Starting Admin Account Creation Process');
  console.log('━'.repeat(60));
  console.log('Using create-super-admin edge function...\n');

  const results = [];

  for (const account of adminAccounts) {
    const result = await createAdminViaFunction(
      account.email,
      account.password,
      account.fullName
    );
    results.push(result);
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n\n' + '='.repeat(60));
  console.log('📊 SUMMARY REPORT');
  console.log('='.repeat(60));

  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  console.log(`\n✅ Successfully created: ${successful.length}/${results.length}`);
  console.log(`❌ Failed: ${failed.length}/${results.length}`);

  if (successful.length > 0) {
    console.log('\n' + '─'.repeat(60));
    console.log('✅ SUCCESSFUL ADMIN ACCOUNTS');
    console.log('─'.repeat(60));

    successful.forEach((result, index) => {
      console.log(`\n${index + 1}. ${result.fullName}`);
      console.log(`   📧 Email: ${result.email}`);
      console.log(`   🔑 Password: ${result.password}`);
      console.log(`   👤 Role: ${result.role}`);
      console.log(`   🆔 User ID: ${result.userId}`);
    });
  }

  if (failed.length > 0) {
    console.log('\n' + '─'.repeat(60));
    console.log('❌ FAILED ACCOUNTS');
    console.log('─'.repeat(60));

    failed.forEach((result, index) => {
      console.log(`\n${index + 1}. ${result.email}`);
      console.log(`   Error: ${result.error}`);
    });
  }

  console.log('\n' + '='.repeat(60));
  console.log('🔐 LOGIN INFORMATION');
  console.log('='.repeat(60));
  console.log('Login URL: /admin/login');
  console.log('All accounts have super_admin privileges');
  console.log('='.repeat(60));

  console.log('\n✅ Admin account creation process completed!\n');
}

createAllAdmins().catch(console.error);
