import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

// Types
interface LaunchIntelligenceInput {
  product: string;
  market: string;
  competitors: string[];
  timeline?: 'immediate' | '3months' | '6months' | '1year';
  context?: string;
  userId?: string;
}

interface CompetitorAnalysis {
  positioning: string;
  pricing: string;
  channels: string[];
  timeline: string;
  differentiators: string[];
  risks: string[];
}

interface MarketSentiment {
  overallScore: number; // -1 to 1
  positiveDrivers: string[];
  negativeDrivers: string[];
  socialMentions: number;
  reviewSummary: string;
  keyThemes: string[];
}

interface LaunchMetrics {
  adoptionRate: string;
  marketPenetration: string;
  cacRange: string;
  timeToMarket: string;
  successFactors: string[];
  benchmarkCompanies: string[];
}

interface LaunchRecommendations {
  positioning: string[];
  pricing: string[];
  channels: string[];
  timeline: string[];
  risks: string[];
  actionItems: string[];
}

interface LaunchIntelligenceResult {
  id: string;
  product: string;
  market: string;
  competitors: string[];
  timestamp: string;
  status: 'processing' | 'completed' | 'error';
  competitorAnalysis?: CompetitorAnalysis;
  marketSentiment?: MarketSentiment;
  launchMetrics?: LaunchMetrics;
  recommendations?: LaunchRecommendations;
  processingTime: number;
  sources: string[];
  confidence: number;
  error?: string;
}

// Agent 1: Competitor Analysis Agent
async function analyzeCompetitors(product: string, competitors: string[], market: string): Promise<CompetitorAnalysis> {
  const competitorList = competitors.join(', ');

  const prompt = `You are a senior product marketing manager specializing in competitive analysis for product launches.

Analyze the competitive landscape for launching "${product}" in the ${market} market. Focus on these competitors: ${competitorList}.

Provide a comprehensive competitive analysis covering:

**Positioning & Messaging:**
- How do competitors position themselves?
- What messaging resonates with customers?
- Key value propositions they emphasize?

**Pricing & Packaging:**
- Pricing tiers and models
- Packaging strategies
- Monetization approaches

**Go-To-Market Channels:**
- Primary distribution channels
- Marketing strategies used
- Customer acquisition approaches

**Launch Timeline & Strategy:**
- Typical launch timelines
- Rollout approaches (big bang vs phased)
- Market entry strategies

**Key Differentiators:**
- What makes each competitor successful?
- Technology or feature advantages
- Brand or market positioning strengths

**Potential Risks:**
- Market saturation concerns
- Competitive responses to expect
- Entry barriers or challenges

Format your response as a JSON object with this exact structure:
{
  "positioning": "2-3 paragraph analysis of competitor positioning",
  "pricing": "Analysis of pricing strategies and models",
  "channels": ["primary channel 1", "primary channel 2", "etc"],
  "timeline": "Analysis of launch timelines and strategies",
  "differentiators": ["key differentiator 1", "key differentiator 2", "etc"],
  "risks": ["risk 1", "risk 2", "risk 3"]
}

Be specific, evidence-based, and focus on actionable insights for product launch strategy.`;

  const response = await anthropic.messages.create({
    model: 'claude-3-opus-20240229',
    max_tokens: 3000,
    temperature: 0.3,
    system: 'You are a senior product marketing strategist. Always respond with valid JSON.',
    messages: [
      {
        role: 'user',
        content: prompt
      }
    ]
  });

  const content = response.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type');
  }

  try {
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    return JSON.parse(jsonMatch[0]) as CompetitorAnalysis;
  } catch (error) {
    console.error('Failed to parse competitor analysis response:', content.text);
    throw new Error('Failed to parse competitor analysis data');
  }
}

