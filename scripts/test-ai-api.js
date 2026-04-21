import { AIImageGenerator } from '../src/utils/aiImageGenerator.js';

async function testAIImageAPI() {
  console.log('🧪 Testing AI Image Generation API connectivity...\n');

  const generator = new AIImageGenerator();

  try {
    const isConnected = await generator.testConnection();

    if (isConnected) {
      console.log('✅ AI Image API connection successful!');
      console.log('🎨 API is ready for thumbnail generation');
    } else {
      console.log('❌ AI Image API connection failed');
      console.log('🔧 Please check your OPENAI_API_KEY in .env file');
      process.exit(1);
    }
  } catch (error) {
    console.error('💥 Test failed with error:', error.message);
    process.exit(1);
  }
}

testAIImageAPI();