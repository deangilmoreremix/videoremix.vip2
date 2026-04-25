import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing service key!');
  process.exit(1);
}

const adminClient = createClient(supabaseUrl, supabaseServiceKey);

async function assignMissingRoles() {
  console.log('🛠️  Assigning missing user roles...\n');

  try {
    // Find profiles that don't have user_roles
    const { data: profiles, error: profilesError } = await adminClient
      .from('profiles')
      .select('user_id, email');

    if (profilesError) {
      console.error('❌ Error fetching profiles:', profilesError);
      return;
    }

    console.log(`Found ${profiles.length} profiles`);

    // Get existing roles
    const { data: existingRoles, error: rolesError } = await adminClient
      .from('user_roles')
      .select('user_id');

    if (rolesError) {
      console.error('❌ Error fetching roles:', rolesError);
      return;
    }

    const usersWithRoles = new Set(existingRoles.map(r => r.user_id));
    const profilesNeedingRoles = profiles.filter(p => !usersWithRoles.has(p.user_id));

    console.log(`${profilesNeedingRoles.length} profiles need roles assigned`);

    if (profilesNeedingRoles.length > 0) {
      const roleInserts = profilesNeedingRoles.map(profile => ({
        user_id: profile.user_id,
        role: 'user',
        tenant_id: '00000000-0000-0000-0000-000000000001'
      }));

      const { error: insertError } = await adminClient
        .from('user_roles')
        .upsert(roleInserts, { onConflict: 'user_id' });

      if (insertError) {
        console.error('❌ Error inserting user roles:', insertError);
      } else {
        console.log(`✅ Assigned 'user' role to ${profilesNeedingRoles.length} users`);
      }
    } else {
      console.log('✅ All profiles already have roles');
    }

    // Verify the results
    const { data: finalRoles, error: finalError } = await adminClient
      .from('user_roles')
      .select('user_id, role')
      .limit(10);

    if (!finalError) {
      console.log('\nSample user roles:');
      finalRoles.forEach(role => {
        console.log(`  ${role.user_id}: ${role.role}`);
      });
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

assignMissingRoles();