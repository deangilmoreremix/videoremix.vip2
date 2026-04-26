import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

async function testNetworkConnectivity() {
  console.log('🌐 Testing Network Connectivity & Supabase Connection\n')

  const tests = [
    {
      name: 'Basic Connectivity',
      test: async () => {
        const start = Date.now()
        const response = await fetch(`${process.env.VITE_SUPABASE_URL}/rest/v1/`, {
          method: 'HEAD',
          headers: {
            'apikey': process.env.VITE_SUPABASE_ANON_KEY
          }
        })
        const duration = Date.now() - start
        return { success: response.ok, status: response.status, duration }
      }
    },
    {
      name: 'Auth Endpoint',
      test: async () => {
        const start = Date.now()
        try {
          const { error } = await supabase.auth.getSession()
          const duration = Date.now() - start
          return { success: !error, error: error?.message, duration }
        } catch (err) {
          return { success: false, error: err.message, duration: Date.now() - start }
        }
      }
    },
    {
      name: 'Database Query',
      test: async () => {
        const start = Date.now()
        try {
          // Try a simple query that should work
          const { data, error } = await supabase.from('profiles').select('count').limit(1)
          const duration = Date.now() - start
          return { success: !error, error: error?.message, duration, hasData: !!data }
        } catch (err) {
          return { success: false, error: err.message, duration: Date.now() - start }
        }
      }
    }
  ]

  for (const test of tests) {
    console.log(`🧪 ${test.name}:`)
    try {
      const result = await test.test()
      if (result.success) {
        console.log(`   ✅ PASSED (${result.duration}ms)`)
        if (result.status) console.log(`      Status: ${result.status}`)
        if (result.hasData !== undefined) console.log(`      Has Data: ${result.hasData}`)
      } else {
        console.log(`   ❌ FAILED (${result.duration}ms)`)
        console.log(`      Error: ${result.error}`)
      }
    } catch (err) {
      console.log(`   ❌ FAILED`)
      console.log(`      Exception: ${err.message}`)
    }
    console.log('')
  }

  // Test auth state change reliability
  console.log('👂 Testing Auth State Change Reliability:')
  let events = []
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    events.push({ event, hasSession: !!session, time: Date.now() })
  })

  // Simulate some auth operations
  console.log('   Simulating auth operations...')

  // Wait for any events
  await new Promise(resolve => setTimeout(resolve, 1000))

  console.log(`   Events received: ${events.length}`)
  events.forEach(event => {
    console.log(`      ${event.event} (${event.hasSession ? 'with session' : 'no session'})`)
  })

  subscription.unsubscribe()
}

testNetworkConnectivity()