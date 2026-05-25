import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

interface ChatInput {
  message: string;
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
  userId?: string;
}

interface ChatResult {
  id: string;
  response: string;
  history: Array<{ role: 'user' | 'assistant'; content: string }>;
  timestamp: string;
}

export async function handler(event: any) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const input: ChatInput = JSON.parse(event.body);
  if (!input.message?.trim()) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Message is required' }) };
  }

  const resultId = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const timestamp = new Date().toISOString();

  // Build messages array (system + history + current)
  const messages = [
    { role: 'system', content: 'You are a helpful AI assistant.' },
    ...(input.history || []),
    { role: 'user', content: input.message }
  ];

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      temperature: 0.7,
      max_tokens: 2000
    });

    const assistantMsg = response.choices[0].message.content;
    const newHistory = [...(input.history || []), { role: 'user', content: input.message }, { role: 'assistant', content: assistantMsg }];

    const result: ChatResult = {
      id: resultId,
      response: assistantMsg,
      history: newHistory,
      timestamp
    };

    await supabase.from('ai_agent_runs').insert({
      id: resultId,
      agent_type: 'ai-customer-support-agent',
      user_id: input.userId || null,
      input_data: input,
      output_data: result,
      status: 'completed',
      created_at: timestamp
    });

    return { statusCode: 200, body: JSON.stringify(result) };

  } catch (error) {
    console.error('Chat error:', error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
}