import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

console.log('Backfilling profiles for existing users...\n');

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

async function backfillProfiles() {
  try {
    // Get all auth users
    console.log('Fetching all auth users...');
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers({
      perPage: 1000
    });

    if (usersError) {
      console.error('Error fetching users:', usersError.message);
      process.exit(1);
    }

    console.log(`Found ${users.users.length} auth users`);

    // Get existing profiles
    const { data: existingProfiles, error: profilesError } = await supabase
      .from('profiles')
      .select('user_id');

    if (profilesError) {
      console.error('Error fetching existing profiles:', profilesError.message);
      process.exit(1);
    }

    const existingProfileIds = new Set(existingProfiles.map(p => p.user_id));
    console.log(`Found ${existingProfileIds.size} existing profiles`);

    // Filter users who don't have profiles
    const usersNeedingProfiles = users.users.filter(user => !existingProfileIds.has(user.id));
    console.log(`Need to create profiles for ${usersNeedingProfiles.length} users`);

    let created = 0;
    let skipped = 0;

    for (const user of usersNeedingProfiles) {
      try {
        // Extract name from metadata
        const firstName = user.user_metadata?.first_name || '';
        const lastName = user.user_metadata?.last_name || '';
        const fullName = user.user_metadata?.full_name ||
                        (firstName || lastName ? `${firstName} ${lastName}`.trim() : '');

        console.log(`Creating profile for ${user.email} (ID: ${user.id})`);

        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            user_id: user.id,
            email: user.email,
            full_name: fullName,
            tenant_id: '00000000-0000-0000-0000-000000000001'
          });

        if (insertError) {
          if (insertError.code === '23505') { // Unique violation
            console.log(`  Profile already exists for ${user.email}, skipping`);
            skipped++;
          } else {
            console.error(`  Error creating profile for ${user.email}:`, insertError.message);
          }
        } else {
          created++;
          console.log(`  ✓ Created profile for ${user.email}`);
        }
      } catch (err) {
        console.error(`  Unexpected error for ${user.email}:`, err.message);
      }
    }

    console.log('\n=== Backfill Complete ===');
    console.log(`Created: ${created}`);
    console.log(`Skipped: ${skipped}`);
    console.log(`Total profiles: ${existingProfileIds.size + created}`);

  } catch (err) {
    console.error('Unexpected error:', err);
    process.exit(1);
  }
}

backfillProfiles();