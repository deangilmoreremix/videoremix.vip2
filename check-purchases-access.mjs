import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

// Use service role key to access admin functions
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkPurchasesAndAccess() {
  console.log('💳 Checking Purchases and App Access\n')

  try {
    // Check purchases table
    const { data: purchases, error: purchasesError } = await supabase
      .from('purchases')
      .select(`
        user_id,
        product_name,
        amount,
        status,
        created_at,
        auth.users!inner(email)
      `)
      .limit(10)

    if (!purchasesError && purchases) {
      console.log(`✅ Found ${purchases.length} purchases:`)
      purchases.forEach(purchase => {
        console.log(`  - ${purchase.auth?.users?.email}: ${purchase.product_name} ($${purchase.amount}) - ${purchase.status}`)
      })
    } else {
      console.log('❌ No purchases found or error:', purchasesError?.message)
    }

    // Check user_app_access table
    const { data: access, error: accessError } = await supabase
      .from('user_app_access')
      .select(`
        user_id,
        app_slug,
        is_active,
        created_at,
        auth.users!inner(email)
      `)
      .eq('is_active', true)
      .limit(10)

    if (!accessError && access) {
      console.log(`\n✅ Found ${access.length} active app access records:`)
      access.forEach(record => {
        console.log(`  - ${record.auth?.users?.email}: ${record.app_slug} (${record.is_active ? 'active' : 'inactive'})`)
      })
    } else {
      console.log('\n❌ No active app access found or error:', accessError?.message)
    }

    // If no real data, let's create a test user with app access
    if ((!purchases || purchases.length === 0) && (!access || access.length === 0)) {
      console.log('\n🛠️  No real users with access found. Creating a test user with app access...')

      const testEmail = `real-test-user-${Date.now()}@example.com`
      const testPassword = 'TestPass123!'

      // Create user
      const { data: userData, error: createError } = await supabase.auth.admin.createUser({
        email: testEmail,
        password: testPassword,
        email_confirm: true,
        user_metadata: { full_name: 'Real Test User' }
      })

      if (createError) {
        console.log('❌ Failed to create test user:', createError.message)
        return
      }

      console.log('✅ Created test user:', testEmail)

      // Grant app access
      const { error: accessError } = await supabase
        .from('user_app_access')
        .insert({
          user_id: userData.user.id,
          app_slug: 'personalizer',
          is_active: true,
          tenant_id: '00000000-0000-0000-0000-000000000001'
        })

      if (accessError) {
        console.log('❌ Failed to grant app access:', accessError.message)
      } else {
        console.log('✅ Granted app access to personalizer')

        console.log('\n🎯 TEST USER WITH APP ACCESS:')
        console.log('===========================')
        console.log(`Email: ${testEmail}`)
        console.log(`Password: ${testPassword}`)
        console.log(`User ID: ${userData.user.id}`)
        console.log('Has App Access: personalizer')
        console.log('===========================')
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

checkPurchasesAndAccess()