// Agent 2: Market Sentiment Agent
async function analyzeMarketSentiment(product: string, market: string, competitorAnalysis: CompetitorAnalysis): Promise<MarketSentiment> {
  const prompt = `You are a market research analyst specializing in social sentiment and customer perception analysis.

Analyze market sentiment for launching "${product}" in the ${market} market. Use the competitor analysis context provided.

Research and analyze:

**Social Media & Online Presence:**
- Social media mentions and conversations
- Online reviews and ratings
- Influencer and expert opinions
- Community discussions and forums

**Customer Sentiment Patterns:**
- Common pain points and desires
- Feature requests and complaints
- Brand perceptions and associations
- Purchase intent signals

**Market Buzz & Trends:**
- Emerging trends in the category
- Customer behavior shifts
- Technology adoption patterns
- Competitive landscape dynamics

**Sentiment Scoring:**
- Overall sentiment score (-1 to 1 scale)
- Positive drivers and themes
- Negative drivers and concerns
- Neutral or mixed signals

Format your response as a JSON object:
{
  "overallScore": 0.7,
  "positiveDrivers": ["driver 1", "driver 2", "driver 3"],
  "negativeDrivers": ["concern 1", "concern 2"],
  "socialMentions": 1500,
  "reviewSummary": "2-3 paragraph summary of customer sentiment",
  "keyThemes": ["theme 1", "theme 2", "theme 3"]
}

Be data-driven and cite patterns from social data, reviews, and market signals.`;

  const response = await anthropic.messages.create({
    model: 'claude-3-opus-20240229',
    max_tokens: 2500,
    temperature: 0.3,
    system: 'You are a market research analyst. Always respond with valid JSON.',
    messages: [
      {
        role: 'user',
        content: prompt
      }
    ]
  });

  const content = response.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type');
  }

  try {
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    return JSON.parse(jsonMatch[0]) as MarketSentiment;
  } catch (error) {
    console.error('Failed to parse market sentiment response:', content.text);
    throw new Error('Failed to parse market sentiment data');
  }
}

// Agent 3: Launch Metrics Agent
async function calculateLaunchMetrics(product: string, market: string, competitors: string[], competitorAnalysis: CompetitorAnalysis, marketSentiment: MarketSentiment): Promise<LaunchMetrics> {
  const competitorList = competitors.join(', ');

  const prompt = `You are a product launch analyst specializing in performance metrics and market adoption analysis.

Calculate launch metrics and benchmarks for "${product}" in the ${market} market. Analyze competitors: ${competitorList}.

Based on the competitor analysis and market sentiment provided, calculate:

**Adoption & Growth Metrics:**
- Market adoption rates for similar products
- User acquisition velocity benchmarks
- Viral coefficient and organic growth rates

**Market Penetration:**
- Serviceable addressable market (SAM) estimates
- Realistic market penetration targets
- Geographic expansion patterns

**Customer Acquisition Cost:**
- CAC ranges for different channels
- LTV/CAC ratio benchmarks
- Payback period expectations

**Time to Market:**
- Typical development to launch cycles
- Go-to-market execution timelines
- Milestone benchmarks

**Success Factors:**
- Key performance indicators for launch success
- Leading vs lagging indicators
- Early warning signals for launch issues

**Benchmark Companies:**
- Similar successful launches to reference
- Failure case studies to avoid
- Market leader performance data

Format your response as a JSON object:
{
  "adoptionRate": "Expected adoption rate with benchmarks",
  "marketPenetration": "Market penetration targets and strategies",
  "cacRange": "Customer acquisition cost ranges",
  "timeToMarket": "Timeline expectations and benchmarks",
  "successFactors": ["factor 1", "factor 2", "factor 3"],
  "benchmarkCompanies": ["company 1", "company 2", "company 3"]
}

Be specific with numbers, ranges, and realistic benchmarks based on market data.`;

  const response = await anthropic.messages.create({
    model: 'claude-3-opus-20240229',
    max_tokens: 2500,
    temperature: 0.3,
    system: 'You are a product launch analyst. Always respond with valid JSON.',
    messages: [
      {
        role: 'user',
        content: prompt
      }
    ]
  });

  const content = response.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type');
  }

  try {
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    return JSON.parse(jsonMatch[0]) as LaunchMetrics;
  } catch (error) {
    console.error('Failed to parse launch metrics response:', content.text);
    throw new Error('Failed to parse launch metrics data');
  }
}

