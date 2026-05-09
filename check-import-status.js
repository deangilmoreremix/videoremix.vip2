import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import path from 'path';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const env = readFileSync(join(__dirname, '.env'), 'utf-8');
const envVars = {};
env.split('\n').forEach(line => {
  const [key, ...value] = line.split('=');
  if (key && value.length) envVars[key.trim()] = value.join('=').trim();
});

const supabase = createClient(envVars.VITE_SUPABASE_URL, envVars.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function checkStatus() {
  const { count, error: countError } = await supabase
    .from('import_user_records')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    console.error('Error:', countError.message);
    return;
  }

  console.log(`Total import records: ${count}`);

  const { data: statusCounts, error: statusError } = await supabase
    .from('import_user_records')
    .select('processing_status');
  
  if (statusError) {
    console.error('Error fetching statuses:', statusError.message);
    return;
  }

  const counts = {};
  for (const row of (statusCounts || [])) {
    const s = row.processing_status || 'null';
    counts[s] = (counts[s] || 0) + 1;
  }
  console.log('Processing status counts:', counts);

  // Also check user_app_access
  const { count: accessCount } = await supabase
    .from('user_app_access')
    .select('*', { count: 'exact', head: true });
  console.log(`Total app access grants: ${accessCount}`);
}

checkStatus().catch(console.error);