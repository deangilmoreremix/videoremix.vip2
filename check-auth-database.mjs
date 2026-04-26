import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

// Use local Supabase instance
const supabase = createClient(
  'http://127.0.0.1:54321',
  'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH'
)

async function checkAuthDatabaseState() {
  console.log('🗄️  Checking Auth Database State\n')

  try {
    // Check profiles table
    console.log('📋 Checking profiles table...')
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('user_id, email, created_at')
      .limit(5)

    if (profilesError) {
      console.log('   ❌ Profiles query failed:', profilesError.message)
    } else {
      console.log(`   ✅ Found ${profiles.length} profiles`)
      profiles.forEach(p => console.log(`      - ${p.email} (${p.user_id.substring(0, 8)}...)`))
    }

    // Check user_roles table
    console.log('\n👥 Checking user_roles table...')
    const { data: roles, error: rolesError } = await supabase
      .from('user_roles')
      .select('user_id, role, tenant_id')
      .limit(5)

    if (rolesError) {
      console.log('   ❌ Roles query failed:', rolesError.message)
    } else {
      console.log(`   ✅ Found ${roles.length} user roles`)
      roles.forEach(r => console.log(`      - ${r.user_id.substring(0, 8)}...: ${r.role}`))
    }

    // Check user_app_access table
    console.log('\n🔐 Checking user_app_access table...')
    const { data: access, error: accessError } = await supabase
      .from('user_app_access')
      .select('user_id, app_slug, is_active')
      .limit(5)

    if (accessError) {
      console.log('   ❌ Access query failed:', accessError.message)
    } else {
      console.log(`   ✅ Found ${access.length} access records`)
      access.forEach(a => console.log(`      - ${a.user_id.substring(0, 8)}...: ${a.app_slug} (${a.is_active ? 'active' : 'inactive'})`))
    }

    // Check audit_log table if it exists
    console.log('\n📝 Checking audit_log table...')
    try {
      const { data: logs, error: logsError } = await supabase
        .from('audit_log')
        .select('action, created_at')
        .order('created_at', { ascending: false })
        .limit(10)

      if (logsError) {
        console.log('   ⚠️  Audit log query failed (table may not exist):', logsError.message)
      } else {
        console.log(`   ✅ Found ${logs.length} recent audit logs`)
        logs.forEach(l => console.log(`      - ${l.created_at}: ${l.action}`))
      }
    } catch (err) {
      console.log('   ⚠️  Audit log table not accessible')
    }

  } catch (error) {
    console.error('❌ Database check failed:', error.message)
  }
}

checkAuthDatabaseState()