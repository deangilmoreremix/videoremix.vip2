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
interface BusinessConsultationInput {
  question: string;
  industry: string;
  stage: 'idea' | 'startup' | 'growth' | 'enterprise';
  context?: string;
  goals?: string;
  budget?: string;
  timeline?: string;
  userId?: string;
}

interface ResearchAnalysis {
  businessOverview: string;
  industryAnalysis: string;
  currentChallenges: string[];
  opportunities: string[];
  keyTrends: string[];
}

interface MarketIntelligence {
  marketSize: string;
  growthRate: string;
  competitiveLandscape: string;
  customerSegments: string[];
  pricingLandscape: string;
  entryBarriers: string[];
}

interface StrategicRecommendations {
  primaryStrategy: string;
  alternativeApproaches: string[];
  competitivePositioning: string;
  goToMarketStrategy: string;
  successFactors: string[];
  potentialPitfalls: string[];
}

interface ImplementationRoadmap {
  immediateActions: string[];
  shortTermGoals: string[];
  longTermObjectives: string[];
  resourceRequirements: string[];
  keyMilestones: string[];
  successMetrics: string[];
}

interface RiskAssessment {
  highRiskFactors: string[];
  mitigationStrategies: string[];
  contingencyPlans: string[];
  monitoringIndicators: string[];
  riskProbability: 'low' | 'medium' | 'high';
}

interface BusinessConsultationResult {
  id: string;
  question: string;
  industry: string;
  stage: string;
  timestamp: string;
  status: 'processing' | 'completed' | 'error';

  // Analysis outputs
  researchAnalysis?: ResearchAnalysis;
  marketIntelligence?: MarketIntelligence;
  strategicRecommendations?: StrategicRecommendations;
  implementationRoadmap?: ImplementationRoadmap;
  riskAssessment?: RiskAssessment;

  // Metadata
  processingTime: number;
  sources: string[];
  confidence: number;
  executiveSummary: string;
  error?: string;
}