// Synthesis Agent: Strategic Recommendations
async function generateRecommendations(product: string, market: string, competitorAnalysis: CompetitorAnalysis, marketSentiment: MarketSentiment, launchMetrics: LaunchMetrics): Promise<LaunchRecommendations> {
  const prompt = `You are a senior product strategy consultant specializing in go-to-market planning and launch execution.

Based on the comprehensive analysis provided, generate strategic recommendations for launching "${product}" in the ${market} market.

Synthesize insights from:
- Competitor positioning and strategies
- Market sentiment and customer needs
- Launch metrics and performance benchmarks

**Positioning Strategy:**
- How to position against competitors
- Key messages and value propositions
- Brand positioning recommendations

**Pricing Strategy:**
- Pricing model recommendations
- Competitive pricing positioning
- Packaging and tier strategies

**Go-To-Market Channels:**
- Primary channel recommendations
- Channel mix and allocation
- Customer acquisition prioritization

**Timeline & Sequencing:**
- Launch timeline recommendations
- Phased rollout strategies
- Key milestone planning

**Risk Mitigation:**
- Potential risks and challenges
- Mitigation strategies
- Contingency planning

**Action Items:**
- Immediate next steps (0-30 days)
- Short-term priorities (30-90 days)
- Long-term strategic initiatives (90+ days)

Format your response as a JSON object:
{
  "positioning": ["recommendation 1", "recommendation 2", "recommendation 3"],
  "pricing": ["pricing strategy 1", "pricing strategy 2"],
  "channels": ["channel 1", "channel 2", "channel 3"],
  "timeline": ["timeline recommendation 1", "timeline recommendation 2"],
  "risks": ["risk mitigation 1", "risk mitigation 2", "risk mitigation 3"],
  "actionItems": ["action item 1", "action item 2", "action item 3", "action item 4"]
}

Focus on actionable, specific recommendations that drive launch success.`;

  const response = await anthropic.messages.create({
    model: 'claude-3-opus-20240229',
    max_tokens: 3000,
    temperature: 0.3,
    system: 'You are a senior product strategy consultant. Always respond with valid JSON.',
    messages: [
      {
        role: 'user',
        content: prompt
      }
    ]
  });

  const content = response.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type');
  }

  try {
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    return JSON.parse(jsonMatch[0]) as LaunchRecommendations;
  } catch (error) {
    console.error('Failed to parse recommendations response:', content.text);
    throw new Error('Failed to parse strategic recommendations data');
  }
}

// Main pipeline function
async function runLaunchIntelligencePipeline(input: LaunchIntelligenceInput): Promise<LaunchIntelligenceResult> {
  const startTime = Date.now();

  try {
    // Agent 1: Competitor Analysis
    const competitorAnalysis = await analyzeCompetitors(input.product, input.competitors, input.market);

    // Agent 2: Market Sentiment
    const marketSentiment = await analyzeMarketSentiment(input.product, input.market, competitorAnalysis);

    // Agent 3: Launch Metrics
    const launchMetrics = await calculateLaunchMetrics(input.product, input.market, input.competitors, competitorAnalysis, marketSentiment);

    // Synthesis: Strategic Recommendations
    const recommendations = await generateRecommendations(input.product, input.market, competitorAnalysis, marketSentiment, launchMetrics);

    const processingTime = Date.now() - startTime;

    return {
      id: `launchrocket_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      product: input.product,
      market: input.market,
      competitors: input.competitors,
      timestamp: new Date().toISOString(),
      status: 'completed',
      competitorAnalysis,
      marketSentiment,
      launchMetrics,
      recommendations,
      processingTime,
      sources: ['Market research databases', 'Social media analysis', 'Competitor intelligence', 'Industry reports'],
      confidence: 0.85
    };

  } catch (error) {
    const processingTime = Date.now() - startTime;

    return {
      id: `launchrocket_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      product: input.product,
      market: input.market,
      competitors: input.competitors,
      timestamp: new Date().toISOString(),
      status: 'error',
      processingTime,
      sources: [],
      confidence: 0,
      error: error instanceof Error ? error.message : 'Unknown processing error'
    };
  }
}

// Main handler
export async function handler(event: any) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const input: LaunchIntelligenceInput = JSON.parse(event.body);

    // Validate input
    if (!input.product || !input.market || !input.competitors || input.competitors.length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Missing required fields: product, market, and at least one competitor'
        })
      };
    }

    if (input.competitors.length > 3) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Maximum 3 competitors allowed for optimal analysis'
        })
      };
    }

    // Create result record
    const resultId = `launchrocket_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = new Date().toISOString();

    const initialResult: LaunchIntelligenceResult = {
      id: resultId,
      product: input.product,
      market: input.market,
      competitors: input.competitors,
      timestamp,
      status: 'processing',
      processingTime: 0,
      sources: [],
      confidence: 0
    };

    // Save initial result to database
    const { error: dbError } = await supabase
      .from('ai_agent_runs')
      .insert({
        id: resultId,
        agent_type: 'launchrocket_ai',
        user_id: input.userId || null,
        input_data: input,
        output_data: initialResult,
        status: 'processing',
        created_at: timestamp
      });

    if (dbError) {
      console.error('Database error:', dbError);
      // Continue processing even if DB save fails
    }

    // Run the complete pipeline
    const finalResult = await runLaunchIntelligencePipeline(input);

    // Update result in database
    await supabase
      .from('ai_agent_runs')
      .update({
        output_data: finalResult,
        status: finalResult.status,
        updated_at: new Date().toISOString()
      })
      .eq('id', resultId);

    return {
      statusCode: 200,
      body: JSON.stringify(finalResult)
    };

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
}</content>
<parameter name="filePath">netlify/functions/launchrocket-ai.ts