/**
 * Comprehensive Feature Test Script
 * Tests all Supabase connections, data fetching, and feature access
 * 
 * Run with: npx tsx test-supabase-features.test.ts
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env' })

// Test configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || ''
const SUPABASE_KEY = process.env.VITE_SUPABASE_KEY || process.env.VITE_SUPABASE_ANON_KEY || ''
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

console.log('='.repeat(60))
console.log('SUPABASE FEATURE TEST SUITE')
console.log('='.repeat(60))
console.log(`Project URL: ${SUPABASE_URL}`)
console.log(`Has Anon Key: ${!!SUPABASE_KEY}`)
console.log(`Has Service Key: ${!!SERVICE_ROLE_KEY}`)
console.log('='.repeat(60))

// Create Supabase clients
const anonClient = createClient(SUPABASE_URL, SUPABASE_KEY)
const adminClient = SERVICE_ROLE_KEY 
  ? createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false } })
  : null

async function runTests() {
  let passed = 0
  let failed = 0

  console.log('\n📋 RUNNING TESTS...\n')

  // Test 1: Supabase Connection
  try {
    const { data, error } = await anonClient.from('apps').select('count').limit(1)
    if (error && error.code !== 'PGRST116') {
      throw new Error(`Connection failed: ${error.message}`)
    }
    console.log('✅ PASS: Supabase Connection')
    passed++
  } catch (error: any) {
    console.log(`❌ FAIL: Supabase Connection - ${error.message}`)
    failed++
  }

  // Test 2: Apps Table Access
  try {
    const { data, error } = await anonClient
      .from('apps')
      .select('id, name, sort_order')
      .order('sort_order', { ascending: true })
      .limit(10)
    
    if (error && error.code !== 'PGRST116') {
      throw new Error(`Cannot read apps: ${error.message}`)
    }
    console.log(`✅ PASS: Apps Table - Read Access (${data?.length || 0} apps found)`)
    passed++
  } catch (error: any) {
    console.log(`❌ FAIL: Apps Table - ${error.message}`)
    failed++
  }

  // Test 3: Cache Validation Query (the fix we applied)
  try {
    const { data, error } = await anonClient
      .from('apps')
      .select('updated_at')
      .order('updated_at', { ascending: false })
      .limit(1)
    
    if (error) {
      throw new Error(`Cache validation failed: ${error.message} (code: ${error.code})`)
    }
    console.log(`✅ PASS: Cache Validation Query - 406 Fix (${data?.length || 0} records)`)
    passed++
  } catch (error: any) {
    console.log(`❌ FAIL: Cache Validation - ${error.message}`)
    failed++
  }

  // Test 4: Hero Content Table
  try {
    const { data, error } = await anonClient
      .from('hero_content')
      .select('*')
      .limit(1)
    
    if (error && error.code !== 'PGRST116') {
      throw new Error(`Cannot read hero_content: ${error.message}`)
    }
    console.log(`✅ PASS: Hero Content Table Access`)
    passed++
  } catch (error: any) {
    console.log(`❌ FAIL: Hero Content - ${error.message}`)
    failed++
  }

  // Test 5: Benefits Features Table
  try {
    const { data, error } = await anonClient
      .from('benefits_features')
      .select('*')
    
    if (error && error.code !== 'PGRST116') {
      throw new Error(`Cannot read benefits_features: ${error.message}`)
    }
    console.log(`✅ PASS: Benefits Features Table (${data?.length || 0} items)`)
    passed++
  } catch (error: any) {
    console.log(`❌ FAIL: Benefits Features - ${error.message}`)
    failed++
  }

  // Test 6: Testimonials Table
  try {
    const { data, error } = await anonClient
      .from('testimonials')
      .select('*')
    
    if (error && error.code !== 'PGRST116') {
      throw new Error(`Cannot read testimonials: ${error.message}`)
    }
    console.log(`✅ PASS: Testimonials Table (${data?.length || 0} items)`)
    passed++
  } catch (error: any) {
    console.log(`❌ FAIL: Testimonials - ${error.message}`)
    failed++
  }

  // Test 7: FAQs Table
  try {
    const { data, error } = await anonClient
      .from('faqs')
      .select('*')
    
    if (error && error.code !== 'PGRST116') {
      throw new Error(`Cannot read faqs: ${error.message}`)
    }
    console.log(`✅ PASS: FAQs Table (${data?.length || 0} items)`)
    passed++
  } catch (error: any) {
    console.log(`❌ FAIL: FAQs - ${error.message}`)
    failed++
  }

  // Test 8: Pricing Plans Table
  try {
    const { data, error } = await anonClient
      .from('pricing_plans')
      .select('*')
    
    if (error && error.code !== 'PGRST116') {
      throw new Error(`Cannot read pricing_plans: ${error.message}`)
    }
    console.log(`✅ PASS: Pricing Plans Table (${data?.length || 0} items)`)
    passed++
  } catch (error: any) {
    console.log(`❌ FAIL: Pricing Plans - ${error.message}`)
    failed++
  }

  // Test 9: Videos Table Access
  try {
    const { data, error } = await anonClient
      .from('videos')
      .select('id, title, status')
      .limit(5)
    
    if (error && error.code !== 'PGRST116') {
      throw new Error(`Cannot read videos: ${error.message}`)
    }
    console.log(`✅ PASS: Videos Table Access (${data?.length || 0} items)`)
    passed++
  } catch (error: any) {
    console.log(`❌ FAIL: Videos - ${error.message}`)
    failed++
  }

  // Test 10: Auth - Get User
  try {
    const { data, error } = await anonClient.auth.getUser()
    if (error) {
      throw new Error(`Auth state check failed: ${error.message}`)
    }
    console.log(`✅ PASS: Auth - Get User State (${data?.user?.email || 'Not logged in'})`)
    passed++
  } catch (error: any) {
    console.log(`❌ FAIL: Auth - ${error.message}`)
    failed++
  }

  // Test 11: Admin Client - Service Role
  if (adminClient) {
    try {
      const { data, error } = await adminClient
        .from('apps')
        .select('id')
        .limit(1)
      
      if (error) {
        throw new Error(`Admin access failed: ${error.message}`)
      }
      console.log(`✅ PASS: Admin Client - Service Role Access`)
      passed++
    } catch (error: any) {
      console.log(`❌ FAIL: Admin Client - ${error.message}`)
      failed++
    }
  } else {
    console.log('⏭️  SKIP: Admin Client - No service role key')
  }

  // Test 12: Purchases Table
  try {
    const { data, error } = await anonClient
      .from('purchases')
      .select('id')
      .limit(1)
    
    if (error && error.code !== 'PGRST116') {
      throw new Error(`Cannot read purchases: ${error.message}`)
    }
    console.log(`✅ PASS: Purchases Table Access`)
    passed++
  } catch (error: any) {
    console.log(`❌ FAIL: Purchases - ${error.message}`)
    failed++
  }

  // Test 13: Subscriptions Table
  try {
    const { data, error } = await anonClient
      .from('subscriptions')
      .select('id')
      .limit(1)
    
    if (error && error.code !== 'PGRST116') {
      throw new Error(`Cannot read subscriptions: ${error.message}`)
    }
    console.log(`✅ PASS: Subscriptions Table Access`)
    passed++
  } catch (error: any) {
    console.log(`❌ FAIL: Subscriptions - ${error.message}`)
    failed++
  }

  // Print Summary
  console.log('\n' + '='.repeat(60))
  console.log('TEST RESULTS SUMMARY')
  console.log('='.repeat(60))
  console.log(`✅ Passed: ${passed}`)
  console.log(`❌ Failed: ${failed}`)
  console.log(`📊 Total: ${passed + failed}`)
  console.log('='.repeat(60))

  // Recommendations
  if (failed > 0) {
    console.log('\n💡 RECOMMENDATIONS:')
    console.log('\n🛠️  To fix RLS issues, run this SQL in Supabase SQL Editor:')
    console.log(`
    -- Enable read access for all users on apps table
    CREATE POLICY "Enable read access for all users" ON apps FOR SELECT TO anon USING (true);
    
    -- Enable read access for authenticated users
    CREATE POLICY "Enable read for authenticated users" ON apps FOR SELECT TO authenticated USING (true);
    
    -- Repeat for other tables that failed
    `)
  } else {
    console.log('\n🎉 All tests passed! No RLS issues detected.')
  }

  return { passed, failed }
}

// Run tests
runTests()
  .then(({ passed, failed }) => {
    process.exit(failed > 0 ? 1 : 0)
  })
  .catch(error => {
    console.error('Test suite error:', error)
    process.exit(1)
  })
