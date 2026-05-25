import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

interface AgentInput {
  ragie_api_key: string;
  anthropic_api_key: string;
  enter_document_url: string;
  document_name_optional: string;
  upload_mode: string;
  enter_your_query: string
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
  return `Ragie API Key: {ragie_api_key}
Anthropic API Key: {anthropic_api_key}
Enter document URL: {enter_document_url}
Document name (optional): {document_name_optional}
Upload mode: {upload_mode}
Enter your query: {enter_your_query}`;
}



export async function handler(event: any) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const startTime = Date.now();
  const input: AgentInput = JSON.parse(event.body);

  // Validate required fields
  if (!input.ragie_api_key) return { statusCode: 400, body: JSON.stringify({ error: 'Ragie API Key is required' }) };
  if (!input.anthropic_api_key) return { statusCode: 400, body: JSON.stringify({ error: 'Anthropic API Key is required' }) };
  if (!input.enter_document_url) return { statusCode: 400, body: JSON.stringify({ error: 'Enter document URL is required' }) };
  if (!input.document_name_optional) return { statusCode: 400, body: JSON.stringify({ error: 'Document name (optional) is required' }) };
  if (!input.upload_mode) return { statusCode: 400, body: JSON.stringify({ error: 'Upload mode is required' }) };
  if (!input.enter_your_query) return { statusCode: 400, body: JSON.stringify({ error: 'Enter your query is required' }) };

  const resultId = `rag-as-a-service_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const timestamp = new Date().toISOString();

  // Save initial record
  try {
    await supabase.from('ai_agent_runs').insert({
      id: resultId,
      agent_type: 'rag-as-a-service',
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
      model: 'claude-3-opus-20240229',
      messages: [
        { role: 'system', content: 'You are Claude, a helpful AI.' },
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