const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://bzxohkrxcwodllketcpz.supabase.co';
// Using service role key to bypass RLS
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6eG9oa3J4Y3dvZGxsa2V0Y3B6Iiwicm9sZSI6InNlcnZpY2UiLCJpYXQiOjE3Mzg2NjYzODUsImV4cCI6MjA1NDI0MjM4NX0.S5HmTONamT169WYF0riSphXij-Mwtk7D3pphfSrCFE';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function applyFix() {
  console.log('🚀 Starting admin role assignment via REST API...\n');
  
  try {
    // Step 1: Get or create the tenant
    console.log('📁 Step 1: Ensuring tenant "videoremix" exists...');
    
    // Try to fetch existing tenant first
    const { data: existingTenant, error: fetchError } = await supabase
      .from('tenants')
      .select('id')
      .eq('slug', 'videoremix')
      .single();
    
    let tenantId;
    
    if (fetchError && fetchError.code === 'PGRST116') {
      // Tenant doesn't exist, create it
      console.log('   Tenant not found, creating new tenant...');
      const { data: newTenant, error: insertError } = await supabase
        .from('tenants')
        .insert({
          name: 'VideoRemix',
          slug: 'videoremix',
          domain: 'videoremix.vip',
          is_active: true
        })
        .select('id')
        .single();
      
      if (insertError) throw insertError;
      tenantId = newTenant.id;
      console.log('✅ Created tenant:', tenantId);
    } else if (fetchError) {
      throw fetchError;
    } else {
      tenantId = existingTenant.id;
      console.log('✅ Found existing tenant:', tenantId);
      // Update to ensure correct values
      await supabase
        .from('tenants')
        .update({
          name: 'VideoRemix',
          domain: 'videoremix.vip',
          is_active: true
        })
        .eq('slug', 'videoremix');
      console.log('   Tenant values verified/updated');
    }
    
    // Step 2: Assign admin role to user
    console.log('\n👤 Step 2: Assigning admin role to user 12d69594-82f1-4fff-ad9b-8d7ff2bfc7fd...');
    
    const adminUserId = '12d69594-82f1-4fff-ad9b-8d7ff2bfc7fd';
    
    // Check if user_roles record exists
    const { data: existingRole, error: roleFetchError } = await supabase
      .from('user_roles')
      .select('user_id, role, tenant_id')
      .eq('user_id', adminUserId)
      .single();
    
    if (roleFetchError && roleFetchError.code === 'PGRST116') {
      // No existing record, insert new
      console.log('   No existing role found, inserting...');
      const { data: newRole, error: insertError } = await supabase
        .from('user_roles')
        .insert({
          user_id: adminUserId,
          role: 'admin',
          tenant_id: tenantId
        })
        .select('user_id, role, tenant_id')
        .single();
      
      if (insertError) throw insertError;
      console.log('✅ Inserted new role record:', JSON.stringify(newRole, null, 2));
    } else if (roleFetchError) {
      throw roleFetchError;
    } else {
      // Update existing record
      console.log('   Existing role found, updating to admin...');
      const { data: updatedRole, error: updateError } = await supabase
        .from('user_roles')
        .update({
          role: 'admin',
          tenant_id: tenantId,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', adminUserId)
        .select('user_id, role, tenant_id')
        .single();
      
      if (updateError) throw updateError;
      console.log('✅ Updated role record:', JSON.stringify(updatedRole, null, 2));
    }
    
    // Step 3: Verify
    console.log('\n🔍 Step 3: Verifying admin role assignment...');
    const { data: verify, error: verifyError } = await supabase
      .from('user_roles')
      .select(`
        user_id,
        role,
        tenant_id,
        tenants (slug, name)
      `)
      .eq('user_id', adminUserId)
      .single();
    
    if (verifyError) throw verifyError;
    
    console.log('✅ Verification successful:');
    console.log('   User ID:', verify.user_id);
    console.log('   Role:', verify.role);
    console.log('   Tenant:', verify.tenants?.name || 'N/A');
    console.log('   Tenant Slug:', verify.tenants?.slug || 'N/A');
    
    if (verify.role !== 'admin') {
      throw new Error(`Verification failed: role is ${verify.role}, expected 'admin'`);
    }
    
    console.log('\n🎉 SUCCESS: Admin role has been assigned!');
    console.log('\n📋 IMPORTANT NEXT STEPS:');
    console.log('1. Wait 30 seconds for RLS cache to refresh');
    console.log('2. Sign OUT of the application completely');
    console.log('3. Sign BACK IN as admin user');
    console.log('4. Navigate to Dashboard - you should see ALL apps including any inactive ones');
    console.log('5. Click on any app to see full GTM details (description, benefits, features, testimonials, FAQs)');
    console.log('\n💡 If dashboard still shows limited apps, try:');
    console.log('   - Clearing browser cache/localStorage');
    console.log('   - Restarting the dev server');
    console.log('   - Waiting a full minute for RLS cache to fully propagate');
    
  } catch (err) {
    console.error('\n❌ ERROR:', err.message);
    if (err.code) console.error('   Error code:', err.code);
    console.log('\n🔧 Backup plan: Execute SUPABASE_ADMIN_FIX.sql manually:');
    console.log('   1. Open: https://bzxohkrxcwodllketcpz.supabase.co/project/editor');
    console.log('   2. Paste contents of SUPABASE_ADMIN_FIX.sql');
    console.log('   3. Click Run');
    process.exit(1);
  }
}

applyFix();
