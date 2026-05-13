const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://bzxohkrxcwodllketcpz.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6eG9oa3J4Y3dvZGxsa2V0Y3B6Iiwicm9sZSI6InNlcnZpY2UiLCJpYXQiOjE3Mzg2NjYzODUsImV4cCI6MjA1NDI0MjM4NX0.S5HmTONamT169WYF0riSphXij-Mwtk7D3pphfSrCFE';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function applyFix() {
  console.log('Starting admin role assignment...\n');
  
  try {
    // Step 1: Ensure tenant exists
    console.log('Step 1: Ensuring tenant exists...');
    const { data: tenantData, error: tenantError } = await supabase
      .from('tenants')
      .upsert(
        { 
          slug: 'videoremix', 
          name: 'VideoRemix', 
          domain: 'videoremix.vip', 
          is_active: true 
        },
        { onConflict: 'slug' }
      )
      .select('id')
      .single();
    
    if (tenantError) throw tenantError;
    console.log('✅ Tenant ensured:', tenantData.id);
    
    // Step 2: Assign admin role
    console.log('\nStep 2: Assigning admin role to user 12d69594-...');
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .upsert(
        {
          user_id: '12d69594-82f1-4fff-ad9b-8d7ff2bfc7fd',
          role: 'admin',
          tenant_id: tenantData.id
        },
        { onConflict: 'user_id' }
      )
      .select('user_id, role, tenant_id')
      .single();
    
    if (roleError) throw roleError;
    console.log('✅ Role assigned:', JSON.stringify(roleData, null, 2));
    
    // Step 3: Verify
    console.log('\nStep 3: Verifying assignment...');
    const { data: verifyData, error: verifyError } = await supabase
      .from('user_roles')
      .select('user_id, role, tenant_id')
      .eq('user_id', '12d69594-82f1-4fff-ad9b-8d7ff2bfc7fd')
      .single();
    
    if (verifyError) throw verifyError;
    console.log('✅ Verification successful:', JSON.stringify(verifyData, null, 2));
    
    console.log('\n✅ ALL STEPS COMPLETED SUCCESSFULLY');
    console.log('\n📋 IMPORTANT NEXT STEPS:');
    console.log('1. Wait 30 seconds for RLS policy cache to refresh');
    console.log('2. Sign OUT of the application completely');
    console.log('3. Sign BACK IN as admin user (12d69594-...)');
    console.log('4. Navigate to Dashboard - you should see all apps');
    console.log('5. GTM details (description, benefits, features) will be visible');
    console.log('\n💡 If you still experience issues, restart the dev server.');
    
  } catch (err) {
    console.error('\n❌ ERROR:', err.message);
    console.log('\n🔧 Backup plan: Execute SUPABASE_ADMIN_FIX.sql manually in Supabase SQL Editor:');
    console.log('URL: ' + supabaseUrl + '/project/editor');
    process.exit(1);
  }
}

applyFix();
