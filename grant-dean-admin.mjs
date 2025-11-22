import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function grantAdmin() {
  // Get user ID
  const { data: users } = await supabase.auth.admin.listUsers();
  const user = users.users.find(u => u.email === 'dean@smartcrm.vip');
  
  if (!user) {
    console.error('User not found');
    return;
  }
  
  console.log('Found user:', user.id);
  
  // Grant super_admin role
  const { data, error } = await supabase
    .from('user_roles')
    .upsert({
      user_id: user.id,
      role: 'super_admin'
    }, {
      onConflict: 'user_id'
    });
  
  if (error) {
    console.error('Error granting role:', error);
    return;
  }
  
  console.log('✅ Successfully granted super_admin role to dean@smartcrm.vip');
  
  // Verify
  const { data: role } = await supabase
    .from('user_roles')
    .select('*')
    .eq('user_id', user.id)
    .single();
  
  console.log('Verified role:', role);
}

grantAdmin();
