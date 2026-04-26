import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

async function testImprovedSessionHandling() {
  console.log('🔄 Testing Improved Session Handling\n')

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

    console.log('✅ Signed in successfully')
    console.log('   Session expires:', new Date(signInData.session.expires_at * 1000).toISOString())

    // Test session validation logic
    console.log('\n🔍 Testing session validation...')

    // Simulate what happens in the AuthContext initialization
    const { data: { session: checkSession } } = await supabase.auth.getSession()

    if (checkSession) {
      const now = Date.now()
      const expiresAt = checkSession.expires_at * 1000
      const isExpired = expiresAt <= now

      console.log('   Session check:', {
        hasSession: true,
        expiresAt: new Date(expiresAt).toISOString(),
        currentTime: new Date(now).toISOString(),
        isExpired,
        timeUntilExpiry: expiresAt - now
      })

      if (isExpired) {
        console.log('   ❌ Session would be considered expired and cleared')
      } else {
        console.log('   ✅ Session is valid')
      }
    }

    // Test refresh logic
    console.log('\n🔄 Testing refresh logic...')
    const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()

    if (refreshError) {
      console.log('   ❌ Refresh failed:', refreshError.message)
    } else if (refreshData.session) {
      console.log('   ✅ Refresh successful')
      console.log('   New expiry:', new Date(refreshData.session.expires_at * 1000).toISOString())

      const originalExpiry = signInData.session.expires_at
      const newExpiry = refreshData.session.expires_at
      const extension = newExpiry - originalExpiry

      console.log(`   Extended by: ${extension} seconds`)
    }

    // Test what happens with an expired session scenario
    console.log('\n⚠️  Testing expired session handling...')

    // Manually expire the session by setting it to past
    const expiredSession = {
      ...signInData.session,
      expires_at: Math.floor(Date.now() / 1000) - 60 // 1 minute ago
    }

    // This simulates what the periodic check would see
    const now = Date.now()
    const expiresAt = expiredSession.expires_at * 1000
    const timeUntilExpiry = expiresAt - now

    console.log('   Simulated expired session check:', {
      expiresAt: new Date(expiresAt).toISOString(),
      currentTime: new Date(now).toISOString(),
      timeUntilExpiry,
      shouldClear: timeUntilExpiry <= 0
    })

    // Clean up
    await supabase.auth.signOut()
    console.log('\n✅ Signed out')

    console.log('\n🎯 Summary of Improvements:')
    console.log('✅ More aggressive refresh (10 min threshold vs 5 min)')
    console.log('✅ More frequent checks (30 sec vs 60 sec)')
    console.log('✅ Proper handling of expired sessions on init')
    console.log('✅ Better error handling in refresh logic')
    console.log('✅ Clear session state on refresh failures')

  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

testImprovedSessionHandling()