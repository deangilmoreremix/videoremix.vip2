import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

// Initialize Supabase
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface ReasoningInput {
  question: string;
  mode: 'standard' | 'reasoning' | 'compare';
  model?: string;
  userId?: string;
}

interface ReasoningResult {
  standardAnswer?: string;
  reasoningAnswer?: string;
  processingTime: number;
}

export async function handler(event: any) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const input: ReasoningInput = JSON.parse(event.body);

    if (!input.question?.trim()) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Question is required' }) };
    }

    const model = input.model || 'gpt-4o-mini';
    const startTime = Date.now();

    const result: ReasoningResult = { processingTime: 0 };

    // Get standard response
    if (input.mode === 'standard' || input.mode === 'compare') {
      try {
        const standardResponse = await openai.chat.completions.create({
          model: model,
          messages: [
            {
              role: 'user',
              content: input.question
            }
          ],
          temperature: 0.7,
          max_tokens: 1000,
        });
        result.standardAnswer = standardResponse.choices[0].message.content || '';
      } catch (error) {
        console.error('Standard response error:', error);
        result.standardAnswer = 'Error generating standard response';
      }
    }

    // Get reasoning response
    if (input.mode === 'reasoning' || input.mode === 'compare') {
      try {
        const reasoningResponse = await openai.chat.completions.create({
          model: model,
          messages: [
            {
              role: 'system',
              content: `You are an AI assistant with strong reasoning capabilities.
                When answering questions, especially those involving logic, math, or complex analysis,
                break down your thinking process step-by-step before giving the final answer.
                Show your work clearly, explain your reasoning, and then state your conclusion.
                Be thorough but concise.`
            },
            {
              role: 'user',
              content: input.question
            }
          ],
          temperature: 0.7,
          max_tokens: 1500,
        });
        result.reasoningAnswer = reasoningResponse.choices[0].message.content || '';
      } catch (error) {
        console.error('Reasoning response error:', error);
        result.reasoningAnswer = 'Error generating reasoning response';
      }
    }

    result.processingTime = Date.now() - startTime;

    // Save to database
    const resultId = `reasoning_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = new Date().toISOString();

    try {
      await supabase
        .from('ai_agent_runs')
        .insert({
          id: resultId,
          agent_type: 'reasoning_agent',
          user_id: input.userId || null,
          input_data: { question: input.question, mode: input.mode, model },
          output_data: { ...result, timestamp },
          status: 'completed',
          created_at: timestamp
        });
    } catch (dbError) {
      console.error('Database error:', dbError);
      // Continue without database save
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        ...result,
        question: input.question,
        model,
        mode: input.mode,
        timestamp
      })
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
}
