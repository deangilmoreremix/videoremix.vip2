const https = require('https');

const supabaseUrl = 'https://bzxohkrxcwodllketcpz.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6eG9oa3J4Y3dvZGxsa2V0Y3B6Iiwicm9sZSI6InNlcnZpY2UiLCJpYXQiOjE3Mzg2NjYzODUsImV4cCI6MjA1NDI0MjM4NX0.S5HmTONamT169WYF0riSphXij-Mwtk7D3pphfSrCFE';

const sql = `
INSERT INTO public.tenants (id, name, slug, domain, is_active)
VALUES (gen_random_uuid(), 'VideoRemix', 'videoremix', 'videoremix.vip', true)
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, domain = EXCLUDED.domain, is_active = EXCLUDED.is_active;

WITH tenant_cte AS (SELECT id FROM public.tenants WHERE slug = 'videoremix' LIMIT 1)
INSERT INTO public.user_roles (user_id, role, tenant_id)
SELECT '12d69594-82f1-4fff-ad9b-8d7ff2bfc7fd'::uuid, 'admin', t.id
FROM tenant_cte t
ON CONFLICT (user_id) DO UPDATE SET role = 'admin', tenant_id = EXCLUDED.tenant_id, updated_at = now();

SELECT ur.user_id, ur.role, t.slug AS tenant_slug, t.name AS tenant_name
FROM public.user_roles ur
JOIN public.tenants t ON ur.tenant_id = t.id
WHERE ur.user_id = '12d69594-82f1-4fff-ad9b-8d7ff2bfc7fd';
`;

const options = {
  hostname: supabaseUrl.replace('https://', ''),
  port: 443,
  path: '/sql',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${serviceRoleKey}`,
    'apikey': serviceRoleKey
  }
};

console.log('Executing admin fix on Supabase project:', supabaseUrl);

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('\\nHTTP Status:', res.statusCode);
    if (res.statusCode >= 200 && res.statusCode < 300) {
      try {
        const result = JSON.parse(data);
        console.log('✅ SUCCESS: Admin role assigned');
        console.log('Verification:', JSON.stringify(result, null, 2));
      } catch (e) {
        console.log('✅ Response:', data);
      }
      console.log('\\n📋 Next Steps:');
      console.log('1. Wait 30 seconds for RLS cache to refresh');
      console.log('2. Sign out of the application');
      console.log('3. Sign back in as admin user');
      console.log('4. Verify dashboard loads with full app catalog (all apps visible)');
    } else {
      console.log('❌ Error:', data);
      console.log('\\n🔧 Manual execution required:');
      console.log('Open: ' + supabaseUrl + '/project/editor');
      console.log('Paste and run SUPABASE_ADMIN_FIX.sql contents');
    }
  });
});

req.on('error', (e) => {
  console.error('❌ Request error:', e);
});

req.write(JSON.stringify({ query: sql }));
req.end();
