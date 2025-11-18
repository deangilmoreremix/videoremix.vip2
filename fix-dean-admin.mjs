import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixAdmin() {
  // Get user ID
  const { data: users } = await supabase.auth.admin.listUsers();
  const user = users.users.find(u => u.email === 'dean@smartcrm.vip');
  
  if (!user) {
    console.error('User not found');
    return;
  }
  
  console.log('User ID:', user.id);
  
  // Check if role exists
  const { data: existing } = await supabase
    .from('user_roles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();
  
  if (existing) {
    console.log('Existing role:', existing);
    // Update
    const { error } = await supabase
      .from('user_roles')
      .update({ role: 'super_admin' })
      .eq('user_id', user.id);
    
    if (error) {
      console.error('Update error:', error);
    } else {
      console.log('✅ Updated to super_admin');
    }
  } else {
    // Insert
    const { error } = await supabase
      .from('user_roles')
      .insert({
        user_id: user.id,
        role: 'super_admin'
      });
    
    if (error) {
      console.error('Insert error:', error);
    } else {
      console.log('✅ Inserted super_admin role');
    }
  }
  
  // Verify
  const { data: role } = await supabase
    .from('user_roles')
    .select('*')
    .eq('user_id', user.id)
    .single();
  
  console.log('\nFinal role:', role);
}

fixAdmin();
