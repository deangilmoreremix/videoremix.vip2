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

async function checkAllUsersAndRoles() {
  console.log('🔍 Checking all users and roles in database...\n');

  try {
    // Get total count of profiles (users who have signed up)
    const { count: profileCount, error: profileCountError } = await adminClient
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    if (profileCountError) {
      console.error('❌ Error counting profiles:', profileCountError);
    } else {
      console.log(`📊 Total profiles: ${profileCount}`);
    }

    // Get total count of user_roles
    const { count: roleCount, error: roleCountError } = await adminClient
      .from('user_roles')
      .select('*', { count: 'exact', head: true });

    if (roleCountError) {
      console.error('❌ Error counting roles:', roleCountError);
    } else {
      console.log(`📊 Total user roles: ${roleCount}`);
    }

    // Check role distribution
    const { data: roleStats, error: roleStatsError } = await adminClient
      .from('user_roles')
      .select('role')
      .then(async ({ data, error }) => {
        if (error) return { data: null, error };
        const stats = data.reduce((acc, curr) => {
          acc[curr.role] = (acc[curr.role] || 0) + 1;
          return acc;
        }, {});
        return { data: stats, error: null };
      });

    if (roleStatsError) {
      console.error('❌ Error getting role stats:', roleStatsError);
    } else {
      console.log('\n📈 Role distribution:');
      Object.entries(roleStats).forEach(([role, count]) => {
        console.log(`   ${role}: ${count} users`);
      });
    }

    // Find users without roles (profiles without user_roles)
    console.log('\n🔍 Finding users without roles...');

    // Get all profile user_ids
    const { data: allProfiles, error: profilesError } = await adminClient
      .from('profiles')
      .select('user_id');

    if (profilesError) {
      console.error('❌ Error fetching profiles:', profilesError);
      return;
    }

    // Get all user_ids with roles
    const { data: allRoles, error: rolesError } = await adminClient
      .from('user_roles')
      .select('user_id');

    if (rolesError) {
      console.error('❌ Error fetching roles:', rolesError);
      return;
    }

    const usersWithRoles = new Set(allRoles.map(r => r.user_id));
    const usersWithoutRoles = allProfiles.filter(p => !usersWithRoles.has(p.user_id));

    console.log(`\n⚠️  Users without roles: ${usersWithoutRoles.length}`);

    if (usersWithoutRoles.length > 0) {
      console.log('Sample users without roles:');
      usersWithoutRoles.slice(0, 5).forEach(user => {
        console.log(`   ${user.user_id}`);
      });

      console.log('\n🛠️  Assigning roles to users without them...');

      // Assign roles in batches to avoid overwhelming the database
      const batchSize = 100;
      let assigned = 0;

      for (let i = 0; i < usersWithoutRoles.length; i += batchSize) {
        const batch = usersWithoutRoles.slice(i, i + batchSize);
        const roleInserts = batch.map(profile => ({
          user_id: profile.user_id,
          role: 'user',
          tenant_id: '00000000-0000-0000-0000-000000000001'
        }));

        const { error: insertError } = await adminClient
          .from('user_roles')
          .upsert(roleInserts, { onConflict: 'user_id' });

        if (insertError) {
          console.error(`❌ Error inserting batch ${Math.floor(i/batchSize) + 1}:`, insertError);
        } else {
          assigned += batch.length;
          console.log(`✅ Assigned roles to batch ${Math.floor(i/batchSize) + 1} (${batch.length} users)`);
        }
      }

      console.log(`\n✅ Total roles assigned: ${assigned}`);
    } else {
      console.log('✅ All users already have roles!');
    }

    // Final verification
    const { count: finalRoleCount, error: finalCountError } = await adminClient
      .from('user_roles')
      .select('*', { count: 'exact', head: true });

    if (!finalCountError) {
      console.log(`\n📊 Final user roles count: ${finalRoleCount}`);
      console.log(`📊 Profiles count: ${profileCount}`);
      console.log(`📊 Coverage: ${((finalRoleCount / profileCount) * 100).toFixed(1)}%`);
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkAllUsersAndRoles();