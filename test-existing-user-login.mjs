import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

async function testExistingUser() {
  console.log('🧪 Testing Existing User Login\n')

  // Test with one of the emails from the CSV
  const testEmail = '3dproducer@gmail.com'
  const testPassword = 'password123' // Default password from import scripts

  console.log(`📧 Testing email: ${testEmail}`)
  console.log(`🔑 Testing password: ${testPassword}\n`)

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    })

    if (error) {
      console.log('❌ Sign in failed:', error.message)

      // Try a few common passwords
      const commonPasswords = ['Password123!', 'password123', '123456', 'admin123']

      for (const pwd of commonPasswords) {
        console.log(`\n🔄 Trying password: ${pwd}`)
        try {
          const { data: pwdData, error: pwdError } = await supabase.auth.signInWithPassword({
            email: testEmail,
            password: pwd
          })

          if (!pwdError && pwdData.user) {
            console.log('✅ SUCCESS! User can sign in with this password')
            console.log('   User ID:', pwdData.user.id)
            console.log('   Email:', pwdData.user.email)
            console.log('   Email confirmed:', !!pwdData.user.email_confirmed_at)
            return
          }
        } catch (err) {
          // Continue trying
        }
      }

      console.log('\n❌ Could not find working password for this user')

    } else {
      console.log('✅ SUCCESS! User signed in successfully')
      console.log('   User ID:', data.user.id)
      console.log('   Email:', data.user.email)
      console.log('   Email confirmed:', !!data.user.email_confirmed_at)
      console.log('   Session expires:', new Date(data.session.expires_at * 1000).toISOString())
    }

  } catch (error) {
    console.log('❌ Exception during sign in:', error.message)
  }
}

testExistingUser()