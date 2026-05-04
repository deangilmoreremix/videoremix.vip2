import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders, jsonResponse, errorResponse, createSupabaseClient } from '../_shared/utils.ts';
import { createOptimizedAnthropicClient } from '../_shared/performance-clients.ts';

// Initialize Supabase
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

// --- Types ---

interface SocialBuzzInput {
  topic: string;
  platform?: 'twitter' | 'linkedin' | 'facebook' | 'all';
  timeframe?: 'day' | 'week' | 'month';
  userId?: string;
}

interface SocialBuzzResult {
  id: string;
  topic: string;
  platform: string;
  timeframe: string;
  timestamp: string;
  status: 'processing' | 'completed' | 'error';
  sentiment: {
    overall: 'positive' | 'negative' | 'neutral';
    score: number;
    breakdown: { positive: number; negative: number; neutral: number };
  };
  trendingTopics: string[];
  keyInsights: string[];
  engagementMetrics: {
    totalMentions: number;
    peakEngagement: string;
    topInfluencers: string[];
  };
  recommendations: string[];
  processingTime: number;
  error?: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Fetch user's API key from Supabase (user-provided keys)
 */
async function getUserApiKey(user_id: string, provider: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('user_api_keys')
    .select('encrypted_api_key')
    .eq('user_id', user_id)
    .eq('provider', provider)
    .single();

  if (error || !data) {
    return null;
  }
  return data.encrypted_api_key;
}

/**
 * Verify JWT token to get user_id
 */
async function verifyUser(req: Request): Promise<{ user_id: string } | null> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.substring(7);
  try {
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) return null;
    return { user_id: user.id };
  } catch (e) {
    console.error('JWT verification failed:', e);
    return null;
  }
}

/**
 * Gather social media data (mock - integrate with real APIs in production)
 */
async function gatherSocialData(topic: string, platform: string, timeframe: string): Promise<any[]> {
  // Mock data - in production, integrate with Twitter API, LinkedIn API, etc.
  const mockData = [
    { platform: 'twitter', content: `Great insights on ${topic}! Really helpful.`, sentiment: 'positive', engagement: 45 },
    { platform: 'linkedin', content: `Interesting discussion about ${topic}. Some concerns about implementation.`, sentiment: 'neutral', engagement: 23 },
    { platform: 'twitter', content: `${topic} is changing everything. Love the new features!`, sentiment: 'positive', engagement: 78 },
    { platform: 'facebook', content: `Not sure about ${topic}. Seems complicated.`, sentiment: 'negative', engagement: 12 },
    { platform: 'linkedin', content: `Excellent analysis of ${topic} trends. Very informative.`, sentiment: 'positive', engagement: 56 },
    { platform: 'twitter', content: `${topic} has huge potential but needs better UX.`, sentiment: 'neutral', engagement: 34 },
    { platform: 'facebook', content: `Finally, ${topic} is getting the attention it deserves!`, sentiment: 'positive', engagement: 67 },
    { platform: 'linkedin', content: `Concerns about ${topic} adoption in enterprise settings.`, sentiment: 'negative', engagement: 28 },
  ];

  if (platform !== 'all') {
    return mockData.filter(item => item.platform === platform);
  }

  return mockData;
}

/**
 * Analyze social sentiment from data
 */
async function analyzeSocialSentiment(topic: string, socialData: any[], platform: string, timeframe: string) {
  const sentiments = socialData.map(item => item.sentiment);
  const positive = sentiments.filter(s => s === 'positive').length;
  const negative = sentiments.filter(s => s === 'negative').length;
  const neutral = sentiments.filter(s => s === 'neutral').length;

  const total = sentiments.length;
  const score = (positive - negative) / total;

  let overall: 'positive' | 'negative' | 'neutral';
  if (score > 0.1) overall = 'positive';
  else if (score < -0.1) overall = 'negative';
  else overall = 'neutral';

  return {
    overall,
    score,
    breakdown: { positive, negative, neutral }
  };
}

