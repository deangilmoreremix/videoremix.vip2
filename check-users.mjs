import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const envContent = readFileSync('.env', 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length) {
    envVars[key.trim()] = valueParts.join('=').trim();
  }
});

const supabase = createClient(
  envVars.VITE_SUPABASE_URL,
  envVars.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const { data, error } = await supabase.auth.admin.listUsers();
if (error) {
  console.error('Error:', error);
} else {
  console.log(`\n✅ Total users in Supabase: ${data.users.length}\n`);
  console.log('Sample users:');
  data.users.slice(0, 10).forEach(u => {
    console.log(`   - ${u.email} (ID: ${u.id.substring(0, 8)}...)`);
  });
}
