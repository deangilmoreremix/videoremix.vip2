/**
 * Reasoning Agent Edge Function
 * Provides both standard and reasoning-mode LLM responses with step-by-step analysis.
 * Category: Starter AI Agents
 * Tonality: Steve Jobs + Hemingway — Revolutionary clarity, direct thinking
 *
 * This version uses USER-PROVIDED API keys stored in Supabase.
 * User must have an OpenAI API key saved in their profile.
 *
 * Input: { question: string, mode: 'standard' | 'reasoning' | 'compare', model?: string, user_id?: string }
 * Output: { standardAnswer?, reasoningAnswer?, processingTime, model, mode, timestamp }
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders, jsonResponse, errorResponse } from '../_shared/utils.ts';

import { createClient } from 'npm:@supabase/supabase-js@2';
import OpenAI from 'npm:openai@4.78.1';

// Initialize Supabase (service role for DB access)
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Helper: Verify JWT token and extract user_id
async function verifyUser(req: Request): Promise<{ user_id: string } | null> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.substring(7);
  try {
    // Use service role client to verify token (bypasses RLS)
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) {
      console.error('JWT verification failed:', error?.message);
      return null;
    }
    return { user_id: data.user.id };
  } catch (e) {
    console.error('JWT verification exception:', e);
    return null;
  }
}

// Helper: Fetch user's API key from Supabase
async function getUserApiKey(user_id: string, provider: string = 'openai'): Promise<string | null> {
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

// Helper: Log API usage (optional analytics)
async function logApiUsage(
  user_id: string,
  app_id: string,
  provider: string,
  tokens_used: number = 0,
  cost_estimate: number = 0.0
) {
  try {
    await supabase.rpc('log_api_usage', {
      p_user_id: user_id,
      p_app_id: app_id,
      p_provider: provider,
      p_tokens_used: tokens_used,
      p_cost_estimate: cost_estimate,
    });
  } catch (e) {
    // Non-critical
    console.error('Failed to log API usage:', e);
  }
}

Deno.serve(async (req: Request) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return errorResponse('Method not allowed', 405);
  }

  try {
    // 1. Verify authentication
    const { user_id } = await verifyUser(req);
    if (!user_id) {
      return jsonResponse(
        { success: false, error: 'Unauthorized', message: 'Authentication required' },
        401
      );
    }

    // 2. Get user's OpenAI key
    const userApiKey = await getUserApiKey(user_id, 'openai');
    if (!userApiKey) {
      return jsonResponse(
        {
          success: false,
          error: 'OPENAI_KEY_MISSING',
          message: 'Please add your OpenAI API key in your profile settings.',
          provider: 'openai',
        },
        403
      );
    }

    // 3. Parse input
    const body = await req.json();
    const { question, mode = 'standard', model = 'gpt-4o-mini' } = body;

    if (!question?.trim()) {
      return jsonResponse({ success: false, error: 'Question is required' }, 400);
    }

    // 4. Initialize OpenAI client with user's key
    const openai = new OpenAI({ apiKey: userApiKey });

    const startTime = Date.now();
    const result: { standardAnswer?: string; reasoningAnswer?: string; processingTime: number } = {
      processingTime: 0,
    };

    // 5. Execute agent logic
    if (mode === 'standard' || mode === 'compare') {
      try {
        const standardResponse = await openai.chat.completions.create({
          model,
          messages: [{ role: 'user', content: question }],
          temperature: 0.7,
          max_tokens: 1000,
        });
        result.standardAnswer = standardResponse.choices[0]?.message?.content || '';
      } catch (error) {
        console.error('Standard response error:', error);
        result.standardAnswer = 'Error generating standard response';
      }
    }

    if (mode === 'reasoning' || mode === 'compare') {
      try {
        const reasoningResponse = await openai.chat.completions.create({
          model,
          messages: [
            {
              role: 'system',
              content:
                'You are an AI assistant with strong reasoning capabilities. When answering questions, especially those involving logic, math, or complex analysis, break down your thinking process step-by-step before giving the final answer. Show your work clearly, explain your reasoning, and then state your conclusion. Be thorough but concise.',
            },
            { role: 'user', content: question },
          ],
          temperature: 0.7,
          max_tokens: 1500,
        });
        result.reasoningAnswer = reasoningResponse.choices[0]?.message?.content || '';
      } catch (error) {
        console.error('Reasoning response error:', error);
        result.reasoningAnswer = 'Error generating reasoning response';
      }
    }

    result.processingTime = Date.now() - startTime;

    // 6. Log usage (optional)
    try {
      const usage = openai.usage; // if available in response
      if (usage) {
        await logApiUsage(user_id, 'reasoning-agent', 'openai', usage.total_tokens);
      }
    } catch (e) {
      // ignore
    }

    // 7. Return result
    return jsonResponse({
      ...result,
      question,
      model,
      mode,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Handler error:', error);
    return jsonResponse(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      500
    );
  }
});
