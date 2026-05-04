import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders, jsonResponse, errorResponse, createSupabaseClient } from '../_shared/utils.ts';
import { createOptimizedOpenAIClient } from '../_shared/performance-clients.ts';

// Initialize Supabase
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Fetch user's API key from Supabase (user-provided keys)
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

// Verify JWT token to get user_id
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

// --- Types ---

interface FinanceInput {
  action: 'getStock' | 'analyze' | 'ask';
  symbol?: string;
  stockData?: any;
  question?: string;
  userId?: string;
}

interface StockInfo {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  name?: string;
  pe?: number;
  marketCap?: number;
  volume?: number;
  historical?: number[];
}

interface AIInsight {
  analysis: string;
  recommendation: 'Buy' | 'Hold' | 'Sell' | 'Neutral';
  confidence: number;
  risks?: string[];
  opportunities?: string[];
}

// --- Demo Stock Data ---
// In production, integrate with real market data API (Alpha Vantage, Finnhub, Yahoo Finance)

const DEMO_STOCKS: Record<string, StockInfo> = {
  'AAPL': {
    symbol: 'AAPL',
    price: 178.45,
    change: 2.34,
    changePercent: 1.33,
    name: 'Apple Inc.',
    pe: 29.4,
    marketCap: 2.8e12,
    volume: 52_000_000,
    historical: [170, 172, 168, 175, 173, 178, 180, 178]
  },
  'GOOGL': {
    symbol: 'GOOGL',
    price: 141.80,
    change: -1.20,
    changePercent: -0.84,
    name: 'Alphabet Inc.',
    pe: 24.1,
    marketCap: 1.78e12,
    volume: 28_000_000,
    historical: [140, 142, 145, 143, 141, 140, 139, 141]
  },
  'TSLA': {
    symbol: 'TSLA',
    price: 248.50,
    change: 5.60,
    changePercent: 2.31,
    name: 'Tesla Inc.',
    pe: 62.3,
    marketCap: 792e9,
    volume: 98_000_000,
    historical: [230, 235, 240, 238, 245, 242, 248, 248]
  },
  'MSFT': {
    symbol: 'MSFT',
    price: 378.20,
    change: 3.15,
    changePercent: 0.84,
    name: 'Microsoft Corporation',
    pe: 35.2,
    marketCap: 2.82e12,
    volume: 22_000_000,
    historical: [370, 375, 372, 378, 376, 380, 378, 378]
  },
  'AMZN': {
    symbol: 'AMZN',
    price: 186.30,
    change: -0.70,
    changePercent: -0.37,
    name: 'Amazon.com Inc.',
    pe: 78.5,
    marketCap: 1.94e12,
    volume: 45_000_000,
    historical: [185, 187, 186, 188, 185, 184, 186, 186]
  },
  'META': {
    symbol: 'META',
    price: 505.50,
    change: 8.20,
    changePercent: 1.65,
    name: 'Meta Platforms Inc.',
    pe: 28.1,
    marketCap: 1.29e12,
    volume: 18_000_000,
    historical: [490, 495, 500, 498, 502, 504, 505, 505]
  },
  'NVDA': {
    symbol: 'NVDA',
    price: 925.80,
    change: 15.40,
    changePercent: 1.69,
    name: 'NVIDIA Corporation',
    pe: 72.4,
    marketCap: 2.28e12,
    volume: 42_000_000,
    historical: [900, 910, 915, 925, 920, 930, 928, 925]
  }
};

async function fetchStockPrice(symbol: string): Promise<StockInfo> {
  const symbolUpper = symbol.toUpperCase();

  if (DEMO_STOCKS[symbolUpper]) {
    const base = DEMO_STOCKS[symbolUpper];
    const variation = (Math.random() - 0.5) * 2; // -1 to +1
    return {
      ...base,
      price: base.price + variation,
      change: base.change + variation * 0.5,
      changePercent: base.changePercent + variation * 0.1,
    };
  }

  // Generate placeholder for unknown symbols
  return {
    symbol: symbolUpper,
    price: 100 + Math.random() * 200,
    change: (Math.random() - 0.5) * 5,
    changePercent: (Math.random() - 0.5) * 3,
    name: symbolUpper,
    historical: Array.from({ length: 30 }, () => 100 + Math.random() * 100)
  };
}

// --- AI Analysis Functions with Performance Optimizations ---

/**
 * Generate AI stock analysis using optimized OpenAI client
 * Profile: financial (low temp, precise, gpt-4o-mini)
 * Cache TTL: 5 minutes (financial data degrades quickly)
 */
