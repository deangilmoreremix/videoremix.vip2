#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

console.log('🔍 Authentication Diagnostics\n')

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

async function testBasicAuth() {
  console.log('1️⃣ Testing basic authentication...')

  const testEmail = `diag-test-${Date.now()}@example.com`
  const testPassword = 'TestPass123!'

  try {
    // Test sign up
    console.log('   Testing sign up...')
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: { emailConfirm: false }
    })

    if (signUpError) {
      console.log('   ❌ Sign up failed:', signUpError.message)
      return false
    }

    console.log('   ✅ Sign up successful')

    // Test sign in
    console.log('   Testing sign in...')
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    })

    if (signInError) {
      console.log('   ❌ Sign in failed:', signInError.message)
      console.log('   💡 This suggests email confirmation may be required')
      return false
    }

    console.log('   ✅ Sign in successful')
    console.log('   Session expires:', new Date(signInData.session?.expires_at * 1000).toISOString())

    // Test sign out
    console.log('   Testing sign out...')
    await supabase.auth.signOut()
    console.log('   ✅ Sign out successful')

    return true
  } catch (error) {
    console.log('   ❌ Test failed:', error.message)
    return false
  }
}

async function testSessionPersistence() {
  console.log('\n2️⃣ Testing session persistence...')

  const testEmail = `persist-test-${Date.now()}@example.com`
  const testPassword = 'TestPass123!'

  try {
    // Sign in
    const { data: signInData } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    })

    if (!signInData.session) {
      console.log('   Could not establish session')
      return false
    }

    console.log('   Session established')

    // Wait and check persistence
    await new Promise(resolve => setTimeout(resolve, 2000))

    const { data: { session } } = await supabase.auth.getSession()
    console.log('   Session persisted:', !!session)

    await supabase.auth.signOut()
    return !!session
  } catch (error) {
    console.log('   ❌ Persistence test failed:', error.message)
    return false
  }
}

async function main() {
  const authTest = await testBasicAuth()
  const persistenceTest = await testSessionPersistence()

  console.log('\n📊 Results:')
  console.log('   Basic auth:', authTest ? '✅ PASS' : '❌ FAIL')
  console.log('   Session persistence:', persistenceTest ? '✅ PASS' : '❌ FAIL')

  const allPassed = authTest && persistenceTest
  console.log('\n🏁 Overall:', allPassed ? '✅ ALL TESTS PASSED' : '❌ ISSUES FOUND')

  if (!allPassed) {
    console.log('\n🔧 Common Issues:')
    if (!authTest) {
      console.log('   - Email confirmation may be enabled in Supabase Auth settings')
      console.log('   - Check Supabase dashboard > Authentication > Settings')
    }
    if (!persistenceTest) {
      console.log('   - Session storage may not be working')
      console.log('   - Check browser localStorage availability')
    }
  }

  process.exit(allPassed ? 0 : 1)
}

main()</content>
<parameter name="filePath">comprehensive-auth-test.mjs