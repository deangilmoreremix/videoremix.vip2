import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkEmail() {
  console.log('Checking dean@smartcrm.vip...');
  
  const { data: user, error } = await supabase.auth.admin.listUsers();
  
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  const deanSmart = user.users.find(u => u.email === 'dean@smartcrm.vip');
  const deanVideo = user.users.find(u => u.email === 'dean@videoremix.vip');
  
  console.log('\ndean@smartcrm.vip:', deanSmart ? 'EXISTS' : 'NOT FOUND');
  console.log('dean@videoremix.vip:', deanVideo ? 'EXISTS' : 'NOT FOUND');
  
  if (deanSmart) {
    console.log('\nChecking role for dean@smartcrm.vip...');
    const { data: role } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', deanSmart.id)
      .single();
    console.log('Role:', role || 'NO ROLE');
  }
}

checkEmail();
