import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders, jsonResponse, errorResponse } from '../_shared/utils.ts';

import { createClient } from '@supabase/supabase-js';

// Fetch user's API key from Supabase (user-provided keys)
async function getUserApiKey(user_id, provider) {
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

// Verify JWT token to get user_id
async function verifyUser(req) {
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

import Anthropic from 'npm:anthropic@0.39.0';;

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: userApiKey!,
});

// Types
interface SalesIntelligenceInput {
  competitor: string;
  product: string;
  industry?: string;
  context?: string;
  userId?: string;
}

interface CompetitorProfile {
  companyOverview: {
    name: string;
    founded?: string;
    hq?: string;
    size?: string;
    funding?: string;
  };
  targetMarket: {
    customers: string[];
    industries: string[];
    companySize: string;
  };
  products: {
    offerings: string[];
    pricing: string[];
  };
  recentNews: string[];
  customerSentiment: {
    reviews: string;
    nps?: number;
  };
}

interface SalesIntelligenceResult {
  id: string;
  competitor: string;
  product: string;
  timestamp: string;
  status: 'processing' | 'completed' | 'error';
  competitorProfile?: CompetitorProfile;
  error?: string;
}

// Stage 1: Competitor Research Agent
async function researchCompetitor(competitor: string): Promise<CompetitorProfile> {
  const prompt = `You are a competitive intelligence analyst researching a competitor company.

Research "${competitor}" and provide comprehensive intelligence in the following JSON format:

{
  "companyOverview": {
    "name": "${competitor}",
    "founded": "when founded or 'Unknown'",
    "hq": "headquarters location or 'Unknown'",
    "size": "company size/employee count or 'Unknown'",
    "funding": "funding history or 'Unknown'"
  },
  "targetMarket": {
    "customers": ["array of target customer types"],
    "industries": ["array of target industries"],
    "companySize": "SMB/Mid-market/Enterprise or 'Unknown'"
  },
  "products": {
    "offerings": ["main product offerings"],
    "pricing": ["pricing tiers or 'Unknown'"]
  },
  "recentNews": ["3-5 recent significant news items"],
  "customerSentiment": {
    "reviews": "summary of customer reviews from G2, Capterra, etc.",
    "nps": "NPS score if available or null"
  }
}

Be thorough and cite specific sources where possible. Focus on factual, verifiable information.`;

  const response = await anthropic.messages.create({
    model: 'claude-3-opus-20240229',
    max_tokens: 4000,
    temperature: 0.3,
    system: 'You are a professional competitive intelligence researcher. Always respond with valid JSON.',
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
    // Extract JSON from the response
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    return JSON.parse(jsonMatch[0]) as CompetitorProfile;
  } catch (error) {
    console.error('Failed to parse competitor research response:', content.text);
    throw new Error('Failed to parse competitor research data');
  }
}

// Main handler

  // Verify authentication and get user's API key
  const { user_id } = await verifyUser(req);
  if (!user_id) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }

  // Get user's anthropic API key
  const userApiKey = await getUserApiKey(user_id, 'anthropic');
  if (!userApiKey) {
    return jsonResponse({ 
      error: 'API_KEY_MISSING',
      message: 'Please add your anthropic API key in your profile.',
      provider: 'anthropic'
    }, 403);
  }

  // Parse body
  let body;
  try {
    body = await req.json();
  } catch (e) {
    // body remains undefined for non-JSON requests
  }
Deno.serve(async (req: Request) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { 'Content-Type': 'application/json', ...corsHeaders } });;
  }

  try {
    const input: SalesIntelligenceInput = await req.json();

    // Validate input
    if (!input.competitor || !input.product) {
      return new Response(JSON.stringify({
          error: 'Missing required fields: competitor and product'
        }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } });;
    }

    // Create result record
    const resultId = `salesforce_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = new Date().toISOString();

    const initialResult: SalesIntelligenceResult = {
      id: resultId,
      competitor: input.competitor,
      product: input.product,
      timestamp,
      status: 'processing'
    };

    // Save initial result to database
    const { error: dbError } = await supabase
      .from('ai_agent_runs')
      .insert({
        id: resultId,
        agent_type: 'salesforce_ai',
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

    // Start processing pipeline
    try {
      // Stage 1: Competitor Research
      const competitorProfile = await researchCompetitor(input.competitor);

      // Update result with Stage 1 completion
      const updatedResult: SalesIntelligenceResult = {
        ...initialResult,
        status: 'completed',
        competitorProfile
      };

      // Save completed result
      await supabase
        .from('ai_agent_runs')
        .update({
          output_data: updatedResult,
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', resultId);

      return new Response(JSON.stringify(updatedResult), { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } });;

    } catch (processingError) {
      console.error('Processing error:', processingError);

      const errorResult: SalesIntelligenceResult = {
        ...initialResult,
        status: 'error',
        error: processingError instanceof Error ? processingError.message : 'Unknown processing error'
      };

      // Save error result
      await supabase
        .from('ai_agent_runs')
        .update({
          output_data: errorResult,
          status: 'error',
          updated_at: new Date().toISOString()
        })
        .eq('id', resultId);

      return new Response(JSON.stringify(errorResult), { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } });;
    }

  } catch (error) {
    console.error('Handler error:', error);
    return new Response(JSON.stringify({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }), { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } });;
  }
}</content>
<parameter name="filePath">netlify/functions/salesforce-ai.ts