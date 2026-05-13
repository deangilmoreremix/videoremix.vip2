import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

async function comprehensiveInspection() {
  console.log('\n=== COMPREHENSIVE DATABASE INSPECTION ===\n');

  // 1. Check user_roles for admin user
  console.log('1. USER_ROLE ASSIGNMENT:');
  const adminUserId = '12d69594-82f1-4fff-ad9b-8d7ff2bfc7fd';
  const { data: userRoles, error: roleError } = await supabase
    .from('user_roles')
    .select('*')
    .eq('user_id', adminUserId);
  
  if (roleError) {
    console.log(`   ERROR: ${roleError.message} (code: ${roleError.code})`);
  } else {
    console.log(`   Found ${userRoles?.length || 0} role(s) for admin user ${adminUserId}`);
    if (userRoles && userRoles.length > 0) {
      userRoles.forEach(r => {
        console.log(`   - Role: ${r.role}, tenant_id: ${r.tenant_id}`);
      });
    } else {
      console.log('   ❌ NO ADMIN ROLE ASSIGNED - Root cause identified!');
    }
  }

  // 2. Check all users with admin roles
  console.log('\n2. ALL ADMIN USERS:');
  const { data: allAdmins } = await supabase
    .from('user_roles')
    .select('user_id, role')
    .in('role', ['admin', 'super_admin']);
  if (allAdmins) {
    console.log(`   Total admin users: ${allAdmins.length}`);
    allAdmins.forEach(a => {
      console.log(`   - ${a.user_id.substring(0, 12)}... : ${a.role}`);
    });
  }

  // 3. Apps table structure
  console.log('\n3. APPS TABLE ACTUAL COLUMNS:');
  const { data: sampleApp } = await supabase
    .from('apps')
    .select('*')
    .limit(1);
  
  if (sampleApp && sampleApp.length > 0) {
    console.log('   Columns present:');
    Object.keys(sampleApp[0]).forEach(k => {
      const v = sampleApp[0][k];
      const type = typeof v;
      console.log(`   - ${k} (${typeof v})${v !== null ? ` = ${String(v).substring(0, 30)}` : ''}`);
    });
  }

  // 4. App visibility
  console.log('\n4. APP VISIBILITY:');
  const { data: allApps } = await supabase
    .from('apps')
    .select('id, name, is_active, is_featured, sort_order')
    .order('sort_order', { ascending: true });
  console.log(`   Service role sees: ${allApps?.length || 0} apps`);
  const activeCount = allApps?.filter(a => a.is_active).length || 0;
  console.log(`   Active apps: ${activeCount}, Inactive: ${(allApps?.length || 0) - activeCount}`);

  // 5. RLS policies via direct SQL
  console.log('\n5. RLS POLICIES:');
  try {
    const { data: policies } = await supabase.rpc('exec_sql', {
      sql: `SELECT tablename, policyname, cmd, permissive, roles, qual FROM pg_policies WHERE tablename IN ('apps','user_roles','user_app_access') ORDER BY tablename, policyname;`
    });
    if (policies) {
      policies.forEach(p => {
        console.log(`   Table: ${p.tablename}, Policy: ${p.policyname}, Cmd: ${p.cmd}, Using: ${p.qual?.substring(0, 80)}`);
      });
    }
  } catch (e) {
    console.log('   RPC not available - check Supabase Dashboard > Database > Policies');
  }

  // 6. Tenants
  console.log('\n6. TENANT DATA:');
  const { data: tenants } = await supabase.from('tenants').select('id, name, slug').limit(5);
  if (tenants) {
    console.log(`   Tenants: ${tenants.length}`);
    tenants.forEach(t => console.log(`   - ${t.name} (${t.slug})`));
  }

  // 7. user_app_access stats
  console.log('\n7. USER_APP_ACCESS:');
  const { count: uaTotal } = await supabase.from('user_app_access').select('*', { count: 'exact', head: true });
  console.log(`   Total access records: ${uaTotal}`);
  const { data: adminUA } = await supabase
    .from('user_app_access')
    .select('app_slug, is_active')
    .eq('user_id', adminUserId);
  console.log(`   Admin has ${adminUA?.length || 0} access records`);

  // 8. Check AdminContext's role check query
  console.log('\n8. ADMIN ROLE CHECK SIMULATION:');
  const { data: roleCheck } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', adminUserId)
    .maybeSingle();
  console.log('   Query result:', roleCheck);
  if (!roleCheck) {
    console.log('   ❌ AdminContext will fail: no role found');
  }

  console.log('\n=== END INSPECTION ===\n');
}

comprehensiveInspection();
