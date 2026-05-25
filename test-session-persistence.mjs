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
    }
  }
)

console.log('🔍 Session Persistence Test\n')

async function testSessionPersistence() {
  console.log('Testing session persistence and logout prevention...')

  // Test 1: Login
  console.log('\n1️⃣ Testing login...')
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: process.env.TEST_USER_EMAIL || 'test@example.com',
    password: process.env.TEST_USER_PASSWORD || 'password123'
  })

  if (signInError) {
    console.log('   ❌ Login failed:', signInError.message)
    if (signInError.message.includes('Email not confirmed')) {
      console.log('   ℹ️  User needs email confirmation')
      return
    }
    return
  }

  console.log('   ✅ Login successful')
  console.log('   User:', signInData.user?.email)
  console.log('   Expires:', new Date((signInData.session?.expires_at || 0) * 1000).toISOString())

  // Test 2: Check session persistence
  console.log('\n2️⃣ Testing session persistence...')
  await new Promise(resolve => setTimeout(resolve, 2000)) // Wait 2 seconds

  const { data: { session: persistedSession }, error: sessionError } = await supabase.auth.getSession()

  if (sessionError) {
    console.log('   ❌ Session check failed:', sessionError.message)
  } else if (persistedSession) {
    console.log('   ✅ Session persisted')
    console.log('   Still expires:', new Date(persistedSession.expires_at * 1000).toISOString())
  } else {
    console.log('   ❌ Session lost immediately')
  }

  // Test 3: Test refresh
  console.log('\n3️⃣ Testing session refresh...')
  const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()

  if (refreshError) {
    console.log('   ❌ Refresh failed:', refreshError.message)
  } else if (refreshData.session) {
    console.log('   ✅ Refresh successful')
    console.log('   New expiry:', new Date(refreshData.session.expires_at * 1000).toISOString())
  } else {
    console.log('   ❌ Refresh returned no session')
  }

  // Test 4: Test logout
  console.log('\n4️⃣ Testing logout...')
  const { error: signOutError } = await supabase.auth.signOut()

  if (signOutError) {
    console.log('   ❌ Logout failed:', signOutError.message)
  } else {
    console.log('   ✅ Logout successful')
  }

  // Test 5: Verify logout persistence
  console.log('\n5️⃣ Verifying logout...')
  const { data: { session: finalSession } } = await supabase.auth.getSession()

  if (finalSession) {
    console.log('   ❌ Session still exists after logout')
  } else {
    console.log('   ✅ Session properly cleared after logout')
  }
}

testSessionPersistence().catch(console.error)