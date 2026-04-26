import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

async function testSessionPersistence() {
  console.log('🔐 Testing Session Persistence Over Time\n')

  const testEmail = `session-test-${Date.now()}@example.com`
  const testPassword = 'TestPass123!'

  try {
    // 1. Sign up user
    console.log('📝 Step 1: Creating test user...')
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: { full_name: 'Session Test User' },
        emailConfirm: false
      }
    })

    if (signUpError) {
      console.log('   ❌ Sign up failed:', signUpError.message)
      return
    }

    console.log('   ✅ User created:', signUpData.user?.id)

    // 2. Sign in
    console.log('\n🔑 Step 2: Signing in...')
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    })

    if (signInError) {
      console.log('   ❌ Sign in failed:', signInError.message)
      return
    }

    console.log('   ✅ Signed in successfully')
    console.log('   Session expires at:', signInData.session?.expires_at ? new Date(signInData.session.expires_at * 1000).toISOString() : 'N/A')

    // 3. Test session persistence over time
    console.log('\n⏱️  Step 3: Testing session persistence...')

    for (let i = 0; i < 5; i++) {
      await new Promise(resolve => setTimeout(resolve, 2000)) // Wait 2 seconds

      const { data: { session }, error } = await supabase.auth.getSession()

      const now = new Date()
      console.log(`   Check ${i + 1} (${now.toISOString()}):`, {
        hasSession: !!session,
        userId: session?.user?.id,
        expiresAt: session?.expires_at ? new Date(session.expires_at * 1000).toISOString() : null,
        timeUntilExpiry: session?.expires_at ? (session.expires_at * 1000 - now.getTime()) / 1000 : null,
        error: error?.message
      })

      if (!session) {
        console.log('   ❌ Session lost!')
        break
      }
    }

    // 4. Test manual refresh
    console.log('\n🔄 Step 4: Testing manual session refresh...')
    const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()

    console.log('   Refresh result:', {
      success: !refreshError,
      newExpiresAt: refreshData.session?.expires_at ? new Date(refreshData.session.expires_at * 1000).toISOString() : null,
      error: refreshError?.message
    })

    // 5. Clean up
    console.log('\n🧹 Step 5: Cleaning up...')
    await supabase.auth.signOut()
    console.log('   ✅ Signed out')

  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

testSessionPersistence()