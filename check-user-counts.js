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

async function checkUserCounts() {
  // Get auth users count
  const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 2000 });
  const authCount = authUsers?.users?.length || 0;

  // Get profiles count
  const { count: profilesCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });

  // Get users with profiles
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('user_id, email')
    .limit(5);

  console.log('Auth users:', authCount);
  console.log('Profiles:', profilesCount);
  console.log('Difference:', profilesCount - authCount);

  if (profilesError) {
    console.log('Error fetching profiles:', profilesError.message);
  } else {
    console.log('Sample profiles:');
    profiles.forEach(p => console.log(`  ${p.email} -> ${p.user_id}`));
  }

  // Check for orphaned profiles
  const { data: orphaned, error: orphanError } = await supabase
    .from('profiles')
    .select('email')
    .limit(3);

  if (!orphanError && orphaned) {
    console.log('Profiles exist, checking auth linkage...');
  }
}

checkUserCounts().catch(console.error);