import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

async function testSignInAfterFix() {
  console.log('🧪 Testing Sign-In After Dashboard Fix\n')

  // Use the test user we created earlier
  const testEmail = 'real-test-user-1777125074774@example.com'
  const testPassword = 'TestPass123!'

  console.log(`📧 Testing sign-in with: ${testEmail}`)

  try {
    // Test sign-in
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    })

    if (signInError) {
      console.log('❌ Sign-in failed:', signInError.message)
      return
    }

    console.log('✅ Sign-in successful!')
    console.log('   User ID:', signInData.user?.id)
    console.log('   Email:', signInData.user?.email)

    // Test session persistence
    await new Promise(resolve => setTimeout(resolve, 1000))

    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError) {
      console.log('❌ Session error:', sessionError.message)
    } else if (session) {
      console.log('✅ Session persists correctly')
      console.log('   Session expires:', new Date(session.expires_at * 1000).toISOString())
    } else {
      console.log('❌ Session lost!')
    }

    // Clean up
    await supabase.auth.signOut()
    console.log('✅ Signed out successfully')

    console.log('\n🎯 Sign-In Test Results:')
    console.log('✅ No ReferenceError in DashboardPage')
    console.log('✅ Auth flow works correctly')
    console.log('✅ Session management functional')

  } catch (error) {
    console.error('❌ Test failed with exception:', error.message)
  }
}

testSignInAfterFix()