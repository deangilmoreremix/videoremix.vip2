import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables!');
  process.exit(1);
}

const adminClient = createClient(supabaseUrl, supabaseServiceKey);

async function assignUserRoles() {
  console.log('🛠️  Assigning user roles to all existing users...\n');

  try {
    // Get all users who don't have user roles
    const { data: usersWithoutRoles, error: usersError } = await adminClient
      .from('auth.users')
      .select('id, email')
      .limit(1000); // Get first 1000 users

    if (usersError) {
      console.error('❌ Error fetching users:', usersError);
      return;
    }

    console.log(`Found ${usersWithoutRoles.length} users in auth.users`);

    // Check which users already have roles
    const { data: existingRoles, error: rolesError } = await adminClient
      .from('user_roles')
      .select('user_id');

    if (rolesError) {
      console.error('❌ Error fetching existing roles:', rolesError);
      return;
    }

    const usersWithRoles = new Set(existingRoles.map(r => r.user_id));
    const usersNeedingRoles = usersWithoutRoles.filter(u => !usersWithRoles.has(u.id));

    console.log(`${usersNeedingRoles.length} users need roles assigned`);

    // Assign 'user' role to users who don't have any role
    if (usersNeedingRoles.length > 0) {
      const roleInserts = usersNeedingRoles.map(user => ({
        user_id: user.id,
        role: 'user',
        tenant_id: '00000000-0000-0000-0000-000000000001'
      }));

      const { error: insertError } = await adminClient
        .from('user_roles')
        .insert(roleInserts);

      if (insertError) {
        console.error('❌ Error inserting user roles:', insertError);
      } else {
        console.log(`✅ Assigned 'user' role to ${usersNeedingRoles.length} users`);
      }
    } else {
      console.log('✅ All users already have roles assigned');
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

assignUserRoles();