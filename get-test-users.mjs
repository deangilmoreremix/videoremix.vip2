// Get sample users from database for Playwright testing
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://bzxohkrxcwodllketcpz.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6eG9oa3J4Y3dvZGxsa2V0Y3B6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mzg2NjM4NSwiZXhwIjoyMDg5NDQyMzg1fQ.S5HmTONnamT169WYF0riSphXij-Mwtk7D3pphfSrCFE';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function getTestUsers() {
  console.log('🔍 Getting test users from database...');
  
  const { data: users, error } = await supabase
    .from('auth.users')
    .select('email, created_at')
    .limit(5)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching users:', error);
    return [];
  }
  
  console.log(`📊 Found ${users.length} users:`);
  users.forEach((user, index) => {
    console.log(`${index + 1}. ${user.email} (created: ${user.created_at})`);
  });
  
  return users;
}

getTestUsers().catch(console.error);
