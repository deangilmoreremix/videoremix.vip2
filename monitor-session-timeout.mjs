import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

async function monitorSessionTimeout() {
  console.log('⏰ Monitoring Session Timeout Behavior\n')

  // Use the test user
  const testEmail = 'real-test-user-1777125074774@example.com'
  const testPassword = 'TestPass123!'

  console.log(`📧 Testing with user: ${testEmail}`)

  try {
    // Sign in
    console.log('\n🔑 Signing in...')
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    })

    if (signInError) {
      console.log('❌ Sign-in failed:', signInError.message)
      return
    }

    const initialExpiry = signInData.session?.expires_at
    console.log('✅ Signed in successfully')
    console.log('   Initial session expires:', initialExpiry ? new Date(initialExpiry * 1000).toISOString() : 'N/A')
    console.log('   Current time:', new Date().toISOString())

    // Monitor session for 10 minutes
    console.log('\n⏱️  Monitoring session for 10 minutes...')

    const startTime = Date.now()
    const monitoringDuration = 10 * 60 * 1000 // 10 minutes

    while (Date.now() - startTime < monitoringDuration) {
      const { data: { session }, error } = await supabase.auth.getSession()

      if (error) {
        console.log(`❌ Session error at ${new Date().toISOString()}:`, error.message)
        break
      }

      if (!session) {
        console.log(`❌ Session lost at ${new Date().toISOString()}`)
        break
      }

      const now = Date.now()
      const expiresAt = session.expires_at * 1000
      const timeUntilExpiry = expiresAt - now
      const minutesUntilExpiry = Math.round(timeUntilExpiry / (60 * 1000))

      console.log(`${new Date().toISOString()} - Session active, expires in ${minutesUntilExpiry} minutes`)

      // Check if we should refresh (within 5 minutes of expiry)
      if (timeUntilExpiry < 5 * 60 * 1000 && timeUntilExpiry > 0) {
        console.log('🔄 Refreshing session (within 5 minutes of expiry)...')
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()

        if (refreshError) {
          console.log('❌ Refresh failed:', refreshError.message)
        } else {
          console.log('✅ Session refreshed, new expiry:', new Date(refreshData.session?.expires_at * 1000).toISOString())
        }
      }

      // Wait 1 minute before next check
      await new Promise(resolve => setTimeout(resolve, 60 * 1000))
    }

    console.log('\n🏁 Monitoring complete')

    // Final check
    const { data: { session: finalSession }, error: finalError } = await supabase.auth.getSession()
    if (finalSession) {
      console.log('✅ Session still active at end of monitoring')
    } else {
      console.log('❌ Session expired during monitoring')
    }

    // Clean up
    await supabase.auth.signOut()

  } catch (error) {
    console.error('❌ Monitoring failed:', error.message)
  }
}

monitorSessionTimeout()