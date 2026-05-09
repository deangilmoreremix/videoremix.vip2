import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const admins = [
  { email: 'dean@smartcrm.vip', password: 'VideoRemix2025', name: 'Dean' },
  { email: 'samuel@smartcrm.vip', password: 'VideoRemix2025', name: 'Samuel' },
  { email: 'victor@smartcrm.vip', password: 'VideoRemix2025', name: 'Victor' }
];

async function setupAdmins() {
  console.log('Setting up admin accounts...\n');
  
  for (const admin of admins) {
    console.log(`Processing ${admin.email}...`);
    
    // Check if user exists
    const { data: users } = await supabase.auth.admin.listUsers();
    let user = users.users.find(u => u.email === admin.email);
    
    if (!user) {
      // Create user
      console.log(`  Creating new user...`);
      const { data: newUser, error } = await supabase.auth.admin.createUser({
        email: admin.email,
        password: admin.password,
        email_confirm: true,
        user_metadata: { name: admin.name }
      });
      
      if (error) {
        console.error(`  ❌ Error creating user:`, error);
        continue;
      }
      user = newUser.user;
      console.log(`  ✅ User created`);
    } else {
      // Reset password
      console.log(`  User exists, resetting password...`);
      const { error } = await supabase.auth.admin.updateUserById(
        user.id,
        { password: admin.password }
      );
      
      if (error) {
        console.error(`  ❌ Error resetting password:`, error);
      } else {
        console.log(`  ✅ Password reset`);
      }
    }
    
    // Grant super_admin role
    const { data: existingRole } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();
    
    if (existingRole) {
      if (existingRole.role !== 'super_admin') {
        await supabase
          .from('user_roles')
          .update({ role: 'super_admin' })
          .eq('user_id', user.id);
        console.log(`  ✅ Updated to super_admin`);
      } else {
        console.log(`  ✅ Already super_admin`);
      }
    } else {
      const { error } = await supabase
        .from('user_roles')
        .insert({
          user_id: user.id,
          role: 'super_admin'
        });
      
      if (error) {
        console.error(`  ❌ Error granting role:`, error);
      } else {
        console.log(`  ✅ Granted super_admin role`);
      }
    }
    
    console.log('');
  }
  
  console.log('\n========================================');
  console.log('ADMIN ACCOUNTS READY');
  console.log('========================================\n');
  
  admins.forEach(admin => {
    console.log(`Email: ${admin.email}`);
    console.log(`Password: ${admin.password}`);
    console.log(`Role: super_admin\n`);
  });
}

setupAdmins();
