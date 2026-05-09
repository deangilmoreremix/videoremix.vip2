import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envContent = fs.readFileSync('.env', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) env[key.trim()] = value.trim();
});

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const userId = '99fb8e70-1e68-4b30-8bd8-688df6aa0bde';
const email = 'dev@videoremix.vip';

console.log('🔍 Fixing admin profile for:', email);

console.log('\n=== Check admin_profiles table ===');

const { data: adminProfiles, error: profileError } = await supabase
  .from('admin_profiles')
  .select('*')
  .eq('user_id', userId);

console.log('👤 Current admin_profiles:', adminProfiles);

if (!adminProfiles || adminProfiles.length === 0) {
  console.log('\n➕ Creating admin_profiles record...');
  const { data: newProfile, error: insertError } = await supabase
    .from('admin_profiles')
    .insert([{
      user_id: userId,
      email: email,
      full_name: 'Dev Admin'
    }])
    .select();

  if (insertError) {
    console.error('❌ Error inserting admin profile:', insertError);
  } else {
    console.log('✅ Admin profile created:', newProfile);
  }
} else {
  console.log('✅ Admin profile already exists');
}

console.log('\n=== Final verification ===');

const { data: finalProfile } = await supabase
  .from('admin_profiles')
  .select('*')
  .eq('user_id', userId);

console.log('👤 Final admin_profiles:', finalProfile);

const { data: finalRole } = await supabase
  .from('user_roles')
  .select('*')
  .eq('user_id', userId);

console.log('📋 Final user_roles:', finalRole);

console.log('\n✅ Admin setup complete!');
