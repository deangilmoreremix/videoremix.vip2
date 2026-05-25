import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

async function quickSessionTest() {
  console.log('⚡ Quick Session Timeout Test\n')

  // Use the test user
  const testEmail = 'real-test-user-1777125074774@example.com'
  const testPassword = 'TestPass123!'

  try {
    // Sign in
    console.log('🔑 Signing in...')
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    })

    if (signInError) {
      console.log('❌ Sign-in failed:', signInError.message)
      return
    }

    const session = signInData.session
    console.log('✅ Signed in successfully')
    console.log('   Session expires:', session?.expires_at ? new Date(session.expires_at * 1000).toISOString() : 'N/A')
    console.log('   Current time:', new Date().toISOString())

    // Check session expiry calculation
    if (session?.expires_at) {
      const expiresAt = session.expires_at * 1000
      const now = Date.now()
      const timeUntilExpiry = expiresAt - now
      const minutesUntilExpiry = timeUntilExpiry / (60 * 1000)

      console.log(`   Time until expiry: ${minutesUntilExpiry.toFixed(2)} minutes`)
      console.log(`   Refresh threshold: 5 minutes`)

      if (timeUntilExpiry < 5 * 60 * 1000) {
        console.log('⚠️  Session will expire soon - should refresh')
      } else {
        console.log('✅ Session has plenty of time left')
      }
    }

    // Test refresh manually
    console.log('\n🔄 Testing manual refresh...')
    const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()

    if (refreshError) {
      console.log('❌ Refresh failed:', refreshError.message)
    } else {
      const newExpiry = refreshData.session?.expires_at
      console.log('✅ Refresh successful')
      console.log('   New expiry:', newExpiry ? new Date(newExpiry * 1000).toISOString() : 'N/A')

      if (newExpiry && session?.expires_at) {
        const extension = (newExpiry - session.expires_at) / 60 // minutes
        console.log(`   Extended by: ${extension} minutes`)
      }
    }

    // Check what happens if we wait
    console.log('\n⏳ Waiting 30 seconds...')
    await new Promise(resolve => setTimeout(resolve, 30000))

    const { data: { session: checkSession }, error: checkError } = await supabase.auth.getSession()

    if (checkError) {
      console.log('❌ Session check error:', checkError.message)
    } else if (checkSession) {
      console.log('✅ Session still active after 30 seconds')
    } else {
      console.log('❌ Session lost after 30 seconds!')
    }

    // Clean up
    await supabase.auth.signOut()
    console.log('✅ Signed out')

  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

quickSessionTest()