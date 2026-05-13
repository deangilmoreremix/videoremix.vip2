import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bzxohkrxcwodllketcpz.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6eG9oa3J4Y3dvZGxsa2V0Y3B6Iiwicm9sZSI6InNlcnZpY2UiLCJpYXQiOjE3Mzg2NjYzODUsImV4cCI6MjA1NDI0MjM4NX0.S5HmTONamT169WYF0riSphXij-Mwtk7D3pphfSrCFE';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const sql = `
INSERT INTO public.tenants (id, name, slug, domain, is_active)
VALUES (gen_random_uuid(), 'VideoRemix', 'videoremix', 'videoremix.vip', true)
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, domain = EXCLUDED.domain, is_active = EXCLUDED.is_active
RETURNING id AS tenant_id;

WITH tenant_cte AS (SELECT id FROM public.tenants WHERE slug = 'videoremix' LIMIT 1)
INSERT INTO public.user_roles (user_id, role, tenant_id)
SELECT '12d69594-82f1-4fff-ad9b-8d7ff2bfc7fd'::uuid, 'admin', t.id
FROM tenant_cte t
ON CONFLICT (user_id) DO UPDATE SET role = 'admin', tenant_id = EXCLUDED.tenant_id, updated_at = now();

SELECT ur.user_id, ur.role, ur.tenant_id, t.slug AS tenant_slug, t.name AS tenant_name
FROM public.user_roles ur
JOIN public.tenants t ON ur.tenant_id = t.id
WHERE ur.user_id = '12d69594-82f1-4fff-ad9b-8d7ff2bfc7fd';
`;

console.log('Executing admin role assignment...\n');

try {
  // Use direct REST API call to execute SQL
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
    // Try using the postgrest API endpoint directly
    const postgrestResponse = await fetch(`${supabaseUrl}/sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Prefer': 'params=single-object'
      },
      body: JSON.stringify({ 
        query: sql,
        parameters: {}
      })
    });
    
    if (!postgrestResponse.ok) {
      const err = await postgrestResponse.text();
      throw new Error(`HTTP ${postgrestResponse.status}: ${err}`);
    }
    
    const result = await postgrestResponse.json();
    console.log('✅ Admin role assigned successfully');
    console.log('Verification:', JSON.stringify(result, null, 2));
  } else {
    const result = await response.json();
    console.log('✅ Admin role assigned successfully');
    console.log('Result:', JSON.stringify(result, null, 2));
  }
  
  console.log('\n✅ SUCCESS: Admin user (12d69594-...) now has admin role.');
  console.log('Please: 1) Wait 30s for cache refresh, 2) Sign out/in, 3) Test dashboard.');
  
} catch (err) {
  console.error('❌ Failed:', err.message);
  console.log('\nManual fallback: Copy SUPABASE_ADMIN_FIX.sql and run in Supabase SQL Editor:');
  console.log(`${supabaseUrl}/project/editor`);
  process.exit(1);
}
