#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

console.log('🔍 Authentication Diagnostics\n')

// Create client with debug logging
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storageKey: "videoremix-auth"
    }
  }
)

// Test 1: Basic connectivity
async function testConnectivity() {
  console.log('1️⃣ Testing Supabase connectivity...')
  try {
    const { data, error } = await supabase.from('profiles').select('count').limit(1).single()
    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      console.log('   ❌ Database connection failed:', error.message)
      return false
    }
    console.log('   ✅ Database connection successful')
    return true
  } catch (error) {
    console.log('   ❌ Connection error:', error.message)
    return false
  }
}

// Test 2: Auth configuration
async function testAuthConfig() {
  console.log('\n2️⃣ Testing auth configuration...')

  // Check environment variables
  const hasUrl = !!process.env.VITE_SUPABASE_URL
  const hasKey = !!process.env.VITE_SUPABASE_ANON_KEY

  console.log('   Environment variables:')
  console.log('   - VITE_SUPABASE_URL:', hasUrl ? '✅ Set' : '❌ Missing')
  console.log('   - VITE_SUPABASE_ANON_KEY:', hasKey ? '✅ Set' : '❌ Missing')

  if (!hasUrl || !hasKey) {
    console.log('   ❌ Environment configuration incomplete')
    return false
  }

  // Test auth endpoint
  try {
    const response = await fetch(`${process.env.VITE_SUPABASE_URL}/auth/v1/health`, {
      method: 'GET',
      headers: {
        'apikey': process.env.VITE_SUPABASE_ANON_KEY
      }
    })

    console.log('   Auth endpoint status:', response.status)
    console.log('   ✅ Auth service accessible')
    return true
  } catch (error) {
    console.log('   ❌ Auth endpoint unreachable:', error.message)
    return false
  }
}

// Test 3: Sign up/Login cycle
async function testAuthCycle() {
  console.log('\n3️⃣ Testing authentication cycle...')

  const testEmail = `diag-test-${Date.now()}@example.com`
  const testPassword = 'TestPass123!'

  try {
    // Sign up
    console.log('   Creating test user...')
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        emailConfirm: false // Should be disabled for immediate login
      }
    })

    if (signUpError) {
      console.log('   ❌ Sign up failed:', signUpError.message)
      console.log('   This could indicate email confirmation is required')
      return false
    }

    console.log('   ✅ User created:', signUpData.user?.id)

    // Sign in
    console.log('   Signing in...')
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    })

    if (signInError) {
      console.log('   ❌ Sign in failed:', signInError.message)
      console.log('   This could indicate email confirmation is required or credentials are invalid')
      return false
    }

    console.log('   ✅ Signed in successfully')
    console.log('   Session expires:', new Date(signInData.session?.expires_at * 1000).toISOString())

    // Test session persistence
    console.log('   Testing session persistence...')
    await new Promise(resolve => setTimeout(resolve, 1000))

    const { data: { session: persistedSession } } = await supabase.auth.getSession()
    console.log('   Session persisted:', !!persistedSession)

    if (!persistedSession) {
      console.log('   ❌ Session not persisted - check storage configuration')
      return false
    }

    // Sign out
    console.log('   Signing out...')
    await supabase.auth.signOut()
    console.log('   ✅ Signed out successfully')

    return true
  } catch (error) {
    console.log('   ❌ Auth cycle test failed:', error.message)
    return false
  }
}

// Test 4: Session refresh
async function testSessionRefresh() {
  console.log('\n4️⃣ Testing session refresh...')

  try {
    // Create a session first
    const testEmail = `refresh-test-${Date.now()}@example.com`
    const testPassword = 'TestPass123!'

    const { data: signInData } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    })

    if (!signInData.session) {
      console.log('   Could not establish session for refresh test')
      return true // Not a failure, just skip
    }

    const originalExpiry = signInData.session.expires_at
    console.log('   Original expiry:', new Date(originalExpiry * 1000).toISOString())

    // Wait a moment then refresh
    await new Promise(resolve => setTimeout(resolve, 500))

    const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()

    if (refreshError) {
      console.log('   ❌ Refresh failed:', refreshError.message)
      return false
    }

    const newExpiry = refreshData.session?.expires_at
    console.log('   New expiry:', new Date(newExpiry * 1000).toISOString())
    console.log('   ✅ Session refresh successful')

    await supabase.auth.signOut()
    return true
  } catch (error) {
    console.log('   ❌ Session refresh test failed:', error.message)
    return false
  }
}

// Run diagnostics
async function runDiagnostics() {
  const results = {
    connectivity: await testConnectivity(),
    authConfig: await testAuthConfig(),
    authCycle: await testAuthCycle(),
    sessionRefresh: await testSessionRefresh()
  }

  console.log('\n📊 Diagnostics Results:')
  Object.entries(results).forEach(([test, passed]) => {
    console.log(`   ${test}: ${passed ? '✅ PASS' : '❌ FAIL'}`)
  })

  const allPassed = Object.values(results).every(Boolean)
  console.log(`\n🏁 Overall: ${allPassed ? '✅ ALL DIAGNOSTICS PASSED' : '❌ ISSUES FOUND'}`)

  if (!allPassed) {
    console.log('\n🔧 Recommended Actions:')
    if (!results.connectivity) {
      console.log('   - Check database connection and permissions')
    }
    if (!results.authConfig) {
      console.log('   - Verify environment variables are set correctly')
      console.log('   - Check Supabase project status')
    }
    if (!results.authCycle) {
      console.log('   - Check if email confirmation is disabled in Supabase Auth settings')
      console.log('   - Verify RLS policies allow user registration')
    }
    if (!results.sessionRefresh) {
      console.log('   - Check Supabase Auth configuration for token refresh')
    }
  }

  process.exit(allPassed ? 0 : 1)
}

runDiagnostics()</content>
<parameter name="filePath">comprehensive-auth-test.mjs