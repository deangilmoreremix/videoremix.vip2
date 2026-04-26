import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

// Check both local and remote Supabase instances
const localSupabase = createClient(
  'http://127.0.0.1:54321',
  'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH'
)

const remoteSupabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

async function findExistingUsers() {
  console.log('🔍 Finding Existing Users in Database\n')

  const instances = [
    { name: 'Local Supabase', client: localSupabase },
    { name: 'Remote Supabase', client: remoteSupabase }
  ]

  for (const instance of instances) {
    console.log(`📡 Checking ${instance.name}...`)

    try {
      // Try to get users from auth.users (this might not work with anon key)
      const { data: authUsers, error: authError } = await instance.client.auth.admin.listUsers()

      if (!authError && authUsers) {
        console.log(`   ✅ Found ${authUsers.users.length} users in auth:`)
        authUsers.users.slice(0, 5).forEach(user => {
          console.log(`      - ${user.email} (ID: ${user.id.substring(0, 8)}...)`)
        })
      } else {
        console.log(`   ⚠️  Cannot access auth.users directly (${authError?.message || 'Permission denied'})`)
      }

      // Check profiles table
      const { data: profiles, error: profilesError } = await instance.client
        .from('profiles')
        .select('user_id, email')
        .limit(10)

      if (!profilesError && profiles && profiles.length > 0) {
        console.log(`   ✅ Found ${profiles.length} profiles:`)
        profiles.forEach(profile => {
          console.log(`      - ${profile.email} (User ID: ${profile.user_id.substring(0, 8)}...)`)
        })
      } else {
        console.log(`   ℹ️  No profiles found or access denied`)
      }

      // Check user_app_access table
      const { data: access, error: accessError } = await instance.client
        .from('user_app_access')
        .select('user_id, app_slug')
        .limit(10)

      if (!accessError && access && access.length > 0) {
        console.log(`   ✅ Found ${access.length} app access records:`)
        access.forEach(record => {
          console.log(`      - User ${record.user_id.substring(0, 8)}... has access to ${record.app_slug}`)
        })
      } else {
        console.log(`   ℹ️  No app access records found`)
      }

    } catch (error) {
      console.log(`   ❌ Error checking ${instance.name}:`, error.message)
    }

    console.log('')
  }

  // Try some common test emails
  console.log('🎯 Testing Common Test Emails:')
  const testEmails = [
    'testuser1@example.com',
    'admin@example.com',
    'user@example.com',
    'test@example.com'
  ]

  for (const email of testEmails) {
    console.log(`   Testing ${email}...`)
    try {
      const { data, error } = await remoteSupabase.auth.signInWithPassword({
        email,
        password: 'password123' // Common test password
      })

      if (!error && data.user) {
        console.log(`      ✅ SUCCESS: ${email} exists and can sign in`)
        console.log(`         User ID: ${data.user.id}`)
        console.log(`         Email confirmed: ${data.user.email_confirmed_at ? 'Yes' : 'No'}`)
        break // Found a working user
      } else {
        console.log(`      ❌ Failed: ${error?.message || 'Unknown error'}`)
      }
    } catch (err) {
      console.log(`      ❌ Exception: ${err.message}`)
    }
  }
}

findExistingUsers()