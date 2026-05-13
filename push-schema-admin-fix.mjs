import { createClient } from '@supabase/supabase-js';

// Load environment variables from .env file
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load .env
const envPath = path.resolve(process.cwd(), '.env');
const envConfig = dotenv.config({ path: envPath });

if (envConfig.error) {
  throw new Error(`Error loading .env file: ${envConfig.error.message}`);
}

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
}

// Create Supabase client with service role (bypasses RLS)
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const sql = `
-- Ensure the 'videoremix' tenant exists
INSERT INTO public.tenants (id, name, slug, domain, is_active)
VALUES (
  gen_random_uuid(),
  'VideoRemix',
  'videoremix',
  'videoremix.vip',
  true
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  domain = EXCLUDED.domain,
  is_active = EXCLUDED.is_active
RETURNING id AS tenant_id;

-- Get the tenant ID and assign admin role
WITH tenant_cte AS (
  SELECT id FROM public.tenants WHERE slug = 'videoremix' LIMIT 1
)
INSERT INTO public.user_roles (user_id, role, tenant_id)
SELECT 
  '12d69594-82f1-4fff-ad9b-8d7ff2bfc7fd'::uuid,
  'admin',
  t.id
FROM tenant_cte t
ON CONFLICT (user_id) DO UPDATE SET
  role = 'admin',
  tenant_id = EXCLUDED.tenant_id,
  updated_at = now();

-- Verify the assignment
SELECT 
  ur.user_id,
  ur.role,
  ur.tenant_id,
  t.slug AS tenant_slug,
  t.name AS tenant_name,
  ur.created_at,
  ur.updated_at
FROM public.user_roles ur
JOIN public.tenants t ON ur.tenant_id = t.id
WHERE ur.user_id = '12d69594-82f1-4fff-ad9b-8d7ff2bfc7fd';
`;

console.log('Executing admin role assignment SQL...\n');

try {
  const { data, error } = await supabase.rpc('exec_sql', { sql });
  
  if (error) {
    // Try direct query execution via REST API
    console.log('Primary method failed, using direct REST API...');
    
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Prefer': 'params=single-object'
      },
      body: JSON.stringify({ sql })
    });
    
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errText}`);
    }
    
    const result = await response.json();
    console.log('✅ Admin role assignment executed successfully');
    console.log('Result:', JSON.stringify(result, null, 2));
  } else {
    console.log('✅ Admin role assignment executed successfully');
    console.log('Data:', JSON.stringify(data, null, 2));
  }
  
  console.log('\n✅ FIX APPLIED: Admin role should now be assigned.');
  console.log('Next steps:');
  console.log('1. Wait ~30 seconds for RLS cache refresh');
  console.log('2. Sign out and sign back in as admin');
  console.log('3. Verify dashboard loads with full app catalog');
  
} catch (err) {
  console.error('❌ Error executing SQL:', err);
  console.log('\nAlternative: Copy the SQL from SUPABASE_ADMIN_FIX.sql and run it manually in the Supabase SQL Editor at:');
  console.log(`${supabaseUrl}/project/editor`);
  process.exit(1);
}
