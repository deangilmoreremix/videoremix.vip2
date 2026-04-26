import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

// Use service role key to access admin functions
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function findImportedUsers() {
  console.log('🔍 Looking for Imported Users (not test users)\n')

  try {
    // Get all users
    const { data: allUsers, error: usersError } = await supabase.auth.admin.listUsers()

    if (usersError || !allUsers?.users) {
      console.log('❌ Cannot access users')
      return
    }

    console.log(`📊 Total users in database: ${allUsers.users.length}`)

    // Filter out test users (those with timestamps in email)
    const realUsers = allUsers.users.filter(user => {
      const email = user.email || ''
      // Skip users with test patterns
      return !email.includes('test-') &&
             !email.includes('-1777') &&
             !email.includes('@example.com') &&
             !email.includes('normalize') &&
             !email.includes('instant-signup') &&
             !email.includes('case-test') &&
             !email.includes('admin-change') &&
             !email.includes('dashboard-test')
    })

    console.log(`👥 Potential real users: ${realUsers.length}`)

    if (realUsers.length === 0) {
      console.log('⚠️  No real users found, only test users exist')

      // Let's check the CSV data to see what emails should exist
      console.log('\n📄 Checking CSV data for reference...')
      const fs = await import('fs')
      try {
        const csvData = fs.readFileSync('src/data/user_contacts_clean.csv', 'utf-8')
        const lines = csvData.split('\n').slice(0, 6) // First few lines
        console.log('Sample CSV emails:')
        lines.forEach(line => console.log(`  ${line}`))
      } catch (err) {
        console.log('Could not read CSV file')
      }

      return
    }

    console.log('\n👥 Real Users Found:')
    console.log('==================')

    for (const user of realUsers.slice(0, 10)) { // Show first 10
      console.log(`Email: ${user.email}`)
      console.log(`User ID: ${user.id}`)
      console.log(`Created: ${user.created_at}`)
      console.log(`Last Sign In: ${user.last_sign_in_at || 'Never'}`)

      // Check app access
      const { data: access } = await supabase
        .from('user_app_access')
        .select('app_slug')
        .eq('user_id', user.id)
        .eq('is_active', true)

      if (access && access.length > 0) {
        console.log(`✅ Has App Access: ${access.map(a => a.app_slug).join(', ')}`)
      } else {
        console.log(`❌ No App Access`)
      }

      // Check purchases
      const { data: purchases } = await supabase
        .from('purchases')
        .select('product_name')
        .eq('user_id', user.id)

      if (purchases && purchases.length > 0) {
        console.log(`💳 Has Purchases: ${purchases.map(p => p.product_name).join(', ')}`)
      } else {
        console.log(`💳 No Purchases`)
      }

      console.log('----------------')
    }

    // Find the first user with app access to recommend for testing
    for (const user of realUsers) {
      const { data: access } = await supabase
        .from('user_app_access')
        .select('app_slug')
        .eq('user_id', user.id)
        .eq('is_active', true)

      if (access && access.length > 0) {
        console.log('\n🎯 RECOMMENDED TEST USER:')
        console.log('========================')
        console.log(`Email: ${user.email}`)
        console.log(`User ID: ${user.id}`)
        console.log(`App Access: ${access.map(a => a.app_slug).join(', ')}`)
        console.log('========================')
        console.log('\n⚠️  Note: Password is unknown (randomly generated during import)')
        console.log('💡 You may need to use "Forgot Password" to reset it')
        break
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

findImportedUsers()