/**
 * Extract insights using optimized Anthropic client
 * Profile: social media (high temp for creativity, large context)
 * Cache TTL: 15 minutes (social trends change)
 */
async function extractInsights(topic: string, socialData: any[], anthropic: any, cacheKey: string) {
  const prompt = `You are a social media intelligence analyst. Analyze this social media data about "${topic}" and extract key insights.

Social Media Data:
${socialData.map(item => `- ${item.platform}: "${item.content}" (${item.sentiment}, ${item.engagement} engagement)`).join('\n')}

Provide a JSON response with:
1. trendingTopics: Array of 4-6 trending related topics/themes
2. keyInsights: Array of 5-7 key insights from the conversations
3. engagementMetrics: Object with totalMentions, peakEngagement description, and topInfluencers array

Format as valid JSON only.`;

  const messages = [
    { role: 'system', content: 'You are a social media intelligence analyst. Always respond with valid JSON only.' },
    { role: 'user', content: prompt }
  ];

  // Check cache first for identical queries
  const cached = await anthropic.messages.create(
    messages,
    {
      model: 'claude-3-sonnet-20240229',
      max_tokens: 2000,
      temperature: 0.3,
    },
    { cacheTtl: 900 } // 15 minutes
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const content = (cached as any).content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type');
  }

  try {
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Failed to parse social insights response:', content.text);
    throw new Error('Failed to analyze social insights');
  }
}

/**
 * Generate recommendations using optimized Anthropic client
 * Profile: social media/creative (high temp)
 * Cache TTL: 30 minutes (recommendations less time-sensitive)
 */
async function generateRecommendations(topic: string, sentiment: any, insights: any, anthropic: any) {
  const prompt = `You are a social media strategist. Based on the sentiment analysis and insights about "${topic}", provide 5-7 actionable recommendations for social media strategy.

Sentiment: ${sentiment.overall} (score: ${sentiment.score})
Key Insights: ${insights.keyInsights.slice(0, 3).join(', ')}
Trending Topics: ${insights.trendingTopics.slice(0, 3).join(', ')}

Provide specific, actionable recommendations for:
- Content strategy
- Engagement tactics
- Platform-specific approaches
- Timing and posting strategies
- Community building

Format as a JSON array of strings.`;

  const response = await anthropic.messages.create({
    model: 'claude-3-sonnet-20240229',
    max_tokens: 1500,
    temperature: 0.8,   // Social profile: high creativity
    top_p: 0.95,
    system: 'You are a social media strategist. Always respond with valid JSON array.',
    messages: [{ role: 'user', content: prompt }]
  }, {
    cacheTtl: 1800,     // 30 minutes
  });

  const content = response.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type');
  }

  try {
    const recommendations = JSON.parse(content.text);
    return Array.isArray(recommendations) ? recommendations : [];
  } catch (error) {
    console.error('Failed to parse recommendations response:', content.text);
    // Fallback recommendations
    return [
      'Increase positive content creation',
      'Engage more actively with your community',
      'Focus on trending topics that resonate',
      'Improve response times to comments and messages',
      'Create more interactive and engaging content'
    ];
  }
}

/**
 * Main social buzz analysis pipeline
 */
