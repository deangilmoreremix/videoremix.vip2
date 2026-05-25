import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

// Use service role key to access admin functions
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function findRealUsers() {
  console.log('🔍 Finding Real Users in Remote Database\n')

  try {
    // Get all users from auth.users using admin API
    console.log('📡 Fetching users from auth.users...')
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers()

    if (usersError) {
      console.log('❌ Cannot access auth users:', usersError.message)
      return
    }

    if (!users || !users.users || users.users.length === 0) {
      console.log('⚠️  No users found in auth.users')
      return
    }

    console.log(`✅ Found ${users.users.length} users in auth.users`)

    // Get a sample of users (first 10)
    const sampleUsers = users.users.slice(0, 10)

    console.log('\n👥 Sample Users:')
    console.log('================')

    for (const user of sampleUsers) {
      console.log(`Email: ${user.email}`)
      console.log(`User ID: ${user.id}`)
      console.log(`Created: ${user.created_at}`)
      console.log(`Email Confirmed: ${user.email_confirmed_at ? 'Yes' : 'No'}`)
      console.log(`Last Sign In: ${user.last_sign_in_at || 'Never'}`)

      // Check if they have any app access
      const { data: access, error: accessError } = await supabase
        .from('user_app_access')
        .select('app_slug')
        .eq('user_id', user.id)
        .limit(1)

      if (!accessError && access && access.length > 0) {
        console.log(`Has App Access: Yes (${access[0].app_slug})`)
      } else {
        console.log(`Has App Access: No`)
      }

      console.log('----------------')
    }

    // Find users with app access
    console.log('\n🎯 Users with App Access:')
    console.log('========================')

    const { data: usersWithAccess, error: accessQueryError } = await supabase
      .from('user_app_access')
      .select(`
        user_id,
        app_slug,
        auth.users!inner(email)
      `)
      .eq('is_active', true)
      .limit(5)

    if (!accessQueryError && usersWithAccess) {
      for (const access of usersWithAccess) {
        console.log(`Email: ${access.auth?.users?.email || 'N/A'}`)
        console.log(`App: ${access.app_slug}`)
        console.log(`User ID: ${access.user_id}`)
        console.log('----------------')
      }
    }

    // Return the first user with access as the primary test user
    if (usersWithAccess && usersWithAccess.length > 0) {
      const testUser = usersWithAccess[0]
      console.log('\n🎯 RECOMMENDED TEST USER:')
      console.log('========================')
      console.log(`Email: ${testUser.auth?.users?.email}`)
      console.log(`User ID: ${testUser.user_id}`)
      console.log(`App Access: ${testUser.app_slug}`)
      console.log('========================')
      console.log('\n💡 This user has app access and should be able to log in!')
    }

  } catch (error) {
    console.error('❌ Error querying database:', error.message)
  }
}

findRealUsers()