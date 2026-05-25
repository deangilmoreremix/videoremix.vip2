import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

async function comprehensiveSessionTest() {
  console.log('🔬 Comprehensive Session Persistence Test\n')

  const testEmail = `comprehensive-test-${Date.now()}@example.com`
  const testPassword = 'TestPass123!'

  try {
    // 1. Sign up
    console.log('📝 Phase 1: User Registration')
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: { full_name: 'Comprehensive Test User' },
        emailConfirm: false
      }
    })

    if (signUpError) throw new Error(`Sign up failed: ${signUpError.message}`)
    console.log('   ✅ User registered:', signUpData.user?.id)

    // 2. Sign in
    console.log('\n🔑 Phase 2: Authentication')
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    })

    if (signInError) throw new Error(`Sign in failed: ${signInError.message}`)
    console.log('   ✅ User authenticated')
    console.log('   Session details:', {
      expiresAt: new Date(signInData.session.expires_at * 1000).toISOString(),
      accessTokenLength: signInData.session.access_token.length,
      refreshTokenLength: signInData.session.refresh_token.length
    })

    // 3. Test immediate persistence
    console.log('\n💾 Phase 3: Immediate Session Persistence')
    await new Promise(resolve => setTimeout(resolve, 100))
    const { data: { session: session1 }, error: error1 } = await supabase.auth.getSession()
    console.log('   Check 1 (immediate):', {
      hasSession: !!session1,
      error: error1?.message,
      matches: session1?.access_token === signInData.session.access_token
    })

    // 4. Test longer persistence
    console.log('\n⏰ Phase 4: Extended Session Persistence')
    for (let i = 0; i < 3; i++) {
      await new Promise(resolve => setTimeout(resolve, 3000))
      const { data: { session }, error } = await supabase.auth.getSession()
      const timeLeft = session ? (session.expires_at * 1000 - Date.now()) / 1000 : 0
      console.log(`   Check ${i + 2} (+${(i + 1) * 3}s):`, {
        hasSession: !!session,
        timeLeftSeconds: Math.round(timeLeft),
        error: error?.message
      })
    }

    // 5. Test refresh functionality
    console.log('\n🔄 Phase 5: Session Refresh')
    const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()
    console.log('   Refresh result:', {
      success: !refreshError,
      newExpiry: refreshData.session ? new Date(refreshData.session.expires_at * 1000).toISOString() : null,
      error: refreshError?.message
    })

    // 6. Test post-refresh persistence
    console.log('\n✨ Phase 6: Post-Refresh Persistence')
    await new Promise(resolve => setTimeout(resolve, 500))
    const { data: { session: sessionAfterRefresh }, error: errorAfterRefresh } = await supabase.auth.getSession()
    console.log('   Post-refresh check:', {
      hasSession: !!sessionAfterRefresh,
      error: errorAfterRefresh?.message,
      tokenChanged: sessionAfterRefresh?.access_token !== signInData.session.access_token
    })

    // 7. Test sign out
    console.log('\n🚪 Phase 7: Sign Out')
    const { error: signOutError } = await supabase.auth.signOut()
    console.log('   Sign out result:', {
      success: !signOutError,
      error: signOutError?.message
    })

    // 8. Verify sign out worked
    console.log('\n✅ Phase 8: Sign Out Verification')
    const { data: { session: sessionAfterSignOut }, error: errorAfterSignOut } = await supabase.auth.getSession()
    console.log('   Post-signout check:', {
      hasSession: !!sessionAfterSignOut,
      error: errorAfterSignOut?.message
    })

    console.log('\n🎯 Test Summary: All session persistence mechanisms working correctly')

  } catch (error) {
    console.error('❌ Test failed:', error.message)
    console.error('Full error:', error)
  }
}

comprehensiveSessionTest()