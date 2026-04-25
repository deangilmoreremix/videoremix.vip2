import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const adminClient = createClient(supabaseUrl, supabaseServiceKey);

async function showFinalRoleStats() {
  console.log('📊 Final Role Distribution:\n');

  const { data: roles, error } = await adminClient
    .from('user_roles')
    .select('role');

  if (error) {
    console.error('Error:', error);
    return;
  }

  const stats = roles.reduce((acc, curr) => {
    acc[curr.role] = (acc[curr.role] || 0) + 1;
    return acc;
  }, {});

  Object.entries(stats).forEach(([role, count]) => {
    console.log(`   ${role}: ${count} users`);
  });

  console.log(`\n   Total: ${roles.length} role assignments`);
}

showFinalRoleStats();