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

async function createMissingProfilesOnly() {
  console.log('📝 Creating missing profiles for existing auth users...\n');

  // Get all auth users
  const allAuthUsers = [];
  let page = 1;
  const perPage = 1000;

  while (true) {
    const { data: { users }, error } = await supabase.auth.admin.listUsers({
      page: page,
      perPage: perPage
    });

    if (error) {
      console.error('Error loading auth users:', error.message);
      return;
    }

    if (!users || users.length === 0) break;
    allAuthUsers.push(...users);

    if (users.length < perPage) break;
    page++;
  }

  console.log(`Found ${allAuthUsers.length} auth users`);

  let profilesCreated = 0;
  let profilesSkipped = 0;

  for (const authUser of allAuthUsers) {
    // Check if profile exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', authUser.id)
      .single();

    if (existingProfile) {
      profilesSkipped++;
      continue;
    }

    // Create profile
    const { error } = await supabase
      .from('profiles')
      .insert({
        id: authUser.id,
        user_id: authUser.id,
        email: authUser.email,
        full_name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || 'Unknown',
        tenant_id: '00000000-0000-0000-0000-000000000001',
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error(`❌ Failed to create profile for ${authUser.email}:`, error.message);
    } else {
      console.log(`✅ Created profile: ${authUser.email}`);
      profilesCreated++;
    }
  }

  console.log(`\n✅ Profile creation complete:`);
  console.log(`- Created: ${profilesCreated}`);
  console.log(`- Already existed: ${profilesSkipped}`);
  console.log(`- Total auth users: ${allAuthUsers.length}`);
  console.log(`- Final profiles should be: ${allAuthUsers.length}`);
}

createMissingProfilesOnly().catch(console.error);