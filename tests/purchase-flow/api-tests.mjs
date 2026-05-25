// API Tests for Purchase Flow
// Tests backend endpoints and integrations

const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

console.log('🧪 Purchase Flow API Tests\\n');

async function testEndpoint(name, url, options = {}) {
  console.log(`Testing ${name}...`);
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        ...options.headers
      },
      ...options
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log(`✅ ${name}: PASSED`);
      return { success: true, response, result };
    } else {
      console.log(`❌ ${name}: FAILED (${response.status})`);
      console.log(`   Error: ${result.error || result.message}`);
      return { success: false, response, result };
    }
  } catch (error) {
    console.log(`❌ ${name}: ERROR - ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Test Cases
async function runApiTests() {
  const tests = [];
  
  // Test 1: Create checkout session for agent
  tests.push(await testEndpoint(
    'Agent Checkout Session',
    `${SUPABASE_URL}/functions/v1/create-checkout-session`,
    {
      body: JSON.stringify({
        appId: 'ai-reasoning-agent',
        appName: 'AI Reasoning Agent',
        price: 37,
        tier: 'single',
        purchaseType: 'single',
        appCategory: 'agent'
      })
    }
  ));
  
  // Test 2: Create checkout session for core app lifetime
  tests.push(await testEndpoint(
    'Core App Lifetime Checkout',
    `${SUPABASE_URL}/functions/v1/create-checkout-session`,
    {
      body: JSON.stringify({
        appId: 'ai-personalizedcontent',
        appName: 'Smart Content Personalizer',
        price: 297,
        tier: 'lifetime',
        purchaseType: 'lifetime',
        appCategory: 'core'
      })
    }
  ));
  
  // Test 3: Create checkout session for core app whitelabel
  tests.push(await testEndpoint(
    'Core App Whitelabel Checkout',
    `${SUPABASE_URL}/functions/v1/create-checkout-session`,
    {
      body: JSON.stringify({
        appId: 'ai-personalizedcontent',
        appName: 'Smart Content Personalizer',
        price: 997,
        tier: 'whitelabel',
        purchaseType: 'whitelabel',
        appCategory: 'core'
      })
    }
  ));
  
  // Test 4: Create bundle checkout session
  tests.push(await testEndpoint(
    'Bundle Checkout Session',
    `${SUPABASE_URL}/functions/v1/create-checkout-session`,
    {
      body: JSON.stringify({
        appId: 'all-apps-bundle',
        appName: 'All LLM Agent Apps Bundle',
        price: 597,
        tier: 'bundle',
        purchaseType: 'bundle',
        isBundle: true,
        appCategory: 'agent'
      })
    }
  ));
  
  // Test 5: Test AI Reasoning Agent
  tests.push(await testEndpoint(
    'AI Reasoning Agent',
    `${SUPABASE_URL}/functions/v1/ai-reasoning-agent`,
    {
      body: JSON.stringify({
        message: 'Explain what a neural network is in simple terms.',
        history: []
      })
    }
  ));
  
  // Test 6: Test invalid request
  tests.push(await testEndpoint(
    'Invalid Request Handling',
    `${SUPABASE_URL}/functions/v1/create-checkout-session`,
    {
      body: JSON.stringify({
        // Missing required fields
      })
    }
  ));
  
  // Summary
  const passed = tests.filter(t => t.success).length;
  const total = tests.length;
  const passRate = Math.round((passed / total) * 100);
  
  console.log(`\\n📊 API Test Results: ${passed}/${total} passed (${passRate}%)`);
  
  if (passRate >= 80) {
    console.log('🎉 API tests PASSED - Backend is functional!');
  } else {
    console.log('⚠️  API tests FAILED - Backend needs attention');
  }
  
  return passRate >= 80;
}

runApiTests().then(success => {
  process.exit(success ? 0 : 1);
}).catch(console.error);
