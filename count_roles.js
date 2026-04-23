import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function count() {
  const { count: rolesCount, error: rolesError } = await supabase.from('user_roles').select('*', { count: 'exact', head: true });
  if (rolesError) console.error('Roles error:', rolesError);
  else console.log('Users with roles:', rolesCount);

  const { count: accessCount, error: accessError } = await supabase.from('user_app_access').select('*', { count: 'exact', head: true });
  if (accessError) console.error('Access error:', accessError);
  else console.log('Users with app access:', accessCount);

  const { count: usersCount, error: usersError } = await supabase.from('auth.users').select('*', { count: 'exact', head: true });
  if (usersError) console.error('Users error:', usersError);
  else console.log('Total users:', usersCount);
}

count();
