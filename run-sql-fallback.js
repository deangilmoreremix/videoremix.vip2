import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from project root .env
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      process.env[key.trim()] = valueParts.join('=').trim();
    }
  }
}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://bzxohkrxcwodllketcpz.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function executeSQL() {
  const sqlContent = fs.readFileSync('grant-bulk-product-access.sql', 'utf-8');

  console.log('Executing bulk product access grant SQL...');

  try {
    const { error } = await supabase.rpc('exec_sql', { sql: sqlContent });

    if (error) {
      console.error('Error executing SQL:', error);
      process.exit(1);
    }

    console.log('✅ SQL executed successfully');
  } catch (err) {
    console.error('Failed to execute SQL:', err);
    process.exit(1);
  }
}

executeSQL();