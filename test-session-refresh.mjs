import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

async function testSessionRefresh() {
  console.log('🔄 Testing Session Refresh Mechanism\n')

  try {
    // Check current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    console.log('📊 Current Session Status:')
    console.log('  - Has Session:', !!session)
    if (session) {
      console.log('  - User ID:', session.user.id)
      console.log('  - Expires At:', session.expires_at ? new Date(session.expires_at * 1000).toISOString() : 'N/A')
      console.log('  - Access Token Length:', session.access_token.length)
      console.log('  - Refresh Token Length:', session.refresh_token?.length || 0)
    }
    if (sessionError) {
      console.log('  - Session Error:', sessionError.message)
    }

    // Test session refresh
    console.log('\n🔄 Testing Manual Session Refresh:')
    const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()
    console.log('  - Refresh Successful:', !refreshError)
    if (refreshError) {
      console.log('  - Refresh Error:', refreshError.message)
    } else if (refreshData.session) {
      console.log('  - New Expires At:', new Date(refreshData.session.expires_at * 1000).toISOString())
    }

    // Check auth state change listener
    console.log('\n👂 Testing Auth State Change Listener:')
    let stateChanges = []
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      stateChanges.push({ event, hasSession: !!session, timestamp: new Date().toISOString() })
      console.log(`  - Event: ${event}, Has Session: ${!!session}`)
    })

    // Wait a moment to see if any state changes occur
    await new Promise(resolve => setTimeout(resolve, 2000))

    console.log('  - State Changes Detected:', stateChanges.length)
    stateChanges.forEach(change => {
      console.log(`    ${change.timestamp}: ${change.event} (${change.hasSession ? 'authenticated' : 'unauthenticated'})`)
    })

    // Cleanup
    subscription.unsubscribe()

  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

testSessionRefresh()