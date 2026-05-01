import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders, jsonResponse, errorResponse } from '../_shared/utils.ts';

import { createClient } from '@supabase/supabase-js';
import OpenAI from 'npm:openai@4.78.1';;

// Initialize Supabase
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: Deno.env.get('OPENAI_API_KEY'),
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

Deno.serve(async (req: Request) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { 'Content-Type': 'application/json', ...corsHeaders } });;
  }

  try {
    const input: ReasoningInput = await req.json();

    if (!input.question?.trim()) {
      return new Response(JSON.stringify({ error: 'Question is required' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } });;
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

    return new Response(JSON.stringify({
        ...result,
        question: input.question,
        model,
        mode: input.mode,
        timestamp
      }), { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } });;

  } catch (error) {
    console.error('Handler error:', error);
    return new Response(JSON.stringify({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }), { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } });;
  }
}
