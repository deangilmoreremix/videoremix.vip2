import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const env = readFileSync(path.join(__dirname, '.env'), 'utf-8');
const envVars = {};
env.split('\n').forEach(line => {
  const [key, ...value] = line.split('=');
  if (key && value.length) envVars[key.trim()] = value.join('=').trim();
});

const supabase = createClient(envVars.VITE_SUPABASE_URL, envVars.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function checkDuplicates() {
  // Get all profiles
  const { data: allProfiles, error } = await supabase
    .from('profiles')
    .select('user_id, email');

  if (error) {
    console.log('Error:', error.message);
    return;
  }

  console.log('Total profiles:', allProfiles.length);

  // Count unique user_ids
  const uniqueUserIds = new Set(allProfiles.map(p => p.user_id));
  console.log('Unique user_ids in profiles:', uniqueUserIds.size);

  // Count unique emails
  const uniqueEmails = new Set(allProfiles.map(p => p.email?.toLowerCase().trim()).filter(e => e));
  console.log('Unique emails in profiles:', uniqueEmails.size);

  // Check for duplicate user_ids
  const userIdCounts = {};
  allProfiles.forEach(p => {
    userIdCounts[p.user_id] = (userIdCounts[p.user_id] || 0) + 1;
  });

  const duplicates = Object.entries(userIdCounts).filter(([id, count]) => count > 1);
  console.log('Profiles with duplicate user_ids:', duplicates.length);

  if (duplicates.length > 0) {
    console.log('Sample duplicates:', duplicates.slice(0, 3).map(([id, count]) => `${id}: ${count} profiles`));
  }
}

checkDuplicates().catch(console.error);