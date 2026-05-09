import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const env = readFileSync(path.join(__dirname, '.env'), 'utf-8');
const envVars = {};
env.split('\n').forEach(line => {
  const [key, ...value] = line.split('=');
  if (key && value.length) envVars[key.trim()] = value.join('=').trim();
});

const supabase = createClient(envVars.VITE_SUPABASE_URL, envVars.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function debugMissingUsers() {
  console.log('🔍 Debugging why users are still missing...\n');

  // Get all auth users
  const { data: authUsers } = await supabase.auth.admin.listUsers({ page: 1, perPage: 2000 });
  const authEmails = new Set(authUsers.users.map(u => u.email.toLowerCase().trim()));

  // Parse CSV and check first 20 missing users
  const content = readFileSync(path.join(__dirname, 'all_users_for_import.csv'), 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());

  const csvEmails = new Set();
  const missingUsers = [];

  for (let i = 1; i < lines.length && missingUsers.length < 20; i++) {
    const line = lines[i];
    const parts = line.split(',');
    if (parts.length >= 2) {
      const email = parts[1]?.replace(/"/g, '').toLowerCase().trim();
      if (email && email.includes('@')) {
        csvEmails.add(email);
        if (!authEmails.has(email)) {
          missingUsers.push({
            email: email,
            name: parts[0]?.replace(/"/g, '').trim(),
            line: i + 1,
            rawLine: line.substring(0, 100) + '...'
          });
        }
      }
    }
  }

  console.log('Found', missingUsers.length, 'missing users to investigate');
  console.log('');

  // Try to create just the first 3 missing users manually to see what happens
  for (let i = 0; i < Math.min(3, missingUsers.length); i++) {
    const user = missingUsers[i];
    console.log(`Testing creation of: ${user.email}`);
    console.log(`  Name: ${user.name}`);
    console.log(`  Line: ${user.line}`);
    console.log(`  Raw: ${user.rawLine}`);

    try {
      const password = 'VideoRemix2026';

      const { data: newUser, error } = await supabase.auth.admin.createUser({
        email: user.email,
        password: password,
        email_confirm: true,
        user_metadata: {
          full_name: user.name,
          debug_test: true,
          import_date: new Date().toISOString()
        }
      });

      if (error) {
        console.log(`  ❌ FAILED: ${error.message}`);
        if (error.message.includes('already')) {
          console.log(`  ℹ️  User already exists!`);
        }
      } else {
        console.log(`  ✅ SUCCESS: Created user ${newUser.user.id}`);

        // Create profile
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: newUser.user.id,
            user_id: newUser.user.id,
            email: user.email,
            full_name: user.name,
            tenant_id: '00000000-0000-0000-0000-000000000001',
            updated_at: new Date().toISOString()
          });

        if (profileError) {
          console.log(`  ⚠️  Profile creation failed: ${profileError.message}`);
        } else {
          console.log(`  ✅ Profile created`);
        }
      }
    } catch (error) {
      console.log(`  ❌ EXCEPTION: ${error.message}`);
    }
    console.log('');
  }

  console.log('Summary:');
  console.log('- CSV unique emails:', csvEmails.size);
  console.log('- Auth emails:', authEmails.size);
  console.log('- Missing from CSV:', csvEmails.size - authEmails.size);
}

debugMissingUsers().catch(console.error);