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

async function cleanDuplicateProfiles() {
  console.log('🔍 Analyzing duplicate profiles...\n');

  // Get all profiles
  const { data: allProfiles, error } = await supabase
    .from('profiles')
    .select('id, user_id, email, created_at, updated_at')
    .order('updated_at', { ascending: false }); // Most recent first overall

  if (error) {
    console.error('❌ Error fetching profiles:', error.message);
    return;
  }

  console.log(`Found ${allProfiles.length} total profiles`);

  // Group by user_id
  const profilesByUserId = {};
  allProfiles.forEach(profile => {
    if (!profilesByUserId[profile.user_id]) {
      profilesByUserId[profile.user_id] = [];
    }
    profilesByUserId[profile.user_id].push(profile);
  });

  // Find duplicates (more than 1 profile per user_id)
  const duplicates = Object.entries(profilesByUserId)
    .filter(([userId, profiles]) => profiles.length > 1);

  console.log(`Found ${duplicates.length} user_ids with duplicate profiles\n`);

  if (duplicates.length === 0) {
    console.log('✅ No duplicate profiles found!');
    return;
  }

  // For each duplicate group, keep the most recent profile, delete others
  let totalToDelete = 0;
  const profilesToDelete = [];

  for (const [userId, profiles] of duplicates) {
    console.log(`User ${userId} (${profiles[0].email}): ${profiles.length} profiles`);
    console.log(`  Keeping: ${profiles[0].id} (created: ${profiles[0].created_at})`);

    // Delete older profiles
    for (let i = 1; i < profiles.length; i++) {
      console.log(`  Deleting: ${profiles[i].id} (created: ${profiles[i].created_at})`);
      profilesToDelete.push(profiles[i].id);
      totalToDelete++;
    }
    console.log('');
  }

  if (profilesToDelete.length === 0) {
    console.log('No profiles to delete');
    return;
  }

  console.log(`\n🗑️  Will delete ${totalToDelete} duplicate profiles`);
  console.log('This will reduce profiles from', allProfiles.length, 'to', allProfiles.length - totalToDelete);

  // Ask for confirmation (in a real scenario, we'd use a CLI prompt)
  console.log('\n⚠️  WARNING: This operation cannot be undone!');
  console.log('Duplicate profile IDs to delete:', profilesToDelete.slice(0, 5), profilesToDelete.length > 5 ? `... and ${profilesToDelete.length - 5} more` : '');

  // Actually perform the deletion
  if (profilesToDelete.length > 0) {
    console.log('\n🗑️  Deleting duplicate profiles...');

    const { error: deleteError } = await supabase
      .from('profiles')
      .delete()
      .in('id', profilesToDelete);

    if (deleteError) {
      console.error('❌ Error deleting duplicates:', deleteError.message);
    } else {
      console.log(`✅ Successfully deleted ${totalToDelete} duplicate profiles`);
    }
  }

  console.log('\n📊 After cleanup expected:');
  console.log(`- Profiles: ${allProfiles.length - totalToDelete}`);
  console.log(`- Should match auth users: 575`);
}

cleanDuplicateProfiles().catch(console.error);