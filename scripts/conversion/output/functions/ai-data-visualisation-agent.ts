import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

interface AgentInput {
  select_model: string;
  choose_a_csv_file?: string;
  show_full_dataset: string;
  what_would_you_like_to_know_about_your_data: string
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
  return `Select Model: {select_model}
Choose a CSV file: {choose_a_csv_file}
Show full dataset: {show_full_dataset}
What would you like to know about your data?: {what_would_you_like_to_know_about_your_data}`;
}



export async function handler(event: any) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const startTime = Date.now();
  const input: AgentInput = JSON.parse(event.body);

  // Validate required fields
  if (!input.select_model) return { statusCode: 400, body: JSON.stringify({ error: 'Select Model is required' }) };
  if (!input.choose_a_csv_file) return { statusCode: 400, body: JSON.stringify({ error: 'Choose a CSV file is required' }) };
  if (!input.show_full_dataset) return { statusCode: 400, body: JSON.stringify({ error: 'Show full dataset is required' }) };
  if (!input.what_would_you_like_to_know_about_your_data) return { statusCode: 400, body: JSON.stringify({ error: 'What would you like to know about your data? is required' }) };

  const resultId = `ai-data-visualisation-agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const timestamp = new Date().toISOString();

  // Save initial record
  try {
    await supabase.from('ai_agent_runs').insert({
      id: resultId,
      agent_type: 'ai-data-visualisation-agent',
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