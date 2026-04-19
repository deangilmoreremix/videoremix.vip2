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

async function checkProducts() {
  const { data: products, error } = await supabase
    .from('products_catalog')
    .select('name, apps_granted')
    .eq('is_active', true)
    .order('name');

  if (error) {
    console.error('Error:', error.message);
    return;
  }

  console.log('Products in catalog:');
  products.forEach(p => {
    console.log(`- ${p.name} → ${JSON.stringify(p.apps_granted)}`);
  });
}

checkProducts().catch(console.error);