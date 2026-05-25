import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

interface AgentInput {
  openai_api_key: string;
  xai_grok_api_key: string;
  enter_stock_symbol_eg_aapl_googl_tsla: string;
  time_period: string;
  stock_symbol_for_news: string;
  symbol: string;
  shares: string;
  avg_buy_price_: string;
  symbol_to_analyze: string;
  ask_about_investing_markets_or_finance: string
  userId?: string;
}

interface AgentResult {
  id: string;
  status: 'processing' | 'completed' | 'error';
  result?: string;
  
  
  
  error?: string;
  timestamp: string;
  processingTime: number;
}

function buildPrompt(input: AgentInput): string {
  return `OpenAI API Key: {openai_api_key}
xAI (Grok) API Key: {xai_grok_api_key}
Enter Stock Symbol (e.g., AAPL, GOOGL, TSLA): {enter_stock_symbol_eg_aapl_googl_tsla}
Time Period: {time_period}
Stock Symbol for News: {stock_symbol_for_news}
Symbol: {symbol}
Shares: {shares}
Avg Buy Price ($): {avg_buy_price_}
Symbol to analyze: {symbol_to_analyze}
Ask about investing, markets, or finance:: {ask_about_investing_markets_or_finance}`;
}



export async function handler(event: any) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const startTime = Date.now();
  const input: AgentInput = JSON.parse(event.body);

  // Validate required fields
  if (!input.openai_api_key) return { statusCode: 400, body: JSON.stringify({ error: 'OpenAI API Key is required' }) };
  if (!input.xai_grok_api_key) return { statusCode: 400, body: JSON.stringify({ error: 'xAI (Grok) API Key is required' }) };
  if (!input.enter_stock_symbol_eg_aapl_googl_tsla) return { statusCode: 400, body: JSON.stringify({ error: 'Enter Stock Symbol (e.g., AAPL, GOOGL, TSLA) is required' }) };
  if (!input.time_period) return { statusCode: 400, body: JSON.stringify({ error: 'Time Period is required' }) };
  if (!input.stock_symbol_for_news) return { statusCode: 400, body: JSON.stringify({ error: 'Stock Symbol for News is required' }) };
  if (!input.symbol) return { statusCode: 400, body: JSON.stringify({ error: 'Symbol is required' }) };
  if (!input.shares) return { statusCode: 400, body: JSON.stringify({ error: 'Shares is required' }) };
  if (!input.avg_buy_price_) return { statusCode: 400, body: JSON.stringify({ error: 'Avg Buy Price ($) is required' }) };
  if (!input.symbol_to_analyze) return { statusCode: 400, body: JSON.stringify({ error: 'Symbol to analyze is required' }) };
  if (!input.ask_about_investing_markets_or_finance) return { statusCode: 400, body: JSON.stringify({ error: 'Ask about investing, markets, or finance: is required' }) };

  const resultId = `xai-finance-agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const timestamp = new Date().toISOString();

  // Save initial record
  try {
    await supabase.from('ai_agent_runs').insert({
      id: resultId,
      agent_type: 'xai-finance-agent',
      user_id: input.userId || null,
      input_data: input,
      output_data: { id: resultId, status: 'processing' },
      status: 'processing',
      created_at: timestamp
    });
  } catch (dbErr) {
    console.error('DB insert failed:', dbErr);
  }

  try {
    // Call AI
    const prompt = buildPrompt(input);
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a helpful AI assistant.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 2000
    });

    const textResult = response.choices[0].message.content;
    const result: AgentResult = {
      id: resultId,
      status: 'completed',
      result: textResult,
      timestamp,
      processingTime: Date.now() - startTime
    }

    // Save result
    await supabase.from('ai_agent_runs')
      .update({ output_data: result, status: 'completed', updated_at: new Date().toISOString() })
      .eq('id', resultId);

    return { statusCode: 200, body: JSON.stringify(result) };

  } catch (error) {
    console.error('Agent error:', error);
    const errorResult: AgentResult = {
      id: resultId,
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp,
      processingTime: Date.now() - startTime
    };
    await supabase.from('ai_agent_runs').update({ output_data: errorResult, status: 'error' }).eq('id', resultId);
    return { statusCode: 500, body: JSON.stringify(errorResult) };
  }
}