async function generateAIAnalysis(symbol: string, stock: StockInfo, openai: any): Promise<AIInsight> {
  const prompt = `You are a professional financial analyst. Analyze this stock data and provide a concise, actionable recommendation.

Stock: ${symbol}
Current Price: $${stock.price.toFixed(2)}
Day Change: ${stock.change >= 0 ? '+' : ''}${stock.changePercent.toFixed(2)}%
P/E Ratio: ${stock.pe || 'N/A'}
Market Cap: ${stock.marketCap ? '$' + (stock.marketCap / 1e9).toFixed(0) + 'B' : 'N/A'}
Volume: ${stock.volume ? stock.volume.toLocaleString() : 'N/A'}

Provide your analysis in this exact JSON format:
{
  "analysis": "2-3 sentence summary of the stock's current situation",
  "recommendation": "Buy" | "Sell" | "Hold" | "Neutral",
  "confidence": 0.XX (between 0.5 and 0.95),
  "risks": ["key risk 1", "key risk 2"],
  "opportunities": ["key opportunity 1", "key opportunity 2"]
}

Base your recommendation on the price movement, P/E ratio (if available), and general market context.
Be conservative with confidence scores (0.6-0.8 range typical).`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a precise financial analyst. Always respond with valid JSON only.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.2,    // Financial profile: low creativity
      max_tokens: 800,     // Concise analysis
      top_p: 0.9,
    }, {
      cacheTtl: 300,       // Cache for 5 minutes
    });

    const content = response.choices[0].message.content;
    const jsonMatch = content?.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error('Invalid JSON response');
    }

    return JSON.parse(jsonMatch[0]) as AIInsight;
  } catch (error) {
    console.error('AI analysis error:', error);
    return {
      analysis: 'Unable to generate AI analysis at this time. Please try again later.',
      recommendation: 'Neutral',
      confidence: 0.5,
      risks: ['Analysis temporarily unavailable'],
      opportunities: []
    };
  }
}

/**
 * Answer user question using optimized OpenAI client
 * Profile: educational (moderate temperature)
 * Cache TTL: 10 minutes (Q&A often repeats)
 */
async function answerQuestion(question: string, symbol: string, stock: StockInfo, openai: any): Promise<string> {
  const context = `Stock: ${symbol} (${stock.name || symbol})\nPrice: $${stock.price.toFixed(2)}\nChange: ${stock.changePercent.toFixed(2)}%\nP/E: ${stock.pe || 'N/A'}`;

  const prompt = `You are a knowledgeable financial advisor. Answer the user's question based on the stock context provided.

Stock Context:
${context}

User Question: ${question}

Provide a clear, helpful answer in 2-3 sentences. Include relevant financial context. If the question is about specific metrics, explain what they mean. If it's about whether to buy/sell, emphasize this is not financial advice and they should do their own research.`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a helpful financial educator. Provide clear, educational answers with appropriate disclaimers.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.5,    // Balanced for educational content
      max_tokens: 500,     // Shorter answers
      top_p: 0.9,
    }, {
      cacheTtl: 600,       // Cache for 10 minutes
    });

    return response.choices[0].message.content || 'Unable to answer at this time.';
  } catch (error) {
    console.error('Q&A error:', error);
    return 'Sorry, I encountered an error answering your question.';
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
    // Verify authentication and get user's API key
    const { user_id } = await verifyUser(req);
    if (!user_id) {
      return jsonResponse({ error: 'Unauthorized' }, 401);
    }

    // Get user's OpenAI API key (used for financial analysis)
    const userApiKey = await getUserApiKey(user_id, 'openai');
    if (!userApiKey) {
      return jsonResponse({
        error: 'API_KEY_MISSING',
        message: 'Please add your OpenAI API key in your profile.',
        provider: 'openai'
      }, 403);
    }

    // Initialize optimized OpenAI client with financial profile
    // This client includes: caching, rate limiting, circuit breaker, retry
    const openai = await createOptimizedOpenAIClient(userApiKey, 'financial');

    // Parse input
    const input: FinanceInput = await req.json();
    const { action, symbol, stockData, question } = input;

    if (!action) {
      return jsonResponse({ error: 'Action is required' }, 400);
    }

    // ==========================
    // Action: Get Stock Price
    // ==========================
    if (action === 'getStock') {
      if (!symbol) {
        return jsonResponse({ error: 'Symbol is required' }, 400);
      }

      const stock = await fetchStockPrice(symbol);

      // Save to database (fire-and-forget)
      try {
        await supabase
          .from('ai_agent_runs')
          .insert({
            agent_type: 'finance_agent',
            user_id: input.userId || null,
            input_data: { symbol, action: 'getStock' },
            output_data: { stock },
            status: 'completed',
            created_at: new Date().toISOString()
          });
      } catch (dbError) {
        console.error('DB error (non-critical):', dbError);
      }

      return jsonResponse({ stock, historical: stock.historical || [] });
    }

    // ==========================
    // Action: AI Analysis
    // ==========================
    if (action === 'analyze') {
      if (!stockData) {
        return jsonResponse({ error: 'Stock data is required' }, 400);
      }

      const insight = await generateAIAnalysis(stockData.symbol, stockData, openai);

      try {
        await supabase
          .from('ai_agent_runs')
          .insert({
            agent_type: 'finance_agent',
            user_id: input.userId || null,
            input_data: { symbol: stockData.symbol, action: 'analyze' },
            output_data: { insight },
            status: 'completed',
            created_at: new Date().toISOString()
          });
      } catch (dbError) {
        console.error('DB error (non-critical):', dbError);
      }

      return jsonResponse({ insight });
    }

    // ==========================
    // Action: Ask Question
    // ==========================
    if (action === 'ask') {
      if (!question || !stockData) {
        return jsonResponse({ error: 'Question and stock data are required' }, 400);
      }

      const answer = await answerQuestion(question, stockData.symbol, stockData, openai);

      try {
        await supabase
          .from('ai_agent_runs')
          .insert({
            agent_type: 'finance_agent',
            user_id: input.userId || null,
            input_data: { question, symbol: stockData.symbol },
            output_data: { answer },
            status: 'completed',
            created_at: new Date().toISOString()
          });
      } catch (dbError) {
        console.error('DB error (non-critical):', dbError);
      }

      return jsonResponse({ answer });
    }

    return jsonResponse({ error: 'Unknown action' }, 400);

  } catch (error: any) {
    console.error('Finance agent handler error:', error);

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
