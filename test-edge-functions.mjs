import dotenv from 'dotenv'

dotenv.config()

async function testEdgeFunctions() {
  console.log('🧪 Testing Deployed Edge Functions\n')

  const functions = [
    'change-user-password',
    'admin-users',
    'admin-purchases',
    'reset-admin-password'
  ]

  const testUser = 'real-test-user-1777125074774@example.com'

  for (const func of functions) {
    console.log(`\n🔧 Testing ${func}...`)

    try {
      let response
      let requestBody

      switch (func) {
        case 'change-user-password':
          requestBody = {
            email: testUser,
            newPassword: 'TestPassword123!'
          }
          break
        case 'admin-users':
          // This requires admin auth, so it will fail but we can check if endpoint exists
          requestBody = {}
          break
        case 'admin-purchases':
          requestBody = { purchases: [] }
          break
        case 'reset-admin-password':
          requestBody = { emails: [testUser] }
          break
      }

      const url = `${process.env.VITE_SUPABASE_URL}/functions/v1/${func}`

      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify(requestBody)
      })

      console.log(`   Status: ${response.status}`)
      console.log(`   OK: ${response.ok}`)

      if (response.ok) {
        const result = await response.json()
        console.log(`   ✅ Function is deployed and responding`)
        if (result.success !== undefined) {
          console.log(`   Result: ${result.success ? 'Success' : 'Failed'}`)
        }
      } else {
        const error = await response.text()
        console.log(`   Response: ${error}`)
      }

    } catch (error) {
      console.log(`   ❌ Network error: ${error.message}`)
      console.log(`   Function may not be deployed`)
    }
  }

  console.log('\n🎯 Edge Function Test Summary:')
  console.log('If functions return 401/403, they exist but need proper auth')
  console.log('If functions return network errors, they need to be deployed')
  console.log('If functions work, they are properly deployed')
}

testEdgeFunctions()