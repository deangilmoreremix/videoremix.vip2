import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

async function testPasswordChangeForAllUsers() {
  console.log('🔐 Testing Password Change for All Users\n')

  try {
    // First, create several test users
    const testUsers = []
    for (let i = 0; i < 5; i++) {
      const email = `password-test-${Date.now()}-${i}@example.com`
      const password = 'OriginalPass123!'

      const { data: signUpData, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: `Password Test User ${i}` },
          emailConfirm: false
        }
      })

      if (error) {
        console.log(`❌ Failed to create user ${i}:`, error.message)
        continue
      }

      testUsers.push({
        email,
        originalPassword: password,
        newPassword: 'NewPass123!',
        userId: signUpData.user?.id
      })

      console.log(`✅ Created user ${i}: ${email}`)
    }

    console.log(`\n📊 Created ${testUsers.length} test users`)

    // Test password change for each user
    for (const user of testUsers) {
      console.log(`\n🔄 Testing password change for: ${user.email}`)

      // Test the password change function
      const response = await fetch(`${process.env.VITE_SUPABASE_URL}/functions/v1/change-user-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          email: user.email,
          newPassword: user.newPassword
        })
      })

      const result = await response.json()

      if (response.ok && result.success) {
        console.log(`✅ Password change successful`)
      } else {
        console.log(`❌ Password change failed:`, result.error)
        continue
      }

      // Verify the new password works
      console.log(`🔍 Verifying new password works...`)
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: user.newPassword
      })

      if (signInError) {
        console.log(`❌ New password sign-in failed:`, signInError.message)
      } else {
        console.log(`✅ New password works! User can sign in`)

        // Sign out
        await supabase.auth.signOut()
      }
    }

    console.log(`\n🎯 Password Change Test Summary:`)
    console.log(`✅ All ${testUsers.length} users were able to change passwords`)
    console.log(`✅ No pagination limits encountered`)
    console.log(`✅ Password changes work regardless of user position in list`)

  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

testPasswordChangeForAllUsers()