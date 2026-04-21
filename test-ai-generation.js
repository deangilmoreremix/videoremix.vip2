import { readFileSync } from 'fs';

// Load environment variables FIRST
const env = readFileSync('./.env', 'utf-8');
const envVars = {};
env.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    const trimmedKey = key.trim();
    const trimmedValue = value.trim();
    if (trimmedKey && trimmedValue) {
      envVars[trimmedKey] = trimmedValue;
    }
  }
});

// Set environment variables BEFORE importing
process.env.OPENAI_API_KEY = envVars.OPENAI_API_KEY;
process.env.VITE_SUPABASE_URL = envVars.VITE_SUPABASE_URL;
process.env.VITE_SUPABASE_ANON_KEY = envVars.VITE_SUPABASE_ANON_KEY;
process.env.SUPABASE_SERVICE_ROLE_KEY = envVars.SUPABASE_SERVICE_ROLE_KEY;

// Now import the generator
import { AIImageGenerator } from './src/utils/aiImageGenerator.js';

async function testGeneration() {
  console.log('🧪 Testing AI image generation...\n');

  console.log('🔧 Environment loaded:');
  console.log('- OpenAI API:', envVars.OPENAI_API_KEY ? '✅ Set' : '❌ Missing');
  console.log('- Supabase URL:', envVars.VITE_SUPABASE_URL ? '✅ Set' : '❌ Missing');
  console.log('- Supabase Key:', envVars.VITE_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing');
  console.log('');

  // Debug: Check process.env values
  console.log('🔍 Process.env values:');
  console.log('- OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? 'Set' : 'Not set');
  console.log('- VITE_SUPABASE_URL:', process.env.VITE_SUPABASE_URL ? 'Set' : 'Not set');
  console.log('- VITE_SUPABASE_ANON_KEY:', process.env.VITE_SUPABASE_ANON_KEY ? 'Set' : 'Not set');
  console.log('');

  const generator = new AIImageGenerator();

  // Test connection first
  console.log('🔗 Testing API connection...');
  const isConnected = await generator.testConnection();
  if (!isConnected) {
    console.log('❌ API connection failed');
    return;
  }
  console.log('✅ API connection successful\n');

  // Test with a simple app
  const testRequest = {
    appId: 'test-video-creator',
    appName: 'Test Video Creator',
    description: 'Create professional videos with AI assistance',
    category: 'video',
    keyFeatures: ['video editing timeline', 'AI text-to-video', 'professional templates'],
    targetSize: { width: 800, height: 600 }
  };

  console.log('🎨 Generating test thumbnail...');
  try {
    const result = await generator.generateAppThumbnail(testRequest);
    console.log('✅ Test successful!');
    console.log('📸 Generated image URL:', result.url);
    console.log('📝 App ID:', result.metadata.appId);
    console.log('🏷️  Category:', result.metadata.category);
  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
}

testGeneration();