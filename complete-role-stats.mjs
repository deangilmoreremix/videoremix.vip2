import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const adminClient = createClient(supabaseUrl, supabaseServiceKey);

async function showCompleteRoleStats() {
  console.log('📊 Complete Role Statistics:\n');

  // Get total count
  const { count: totalCount, error: countError } = await adminClient
    .from('user_roles')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    console.error('Error counting:', countError);
    return;
  }

  console.log(`Total role assignments: ${totalCount}`);

  // Get all roles (may be limited by API)
  const { data: roles, error } = await adminClient
    .from('user_roles')
    .select('role')
    .limit(2000); // Try to get more

  if (error) {
    console.error('Error:', error);
    return;
  }

  const stats = roles.reduce((acc, curr) => {
    acc[curr.role] = (acc[curr.role] || 0) + 1;
    return acc;
  }, {});

  console.log('\nRole distribution (sampled):');
  Object.entries(stats).forEach(([role, count]) => {
    console.log(`   ${role}: ${count} users`);
  });

  // Check for super_admin specifically
  const { count: superAdminCount, error: saError } = await adminClient
    .from('user_roles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'super_admin');

  if (!saError) {
    console.log(`\nSuper admins: ${superAdminCount}`);
  }

  // Check for regular users
  const { count: userCount, error: userError } = await adminClient
    .from('user_roles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'user');

  if (!userError) {
    console.log(`Regular users: ${userCount}`);
  }
}

showCompleteRoleStats();