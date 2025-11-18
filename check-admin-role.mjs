import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const userId = '99fb8e70-1e68-4b30-8bd8-688df6aa0bde';

console.log('🔍 Checking admin role for user:', userId);

const { data: userRoles, error: roleError } = await supabase
  .from('user_roles')
  .select('*')
  .eq('user_id', userId);

console.log('\n📋 user_roles table:');
console.log(JSON.stringify(userRoles, null, 2));
if (roleError) console.error('Error:', roleError);

const { data: adminUsers, error: adminError } = await supabase
  .from('admin_users')
  .select('*')
  .eq('user_id', userId);

console.log('\n👤 admin_users table:');
console.log(JSON.stringify(adminUsers, null, 2));
if (adminError) console.error('Error:', adminError);