async function runSocialBuzz(input: SocialBuzzInput, anthropic: any): Promise<SocialBuzzResult> {
  const startTime = Date.now();

  try {
    // Step 1: Gather social data
    const socialData = await gatherSocialData(input.topic, input.platform || 'all', input.timeframe || 'week');

    // Step 2: Analyze sentiment
    const sentiment = await analyzeSocialSentiment(input.topic, socialData, input.platform || 'all', input.timeframe || 'week');

    // Step 3: Extract insights (with caching)
    const insights = await extractInsights(input.topic, socialData, anthropic, `${input.topic}:${input.platform}`);

    // Step 4: Generate recommendations (with caching)
    const recommendations = await generateRecommendations(input.topic, sentiment, insights, anthropic);

    const processingTime = Date.now() - startTime;

    return {
      id: `socialbuzz_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      topic: input.topic,
      platform: input.platform || 'all',
      timeframe: input.timeframe || 'week',
      timestamp: new Date().toISOString(),
      status: 'completed',
      sentiment,
      trendingTopics: insights.trendingTopics,
      keyInsights: insights.keyInsights,
      engagementMetrics: insights.engagementMetrics,
      recommendations,
      processingTime
    };

  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error('SocialBuzz analysis error:', error);

    return {
      id: `socialbuzz_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      topic: input.topic,
      platform: input.platform || 'all',
      timeframe: input.timeframe || 'week',
      timestamp: new Date().toISOString(),
      status: 'error',
      sentiment: { overall: 'neutral', score: 0, breakdown: { positive: 0, negative: 0, neutral: 0 } },
      trendingTopics: [],
      keyInsights: [],
      engagementMetrics: { totalMentions: 0, peakEngagement: '', topInfluencers: [] },
      recommendations: [],
      processingTime,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// ============================================================================
// MAIN REQUEST HANDLER
// ============================================================================

Deno.serve(async (req: Request) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    // Verify authentication
    const { user_id } = await verifyUser(req);
    if (!user_id) {
      return jsonResponse({ error: 'Unauthorized' }, 401);
    }

    // Get user's Anthropic API key
    const userApiKey = await getUserApiKey(user_id, 'anthropic');
    if (!userApiKey) {
      return jsonResponse({
        error: 'API_KEY_MISSING',
        message: 'Please add your Anthropic API key in your profile.',
        provider: 'anthropic'
      }, 403);
    }

    // Parse input
    const input: SocialBuzzInput = await req.json();

    if (!input.topic?.trim()) {
      return jsonResponse({ error: 'Topic is required' }, 400);
    }

    // Create result ID
    const resultId = `socialbuzz_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = new Date().toISOString();

    const initialResult: SocialBuzzResult = {
      id: resultId,
      topic: input.topic,
      platform: input.platform || 'all',
      timeframe: input.timeframe || 'week',
      timestamp,
      status: 'processing',
      sentiment: { overall: 'neutral', score: 0, breakdown: { positive: 0, negative: 0, neutral: 0 } },
      trendingTopics: [],
      keyInsights: [],
      engagementMetrics: { totalMentions: 0, peakEngagement: '', topInfluencers: [] },
      recommendations: [],
      processingTime: 0
    };

    // Save initial result to database
    try {
      await supabase
        .from('ai_agent_runs')
        .insert({
          id: resultId,
          agent_type: 'socialbuzz_ai',
          user_id: input.userId || null,
          input_data: input,
          output_data: initialResult,
          status: 'processing',
          created_at: timestamp
        });
    } catch (dbError) {
      console.error('DB error (non-critical):', dbError);
    }

    // Initialize optimized Anthropic client with social media profile
    // Includes: caching, rate limiting, circuit breaker, retry
    const anthropic = await createOptimizedAnthropicClient(userApiKey);

    // Run the social media analysis
    const finalResult = await runSocialBuzz(input, anthropic);

    // Update result in database
    await supabase
      .from('ai_agent_runs')
      .update({
        output_data: finalResult,
        status: finalResult.status,
        updated_at: new Date().toISOString()
      })
      .eq('id', resultId);

    return jsonResponse(finalResult);

  } catch (error: any) {
    console.error('SocialBuzz handler error:', error);

    // Circuit breaker specific handling
    if (error.name === 'CircuitBreakerOpenError') {
      return jsonResponse({
        error: 'AI service temporarily unavailable',
        retryAfter: Math.ceil(error.retryAfterMs / 1000) + 's',
        code: 'SERVICE_UNAVAILABLE'
      }, 503);
    }

    return jsonResponse({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});
