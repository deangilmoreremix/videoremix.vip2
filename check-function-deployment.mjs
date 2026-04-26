import dotenv from 'dotenv'

dotenv.config()

async function checkDeployedFunctionCode() {
  console.log('🔍 Checking if Deployed Functions Have Latest Changes\n')

  // Test the change-user-password function to see if it has pagination
  // We'll send a request that would require pagination to work

  const testEmail = 'nonexistent-user-test@example.com' // This should trigger the full user search

  console.log('Testing change-user-password with pagination requirement...')

  const startTime = Date.now()

  const response = await fetch(`${process.env.VITE_SUPABASE_URL}/functions/v1/change-user-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.VITE_SUPABASE_ANON_KEY}`
    },
    body: JSON.stringify({
      email: testEmail,
      newPassword: 'Test123!'
    })
  })

  const endTime = Date.now()
  const duration = endTime - startTime

  console.log(`Response time: ${duration}ms`)

  const result = await response.json()

  if (response.ok && result.success) {
    console.log('✅ Function responded successfully')
    console.log('   This suggests pagination is working (found user or handled gracefully)')

    // If it took a while, it might have been searching through pages
    if (duration > 2000) {
      console.log('   ⚠️  Slow response time suggests it searched multiple pages')
    } else {
      console.log('   ✅ Fast response suggests user was found quickly')
    }
  } else {
    console.log('❌ Function failed:', result.error)
  }

  // Test admin-users function pagination
  console.log('\nTesting admin-users function...')

  // This will fail with auth, but we can check if it exists
  const adminResponse = await fetch(`${process.env.VITE_SUPABASE_URL}/functions/v1/admin-users`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.VITE_SUPABASE_ANON_KEY}`
    }
  })

  console.log(`Admin users status: ${adminResponse.status}`)

  if (adminResponse.status === 401) {
    console.log('✅ Admin function exists (returning auth required)')
  } else if (adminResponse.status === 404) {
    console.log('❌ Admin function not found')
  } else {
    console.log(`⚠️  Unexpected status: ${adminResponse.status}`)
  }

  console.log('\n🎯 Deployment Check Summary:')
  console.log('Based on function responses, they appear to be deployed')
  console.log('To confirm latest changes, check Supabase Dashboard > Edge Functions')
  console.log('Or redeploy manually through the dashboard if needed')
}

checkDeployedFunctionCode()