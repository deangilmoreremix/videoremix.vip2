import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

async function createTestUser() {
  console.log('👤 Creating Test User for Session Persistence Testing\n')

  const testEmail = `test-session-${Date.now()}@example.com`
  const testPassword = 'TestPass123!'

  console.log(`📧 Creating user: ${testEmail}`)
  console.log(`🔑 Password: ${testPassword}\n`)

  try {
    // Sign up the user
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: { full_name: 'Session Test User' },
        emailConfirm: false // Disable email confirmation for testing
      }
    })

    if (signUpError) {
      console.log('❌ Sign up failed:', signUpError.message)
      return null
    }

    console.log('✅ User created successfully!')
    console.log('   User ID:', signUpData.user?.id)
    console.log('   Email confirmed:', !!signUpData.user?.email_confirmed_at)

    // Verify we can sign in immediately
    console.log('\n🔍 Verifying immediate sign-in works...')
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    })

    if (signInError) {
      console.log('❌ Immediate sign-in failed:', signInError.message)
      return null
    }

    console.log('✅ Immediate sign-in successful!')
    console.log('   Session expires:', new Date(signInData.session.expires_at * 1000).toISOString())

    // Sign out to clean up
    await supabase.auth.signOut()
    console.log('✅ Signed out (ready for testing)')

    return {
      email: testEmail,
      password: testPassword,
      userId: signUpData.user.id
    }

  } catch (error) {
    console.log('❌ Exception during user creation:', error.message)
    return null
  }
}

// Create the user and display the credentials
createTestUser().then(user => {
  if (user) {
    console.log('\n🎯 Test User Credentials:')
    console.log('========================')
    console.log(`Email: ${user.email}`)
    console.log(`Password: ${user.password}`)
    console.log(`User ID: ${user.userId}`)
    console.log('========================')
    console.log('\n💡 Use these credentials to test session persistence in the browser!')
  } else {
    console.log('\n❌ Failed to create test user')
  }
})