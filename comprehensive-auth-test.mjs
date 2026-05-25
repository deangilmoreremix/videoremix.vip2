#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storage: {
        getItem: (key) => {
          console.log(`[Storage] Getting ${key}`)
          const value = localStorage.getItem(key)
          console.log(`[Storage] Got ${key}:`, value ? 'exists' : 'null')
          return value
        },
        setItem: (key, value) => {
          console.log(`[Storage] Setting ${key}`)
          localStorage.setItem(key, value)
        },
        removeItem: (key) => {
          console.log(`[Storage] Removing ${key}`)
          localStorage.removeItem(key)
        }
      },
      storageKey: "videoremix-auth"
    }
  }
)

console.log('🔍 Comprehensive Authentication Test\n')

// Test 1: Check current session
async function testCurrentSession() {
  console.log('1️⃣ Testing current session...')
  const { data: { session }, error } = await supabase.auth.getSession()

  console.log('   Session exists:', !!session)
  if (session) {
    console.log('   User ID:', session.user.id)
    console.log('   Email:', session.user.email)
    console.log('   Expires at:', new Date(session.expires_at * 1000).toISOString())
    console.log('   Time until expiry:', (session.expires_at * 1000 - Date.now()) / 1000, 'seconds')
  }
  if (error) {
    console.log('   Error:', error.message)
  }

  return !!session
}

// Test 2: Check auth state changes
async function testAuthStateChanges() {
  console.log('\n2️⃣ Testing auth state changes...')

  return new Promise((resolve) => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('   Auth event:', event)
      if (session) {
        console.log('   Session user:', session.user.id)
        console.log('   Session expires:', new Date(session.expires_at * 1000).toISOString())
      } else {
        console.log('   No session')
      }

      // Unsubscribe after first event
      setTimeout(() => {
        subscription.unsubscribe()
        resolve()
      }, 1000)
    })
  })
}

// Test 3: Test sign in/out cycle
async function testSignInOut() {
  console.log('\n3️⃣ Testing sign in/out cycle...')

  const testEmail = `auth-test-${Date.now()}@example.com`
  const testPassword = 'TestPass123!'

  try {
    // Sign up
    console.log('   Signing up...')
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        emailConfirm: false
      }
    })

    if (signUpError) {
      console.log('   ❌ Signup failed:', signUpError.message)
      return false
    }

    console.log('   ✅ Signed up:', signUpData.user?.id)

    // Sign in
    console.log('   Signing in...')
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    })

    if (signInError) {
      console.log('   ❌ Sign in failed:', signInError.message)
      return false
    }

    console.log('   ✅ Signed in successfully')

    // Check session persistence
    console.log('   Checking session persistence...')
    await new Promise(resolve => setTimeout(resolve, 2000))

    const { data: { session: persistedSession } } = await supabase.auth.getSession()
    console.log('   Session persisted:', !!persistedSession)

    // Sign out
    console.log('   Signing out...')
    const { error: signOutError } = await supabase.auth.signOut()

    if (signOutError) {
      console.log('   ❌ Sign out failed:', signOutError.message)
      return false
    }

    console.log('   ✅ Signed out successfully')

    // Check session cleared
    const { data: { session: clearedSession } } = await supabase.auth.getSession()
    console.log('   Session cleared:', !clearedSession)

    return true
  } catch (error) {
    console.log('   ❌ Test failed:', error.message)
    return false
  }
}

// Test 4: Test session refresh
async function testSessionRefresh() {
  console.log('\n4️⃣ Testing session refresh...')

  const testEmail = `refresh-test-${Date.now()}@example.com`
  const testPassword = 'TestPass123!'

  try {
    // Quick sign in
    const { data: signInData } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    })

    if (!signInData.session) {
      // Try to create user first
      await supabase.auth.signUp({
        email: testEmail,
        password: testPassword,
        options: { emailConfirm: false }
      })

      const { data: retrySignIn } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword
      })

      if (!retrySignIn.session) {
        console.log('   ❌ Could not establish session')
        return false
      }
    }

    const originalExpiry = signInData.session?.expires_at
    console.log('   Original expiry:', new Date(originalExpiry * 1000).toISOString())

    // Refresh session
    const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()

    if (refreshError) {
      console.log('   ❌ Refresh failed:', refreshError.message)
      return false
    }

    const newExpiry = refreshData.session?.expires_at
    console.log('   New expiry:', new Date(newExpiry * 1000).toISOString())
    console.log('   Refresh successful:', originalExpiry !== newExpiry)

    await supabase.auth.signOut()
    return true
  } catch (error) {
    console.log('   ❌ Refresh test failed:', error.message)
    return false
  }
}

// Test 5: Test storage persistence
async function testStoragePersistence() {
  console.log('\n5️⃣ Testing storage persistence...')

  try {
    // Check if storage is available
    const testKey = 'test-storage-key'
    const testValue = 'test-value-' + Date.now()

    localStorage.setItem(testKey, testValue)
    const retrieved = localStorage.getItem(testKey)

    console.log('   Storage available:', retrieved === testValue)

    localStorage.removeItem(testKey)

    // Check current auth storage
    const authKeys = Object.keys(localStorage).filter(key => key.includes('auth') || key.includes('videoremix'))
    console.log('   Auth storage keys:', authKeys.length)

    authKeys.forEach(key => {
      const value = localStorage.getItem(key)
      console.log(`   ${key}: ${value ? 'present' : 'empty'}`)
    })

    return true
  } catch (error) {
    console.log('   ❌ Storage test failed:', error.message)
    return false
  }
}

// Run all tests
async function runAllTests() {
  const results = {
    currentSession: await testCurrentSession(),
    authStateChanges: await testAuthStateChanges(),
    signInOut: await testSignInOut(),
    sessionRefresh: await testSessionRefresh(),
    storagePersistence: await testStoragePersistence()
  }

  console.log('\n📊 Test Results Summary:')
  Object.entries(results).forEach(([test, passed]) => {
    console.log(`   ${test}: ${passed ? '✅ PASS' : '❌ FAIL'}`)
  })

  const allPassed = Object.values(results).every(Boolean)
  console.log(`\n🏁 Overall: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`)

  if (!allPassed) {
    console.log('\n🔧 Potential Issues:')
    if (!results.storagePersistence) {
      console.log('   - Local storage may be disabled or unavailable')
    }
    if (!results.signInOut) {
      console.log('   - Sign in/out cycle has issues')
    }
    if (!results.sessionRefresh) {
      console.log('   - Session refresh is failing')
    }
    console.log('   - Check browser console for additional error details')
  }

  process.exit(allPassed ? 0 : 1)
}

runDiagnostics()</content>
<parameter name="filePath">comprehensive-auth-test.mjs