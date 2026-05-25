import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

interface AgentInput {
  _select_the_number_of_cards_for_your_spread_3_for_a_more_focused_answer_7_for_a_more_general_overview: string;
  _please_enter_your_context_or_your_question_here_you_can_speak_in_natural_language: string
  userId?: string;
}

interface AgentResult {
  id: string;
  status: 'processing' | 'completed' | 'error';
  result?: string;
  
  imageUrl?: string;
  
  error?: string;
  timestamp: string;
  processingTime: number;
}

function buildPrompt(input: AgentInput): string {
  return `🃏 Select the number of cards for your spread (3 for a more focused answer, 7 for a more general overview).): {_select_the_number_of_cards_for_your_spread_3_for_a_more_focused_answer_7_for_a_more_general_overview}
✍️ Please enter your context or your question here. You can speak in natural language.: {_please_enter_your_context_or_your_question_here_you_can_speak_in_natural_language}`;
}



export async function handler(event: any) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const startTime = Date.now();
  const input: AgentInput = JSON.parse(event.body);

  // Validate required fields
  if (!input._select_the_number_of_cards_for_your_spread_3_for_a_more_focused_answer_7_for_a_more_general_overview) return { statusCode: 400, body: JSON.stringify({ error: '🃏 Select the number of cards for your spread (3 for a more focused answer, 7 for a more general overview).) is required' }) };
  if (!input._please_enter_your_context_or_your_question_here_you_can_speak_in_natural_language) return { statusCode: 400, body: JSON.stringify({ error: '✍️ Please enter your context or your question here. You can speak in natural language. is required' }) };

  const resultId = `chat-with-tarots_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const timestamp = new Date().toISOString();

  // Save initial record
  try {
    await supabase.from('ai_agent_runs').insert({
      id: resultId,
      agent_type: 'chat-with-tarots',
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