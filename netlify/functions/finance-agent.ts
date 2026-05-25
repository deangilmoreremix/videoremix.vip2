import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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

// Simple stock data fetcher (in production, use Alpha Vantage, Finnhub, or Yahoo Finance API)
async function fetchStockPrice(symbol: string): Promise<StockInfo> {
  // Demo data - in production replace with real market data API
  const demoData: Record<string, StockInfo> = {
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

  const symbolUpper = symbol.toUpperCase();

  // If we have demo data, return it with a slight random price variation
  if (demoData[symbolUpper]) {
    const base = demoData[symbolUpper];
    const variation = (Math.random() - 0.5) * 2; // -1 to +1
    return {
      ...base,
      price: base.price + variation,
      change: base.change + variation * 0.5,
      changePercent: base.changePercent + variation * 0.1,
    };
  }

  // For unknown symbols, generate placeholder data
  return {
    symbol: symbolUpper,
    price: 100 + Math.random() * 200,
    change: (Math.random() - 0.5) * 5,
    changePercent: (Math.random() - 0.5) * 3,
    name: symbolUpper,
    historical: Array.from({ length: 30 }, () => 100 + Math.random() * 100)
  };
}

async function generateAIAnalysis(symbol: string, stock: StockInfo): Promise<AIInsight> {
  const prompt = `You are a professional financial analyst. Analyze this stock data and provide a concise, actionable recommendation.

Stock: ${symbol}
Current Price: $${stock.price.toFixed(2)}
Day Change: ${stock.change >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
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
      temperature: 0.3,
      max_tokens: 500
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

async function answerQuestion(question: string, symbol: string, stock: StockInfo): Promise<string> {
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
      temperature: 0.7,
      max_tokens: 300
    });

    return response.choices[0].message.content || 'Unable to answer at this time.';
  } catch (error) {
    console.error('Q&A error:', error);
    return 'Sorry, I encountered an error answering your question.';
  }
}

export async function handler(event: any) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const input: FinanceInput = JSON.parse(event.body);
    const { action } = input;

    if (!action) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Action is required' }) };
    }

    // Get stock data
    if (action === 'getStock') {
      if (!input.symbol) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Symbol is required' }) };
      }

      const stock = await fetchStockPrice(input.symbol);

      // Save to database
      try {
        await supabase
          .from('ai_agent_runs')
          .insert({
            agent_type: 'finance_agent',
            user_id: input.userId || null,
            input_data: { symbol: input.symbol, action: 'getStock' },
            output_data: { stock },
            status: 'completed',
            created_at: new Date().toISOString()
          });
      } catch (dbError) {
        console.error('DB error (non-critical):', dbError);
      }

      return {
        statusCode: 200,
        body: JSON.stringify({
          stock,
          historical: stock.historical || []
        })
      };
    }

    // Get AI analysis
    if (action === 'analyze') {
      if (!input.stockData) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Stock data is required' }) };
      }

      const insight = await generateAIAnalysis(input.stockData.symbol, input.stockData);

      try {
        await supabase
          .from('ai_agent_runs')
          .insert({
            agent_type: 'finance_agent',
            user_id: input.userId || null,
            input_data: { symbol: input.stockData.symbol, action: 'analyze' },
            output_data: { insight },
            status: 'completed',
            created_at: new Date().toISOString()
          });
      } catch (dbError) {
        console.error('DB error (non-critical):', dbError);
      }

      return { statusCode: 200, body: JSON.stringify({ insight }) };
    }

    // Answer question
    if (action === 'ask') {
      if (!input.question || !input.stockData) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Question and stock data are required' }) };
      }

      const answer = await answerQuestion(input.question, input.stockData.symbol, input.stockData);

      try {
        await supabase
          .from('ai_agent_runs')
          .insert({
            agent_type: 'finance_agent',
            user_id: input.userId || null,
            input_data: { question: input.question, symbol: input.stockData.symbol },
            output_data: { answer },
            status: 'completed',
            created_at: new Date().toISOString()
          });
      } catch (dbError) {
        console.error('DB error (non-critical):', dbError);
      }

      return { statusCode: 200, body: JSON.stringify({ answer }) };
    }

    return { statusCode: 400, body: JSON.stringify({ error: 'Unknown action' }) };

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
