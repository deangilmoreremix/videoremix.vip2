import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

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

// Mock social media data gathering (in production, integrate with real APIs)
async function gatherSocialData(topic: string, platform: string, timeframe: string): Promise<any[]> {
  // Simulate gathering social media data
  // In production, integrate with Twitter API, LinkedIn API, etc.
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

  // Filter by platform if specified
  if (platform !== 'all') {
    return mockData.filter(item => item.platform === platform);
  }

  return mockData;
}

async function analyzeSocialSentiment(topic: string, socialData: any[], platform: string, timeframe: string): Promise<{
  overall: 'positive' | 'negative' | 'neutral';
  score: number;
  breakdown: { positive: number; negative: number; neutral: number };
}> {
  const sentiments = socialData.map(item => item.sentiment);
  const positive = sentiments.filter(s => s === 'positive').length;
  const negative = sentiments.filter(s => s === 'negative').length;
  const neutral = sentiments.filter(s => s === 'neutral').length;

  const total = sentiments.length;
  const score = (positive - negative) / total; // -1 to 1 scale

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

async function extractInsights(topic: string, socialData: any[]): Promise<{
  trendingTopics: string[];
  keyInsights: string[];
  engagementMetrics: {
    totalMentions: number;
    peakEngagement: string;
    topInfluencers: string[];
  };
}> {
  const prompt = `You are a social media intelligence analyst. Analyze this social media data about "${topic}" and extract key insights.

Social Media Data:
${socialData.map(item => `- ${item.platform}: "${item.content}" (${item.sentiment}, ${item.engagement} engagement)`).join('\n')}

Provide a JSON response with:
1. trendingTopics: Array of 4-6 trending related topics/themes
2. keyInsights: Array of 5-7 key insights from the conversations
3. engagementMetrics: Object with totalMentions, peakEngagement description, and topInfluencers array

Format as JSON:
{
  "trendingTopics": ["topic1", "topic2", "topic3"],
  "keyInsights": ["insight1", "insight2", "insight3"],
  "engagementMetrics": {
    "totalMentions": 25,
    "peakEngagement": "Morning posts get 2x more engagement",
    "topInfluencers": ["influencer1", "influencer2"]
  }
}`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    max_tokens: 2000,
    temperature: 0.3,
    messages: [
      { role: 'system', content: 'You are a social media intelligence analyst. Always respond with valid JSON.' },
      { role: 'user', content: prompt }
    ]
  });

  const content = response.choices[0].message.content;

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

async function generateRecommendations(topic: string, sentiment: any, insights: any): Promise<string[]> {
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

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    max_tokens: 1500,
    temperature: 0.7,
    messages: [
      { role: 'system', content: 'You are a social media strategist. Always respond with valid JSON array.' },
      { role: 'user', content: prompt }
    ]
  });

  const content = response.choices[0].message.content;

  try {
    const recommendations = JSON.parse(content.text);
    return Array.isArray(recommendations) ? recommendations : [];
  } catch (error) {
    console.error('Failed to parse recommendations response:', content.text);
    return [
      'Increase positive content creation',
      'Engage more actively with your community',
      'Focus on trending topics that resonate',
      'Improve response times to comments and messages',
      'Create more interactive and engaging content'
    ];
  }
}

async function runSocialBuzz(input: SocialBuzzInput): Promise<SocialBuzzResult> {
  const startTime = Date.now();

  try {
    // Gather social media data
    const socialData = await gatherSocialData(input.topic, input.platform || 'all', input.timeframe || 'week');

    // Analyze sentiment
    const sentiment = await analyzeSocialSentiment(input.topic, socialData, input.platform || 'all', input.timeframe || 'week');

    // Extract insights
    const insights = await extractInsights(input.topic, socialData);

    // Generate recommendations
    const recommendations = await generateRecommendations(input.topic, sentiment, insights);

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

export async function handler(event: any) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const input: SocialBuzzInput = JSON.parse(event.body);

    if (!input.topic?.trim()) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Topic is required' })
      };
    }

    // Create result record
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
    const { error: dbError } = await supabase
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

    if (dbError) {
      console.error('Database error:', dbError);
    }

    // Run the social media analysis
    const finalResult = await runSocialBuzz(input);

    // Update result in database
    await supabase
      .from('ai_agent_runs')
      .update({
        output_data: finalResult,
        status: finalResult.status,
        updated_at: new Date().toISOString()
      })
      .eq('id', resultId);

    return { statusCode: 200, body: JSON.stringify(finalResult) };

  } catch (error) {
    console.error('Handler error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
}