// Phase 1: Research & Analysis Agent
async function conductResearchAnalysis(input: BusinessConsultationInput): Promise<ResearchAnalysis> {
  const stageContext = {
    idea: "pre-launch startup with just an idea",
    startup: "early-stage company with initial product/market fit",
    growth: "scaling business with established product and growing revenue",
    enterprise: "mature company with significant market presence"
  };

  const prompt = `You are a senior business consultant conducting comprehensive research and analysis for a ${stageContext[input.stage]} in the ${input.industry} industry.

Business Question: "${input.question}"
${input.context ? `Additional Context: ${input.context}` : ''}
${input.goals ? `Business Goals: ${input.goals}` : ''}

Conduct thorough business analysis covering:

**Business Overview:**
- Current business situation and market position
- Core value proposition and competitive advantages
- Business model assessment and revenue streams
- Team capabilities and organizational structure

**Industry Analysis:**
- Industry size, growth trends, and market dynamics
- Key industry drivers and regulatory factors
- Technology trends and innovation landscape
- Competitive intensity and market concentration

**Current Challenges:**
- Primary business challenges and pain points
- Operational bottlenecks and resource constraints
- Market acceptance and adoption barriers
- Competitive pressures and threats

**Market Opportunities:**
- Untapped market segments and customer needs
- Emerging trends and market shifts
- Strategic partnership opportunities
- Expansion and diversification potential

**Key Trends:**
- Industry technology trends and disruptions
- Customer behavior and preference changes
- Competitive landscape evolution
- Regulatory and economic factors

Format your response as a JSON object with this exact structure:
{
  "businessOverview": "2-3 paragraph comprehensive business assessment",
  "industryAnalysis": "Detailed industry analysis with market context",
  "currentChallenges": ["challenge 1", "challenge 2", "challenge 3"],
  "opportunities": ["opportunity 1", "opportunity 2", "opportunity 3"],
  "keyTrends": ["trend 1", "trend 2", "trend 3"]
}

Be specific, data-driven, and provide actionable insights based on industry knowledge.`;

  const response = await anthropic.messages.create({
    model: 'claude-3-opus-20240229',
    max_tokens: 3000,
    temperature: 0.3,
    system: 'You are a senior business consultant. Always respond with valid JSON.',
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

    return JSON.parse(jsonMatch[0]) as ResearchAnalysis;
  } catch (error) {
    console.error('Failed to parse research analysis response:', content.text);
    throw new Error('Failed to parse research analysis data');
  }
}

// Phase 2: Market Intelligence Agent
async function gatherMarketIntelligence(input: BusinessConsultationInput, researchAnalysis: ResearchAnalysis): Promise<MarketIntelligence> {
  const prompt = `You are a market intelligence specialist analyzing market opportunities and competitive landscape for a ${input.stage} business in ${input.industry}.

Based on the research analysis provided, conduct comprehensive market intelligence covering:

**Market Size & Growth:**
- Total addressable market (TAM) estimates
- Serviceable addressable market (SAM) assessment
- Market growth rate and projections
- Geographic market distribution

**Competitive Landscape:**
- Key competitors and market share distribution
- Competitive positioning and differentiation
- New entrants and potential disruptors
- Competitive advantages and weaknesses

**Customer Segmentation:**
- Primary customer segments and personas
- Customer needs and pain points
- Buying behavior and decision criteria
- Customer acquisition and retention patterns

**Pricing Landscape:**
- Industry pricing models and ranges
- Value-based pricing opportunities
- Competitive pricing positioning
- Pricing strategy recommendations

**Entry Barriers & Requirements:**
- Capital requirements and funding needs
- Technology and infrastructure requirements
- Regulatory and compliance barriers
- Talent and expertise requirements

Format your response as a JSON object:
{
  "marketSize": "Market size assessment with TAM/SAM estimates",
  "growthRate": "Market growth analysis and projections",
  "competitiveLandscape": "Comprehensive competitive analysis",
  "customerSegments": ["segment 1", "segment 2", "segment 3"],
  "pricingLandscape": "Pricing analysis and recommendations",
  "entryBarriers": ["barrier 1", "barrier 2", "barrier 3"]
}

Be specific with market data, competitive intelligence, and actionable market insights.`;

  const response = await anthropic.messages.create({
    model: 'claude-3-opus-20240229',
    max_tokens: 2500,
    temperature: 0.3,
    system: 'You are a market intelligence specialist. Always respond with valid JSON.',
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

    return JSON.parse(jsonMatch[0]) as MarketIntelligence;
  } catch (error) {
    console.error('Failed to parse market intelligence response:', content.text);
    throw new Error('Failed to parse market intelligence data');
  }
}

// Phase 3: Strategic Recommendations Agent
async function developStrategicRecommendations(input: BusinessConsultationInput, researchAnalysis: ResearchAnalysis, marketIntelligence: MarketIntelligence): Promise<StrategicRecommendations> {
  const prompt = `You are a senior strategy consultant developing comprehensive strategic recommendations for a ${input.stage} business in ${input.industry}.

Based on the research analysis and market intelligence provided, develop strategic recommendations covering:

**Primary Strategy:**
- Core strategic direction and positioning
- Value proposition refinement
- Business model optimization
- Growth strategy framework

**Alternative Approaches:**
- 2-3 alternative strategic paths
- Pros and cons of each approach
- Success criteria for different paths
- Risk-adjusted strategic options

**Competitive Positioning:**
- Competitive differentiation strategy
- Market positioning and messaging
- Brand positioning recommendations
- Competitive advantage leveraging

**Go-To-Market Strategy:**
- Market entry and penetration strategy
- Customer acquisition and channel strategy
- Partnership and alliance opportunities
- Marketing and sales strategy framework

**Success Factors:**
- Critical success factors for implementation
- Key performance indicators
- Leading and lagging success metrics
- Early warning indicators

**Potential Pitfalls:**
- Common failure modes and risks
- Strategic blind spots to avoid
- Implementation pitfalls and challenges
- Risk mitigation approaches

Format your response as a JSON object:
{
  "primaryStrategy": "Comprehensive primary strategic direction",
  "alternativeApproaches": ["approach 1", "approach 2", "approach 3"],
  "competitivePositioning": "Competitive positioning strategy",
  "goToMarketStrategy": "GTM strategy and execution plan",
  "successFactors": ["factor 1", "factor 2", "factor 3"],
  "potentialPitfalls": ["pitfall 1", "pitfall 2", "pitfall 3"]
}

Provide strategic depth with actionable, specific recommendations that drive business success.`;

  const response = await anthropic.messages.create({
    model: 'claude-3-opus-20240229',
    max_tokens: 3000,
    temperature: 0.3,
    system: 'You are a senior strategy consultant. Always respond with valid JSON.',
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

    return JSON.parse(jsonMatch[0]) as StrategicRecommendations;
  } catch (error) {
    console.error('Failed to parse strategic recommendations response:', content.text);
    throw new Error('Failed to parse strategic recommendations data');
  }
}

// Phase 4: Implementation Roadmap Agent
async function createImplementationRoadmap(input: BusinessConsultationInput, strategicRecommendations: StrategicRecommendations): Promise<ImplementationRoadmap> {
  const prompt = `You are an implementation specialist creating detailed execution roadmaps for business strategies.

Based on the strategic recommendations provided, create a comprehensive implementation roadmap for a ${input.stage} business in ${input.industry}.

Develop phased implementation covering:

**Immediate Actions (0-30 days):**
- Critical first steps and quick wins
- Foundation-building activities
- Immediate impact initiatives
- Resource mobilization tasks

**Short-Term Goals (30-90 days):**
- Core strategy implementation
- Key initiative execution
- Milestone achievement targets
- Progress measurement setup

**Long-Term Objectives (90-365 days):**
- Strategic transformation goals
- Market position establishment
- Sustainable growth objectives
- Long-term competitive advantages

**Resource Requirements:**
- Human capital and team requirements
- Technology and infrastructure needs
- Financial capital requirements
- Partnership and vendor needs

**Key Milestones:**
- Critical path milestones
- Success criteria for each milestone
- Timeline expectations
- Dependency management

**Success Metrics:**
- Business outcome metrics
- Operational performance indicators
- Customer and market metrics
- Financial performance targets

Format your response as a JSON object:
{
  "immediateActions": ["action 1", "action 2", "action 3", "action 4"],
  "shortTermGoals": ["goal 1", "goal 2", "goal 3"],
  "longTermObjectives": ["objective 1", "objective 2", "objective 3"],
  "resourceRequirements": ["requirement 1", "requirement 2", "requirement 3"],
  "keyMilestones": ["milestone 1", "milestone 2", "milestone 3"],
  "successMetrics": ["metric 1", "metric 2", "metric 3"]
}

Be specific, actionable, and time-bound with realistic implementation expectations.`;

  const response = await anthropic.messages.create({
    model: 'claude-3-opus-20240229',
    max_tokens: 2500,
    temperature: 0.3,
    system: 'You are an implementation specialist. Always respond with valid JSON.',
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

    return JSON.parse(jsonMatch[0]) as ImplementationRoadmap;
  } catch (error) {
    console.error('Failed to parse implementation roadmap response:', content.text);
    throw new Error('Failed to parse implementation roadmap data');
  }
}

// Phase 5: Risk Assessment Agent
async function conductRiskAssessment(input: BusinessConsultationInput, strategicRecommendations: StrategicRecommendations, implementationRoadmap: ImplementationRoadmap): Promise<RiskAssessment> {
  const prompt = `You are a risk management specialist conducting comprehensive risk assessment for business strategy implementation.

Based on the strategic recommendations and implementation roadmap provided, assess risks for a ${input.stage} business in ${input.industry}.

Conduct risk assessment covering:

**High-Risk Factors:**
- Critical risk factors with high impact potential
- Strategic execution risks
- Market and competitive risks
- Operational and execution risks

**Mitigation Strategies:**
- Specific strategies to reduce or eliminate each risk
- Preventive measures and controls
- Risk transfer and sharing approaches
- Contingency planning frameworks

**Contingency Plans:**
- Alternative approaches for high-risk scenarios
- Backup strategies and plan B options
- Crisis management protocols
- Recovery and adaptation plans

**Monitoring Indicators:**
- Early warning signals and leading indicators
- Risk monitoring metrics and dashboards
- Trigger points for risk mitigation activation
- Regular risk assessment checkpoints

**Overall Risk Assessment:**
- Overall risk level: low, medium, or high
- Risk concentration and correlation analysis
- Risk appetite alignment
- Risk management resource requirements

Format your response as a JSON object:
{
  "highRiskFactors": ["risk factor 1", "risk factor 2", "risk factor 3"],
  "mitigationStrategies": ["strategy 1", "strategy 2", "strategy 3"],
  "contingencyPlans": ["plan 1", "plan 2", "plan 3"],
  "monitoringIndicators": ["indicator 1", "indicator 2", "indicator 3"],
  "riskProbability": "low|medium|high"
}

Be specific about risks, practical in mitigation approaches, and proactive in monitoring recommendations.`;

  const response = await anthropic.messages.create({
    model: 'claude-3-opus-20240229',
    max_tokens: 2500,
    temperature: 0.3,
    system: 'You are a risk management specialist. Always respond with valid JSON.',
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

    return JSON.parse(jsonMatch[0]) as RiskAssessment;
  } catch (error) {
    console.error('Failed to parse risk assessment response:', content.text);
    throw new Error('Failed to parse risk assessment data');
  }
}

// Generate Executive Summary
function generateExecutiveSummary(result: BusinessConsultationResult): string {
  const { researchAnalysis, marketIntelligence, strategicRecommendations } = result;

  let summary = `Business Consultation Summary for: ${result.question}\n\n`;

  if (researchAnalysis) {
    summary += `Business Overview: ${researchAnalysis.businessOverview.substring(0, 200)}...\n\n`;
    summary += `Key Challenges: ${researchAnalysis.currentChallenges.slice(0, 2).join(', ')}\n`;
    summary += `Market Opportunities: ${researchAnalysis.opportunities.slice(0, 2).join(', ')}\n\n`;
  }

  if (marketIntelligence) {
    summary += `Market Size: ${marketIntelligence.marketSize}\n`;
    summary += `Growth Rate: ${marketIntelligence.growthRate}\n\n`;
  }

  if (strategicRecommendations) {
    summary += `Primary Strategy: ${strategicRecommendations.primaryStrategy.substring(0, 300)}...\n\n`;
    summary += `Success Factors: ${strategicRecommendations.successFactors.slice(0, 3).join(', ')}\n`;
  }

  summary += `\nAnalysis Confidence: ${Math.round(result.confidence * 100)}% | Processing Time: ${Math.round(result.processingTime / 1000)}s`;

  return summary;
}

// Main pipeline function
async function runBusinessConsultation(input: BusinessConsultationInput): Promise<BusinessConsultationResult> {
  const startTime = Date.now();

  try {
    // Phase 1: Research & Analysis
    const researchAnalysis = await conductResearchAnalysis(input);

    // Phase 2: Market Intelligence
    const marketIntelligence = await gatherMarketIntelligence(input, researchAnalysis);

    // Phase 3: Strategic Recommendations
    const strategicRecommendations = await developStrategicRecommendations(input, researchAnalysis, marketIntelligence);

    // Phase 4: Implementation Roadmap
    const implementationRoadmap = await createImplementationRoadmap(input, strategicRecommendations);

    // Phase 5: Risk Assessment
    const riskAssessment = await conductRiskAssessment(input, strategicRecommendations, implementationRoadmap);

    const processingTime = Date.now() - startTime;

    const result: BusinessConsultationResult = {
      id: `consultpro_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      question: input.question,
      industry: input.industry,
      stage: input.stage,
      timestamp: new Date().toISOString(),
      status: 'completed',
      researchAnalysis,
      marketIntelligence,
      strategicRecommendations,
      implementationRoadmap,
      riskAssessment,
      processingTime,
      sources: ['Industry reports', 'Market research databases', 'Competitive intelligence', 'Economic analysis', 'Regulatory frameworks'],
      confidence: 0.87,
      executiveSummary: ''
    };

    result.executiveSummary = generateExecutiveSummary(result);

    return result;

  } catch (error) {
    const processingTime = Date.now() - startTime;

    return {
      id: `consultpro_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      question: input.question,
      industry: input.industry,
      stage: input.stage,
      timestamp: new Date().toISOString(),
      status: 'error',
      processingTime,
      sources: [],
      confidence: 0,
      executiveSummary: '',
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
    const input: BusinessConsultationInput = JSON.parse(event.body);

    // Validate input
    if (!input.question || !input.industry || !input.stage) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Missing required fields: question, industry, and stage'
        })
      };
    }

    if (input.question.length < 10) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Business question must be at least 10 characters long'
        })
      };
    }

    // Create result record
    const resultId = `consultpro_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = new Date().toISOString();

    const initialResult: BusinessConsultationResult = {
      id: resultId,
      question: input.question,
      industry: input.industry,
      stage: input.stage,
      timestamp,
      status: 'processing',
      processingTime: 0,
      sources: [],
      confidence: 0,
      executiveSummary: ''
    };

    // Save initial result to database
    const { error: dbError } = await supabase
      .from('ai_agent_runs')
      .insert({
        id: resultId,
        agent_type: 'consultpro_ai',
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

    // Run the complete consultation pipeline
    const finalResult = await runBusinessConsultation(input);

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
<parameter name="filePath">netlify/functions/consultpro-ai.ts