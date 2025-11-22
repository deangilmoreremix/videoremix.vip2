import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const testEmails = [
  'dean@smartcrm.vip',
  'samuel@smartcrm.vip',
  'victor@smartcrm.vip'
];

async function testLogins() {
  console.log('Testing admin logins...\n');
  
  for (const email of testEmails) {
    console.log('Testing ' + email + '...');
    
    // Try to sign in with the regular client (not service role)
    const regularClient = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.VITE_SUPABASE_ANON_KEY
    );
    
    const { data, error } = await regularClient.auth.signInWithPassword({
      email: email,
      password: 'VideoRemix2025'
    });
    
    if (error) {
      console.log('  ❌ Login failed: ' + error.message);
    } else {
      console.log('  ✅ Login successful');
      console.log('  User ID: ' + data.user.id);
      
      // Check role
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', data.user.id)
        .single();
      
      console.log('  Role: ' + (roleData ? roleData.role : 'NO ROLE'));
    }
    console.log('');
  }
}

testLogins();
