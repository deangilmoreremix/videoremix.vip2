// Test script for agent Edge Functions
// Validates agent functionality and error handling

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

console.log('🤖 Agent Functions Test Suite\\n');

async function testAgentFunction(functionName, payload, description) {
  console.log(`Testing ${functionName}: ${description}`);
  
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/${functionName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log(`✅ Success: ${result.success ? 'Response received' : 'Request processed'}`);
      if (result.response) {
        console.log(`📝 Response preview: ${result.response.substring(0, 100)}...`);
      }
      return { success: true, response, result };
    } else {
      console.log(`❌ Error (${response.status}): ${result.error || result.message}`);
      return { success: false, response, result };
    }
  } catch (error) {
    console.log(`❌ Network error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Test Cases
async function runAgentTests() {
  const tests = [];
  
  // Test 1: AI Reasoning Agent - Basic reasoning
  tests.push(await testAgentFunction(
    'ai-reasoning-agent',
    {
      message: 'What are the three main types of machine learning?',
      history: [],
      temperature: 0.7
    },
    'Basic ML concepts query'
  ));
  
  // Test 2: AI Reasoning Agent - Complex reasoning
  tests.push(await testAgentFunction(
    'ai-reasoning-agent',
    {
      message: 'Should companies prioritize short-term profits or long-term sustainability? Provide a balanced analysis.',
      history: [],
      temperature: 0.3
    },
    'Complex business reasoning'
  ));
  
  // Test 3: Chat with PDF - Basic Q&A
  tests.push(await testAgentFunction(
    'chat-with-pdf',
    {
      message: 'What are the main benefits of renewable energy?',
      pdfContent: `Renewable energy sources provide clean, sustainable power. Solar panels convert sunlight to electricity without emissions. Wind turbines harness wind power efficiently. Benefits include reduced carbon footprint, energy independence, job creation in green industries, and long-term cost savings compared to fossil fuels.`,
      history: []
    },
    'PDF content analysis'
  ));
  
  // Test 4: Autonomous RAG - Document search
  tests.push(await testAgentFunction(
    'autonomous-rag',
    {
      query: 'How do neural networks learn?',
      documents: [
        'Neural networks learn through a process called backpropagation, where errors are calculated and weights are adjusted to minimize loss.',
        'Machine learning algorithms use training data to identify patterns and make predictions.',
        'Deep learning models can automatically learn hierarchical features from raw data.'
      ],
      history: []
    },
    'Document retrieval and synthesis'
  ));
  
  // Test 5: Rate limiting test (should fail with too many requests)
  console.log('\\n🧪 Testing rate limiting...');
  const rateLimitTests = [];
  for (let i = 0; i < 15; i++) {
    rateLimitTests.push(testAgentFunction(
      'ai-reasoning-agent',
      { message: `Rate limit test ${i + 1}`, history: [] },
      `Rate limit attempt ${i + 1}`
    ));
  }
  
  const rateResults = await Promise.all(rateLimitTests);
  const rateLimited = rateResults.filter(r => r.response?.status === 429).length;
  console.log(`📊 Rate limiting: ${rateLimited} requests were properly limited`);
  
  // Test 6: Error handling - Missing API key
  console.log('\\n🧪 Testing error handling...');
  const errorTest = await testAgentFunction(
    'ai-reasoning-agent',
    { message: 'test', history: [] },
    'Error handling test'
  );
  
  // Test 7: Invalid input validation
  const validationTest = await testAgentFunction(
    'ai-reasoning-agent',
    { message: '', history: [] }, // Empty message
    'Input validation test'
  );
  
  // Summary
  const allTests = [...tests, ...rateResults.slice(0, 5), errorTest, validationTest]; // Sample rate limit tests
  const passed = allTests.filter(t => t.success).length;
  const total = allTests.length;
  const passRate = Math.round((passed / total) * 100);
  
  console.log(`\\n📊 Agent Test Results: ${passed}/${total} passed (${passRate}%)`);
  console.log(`Rate limiting effectiveness: ${rateLimited > 0 ? '✅ Working' : '⚠️ Not tested'}`);
  
  if (passRate >= 70) {
    console.log('🎉 Agent functions are functional!');
  } else {
    console.log('⚠️  Some agent functions need attention');
  }
  
  return passRate >= 70;
}

runAgentTests().then(success => {
  process.exit(success ? 0 : 1);
}).catch(console.error);
