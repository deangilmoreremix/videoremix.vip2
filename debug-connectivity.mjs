import dotenv from 'dotenv'

dotenv.config()

async function debugConnectivityIssue() {
  console.log('🔍 Debugging Connectivity Issue\n')

  const baseUrl = process.env.VITE_SUPABASE_URL
  const apiKey = process.env.VITE_SUPABASE_ANON_KEY

  console.log('Base URL:', baseUrl)
  console.log('API Key present:', !!apiKey, '(length:', apiKey?.length, ')')

  // Test the exact failing endpoint
  const testUrl = `${baseUrl}/rest/v1/`
  console.log('\nTesting endpoint:', testUrl)

  try {
    console.log('Making HEAD request...')
    const response = await fetch(testUrl, {
      method: 'HEAD',
      headers: {
        'apikey': apiKey,
        'Authorization': `Bearer ${apiKey}`
      }
    })

    console.log('Response status:', response.status)
    console.log('Response ok:', response.ok)
    console.log('Response headers:', Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      const text = await response.text()
      console.log('Response body:', text)
    }

  } catch (error) {
    console.log('Fetch error:', error.message)
    console.log('Error details:', error)
  }

  // Test with GET instead of HEAD
  try {
    console.log('\nTrying GET request instead...')
    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'apikey': apiKey,
        'Authorization': `Bearer ${apiKey}`
      }
    })

    console.log('GET Response status:', response.status)
    console.log('GET Response ok:', response.ok)

  } catch (error) {
    console.log('GET Fetch error:', error.message)
  }
}

debugConnectivityIssue()