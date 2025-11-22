import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function resetPassword() {
  const { data: users } = await supabase.auth.admin.listUsers();
  const user = users.users.find(u => u.email === 'dean@smartcrm.vip');
  
  if (!user) {
    console.error('User not found');
    return;
  }
  
  console.log('Resetting password for:', user.email);
  
  const { data, error } = await supabase.auth.admin.updateUserById(
    user.id,
    { password: 'VideoRemix2025' }
  );
  
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log('✅ Password reset successfully');
  console.log('\nLogin credentials:');
  console.log('Email: dean@smartcrm.vip');
  console.log('Password: VideoRemix2025');
  console.log('Role: super_admin');
}

resetPassword();
