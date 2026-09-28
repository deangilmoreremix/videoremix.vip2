import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders, jsonResponse } from '../_shared/utils.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';
import OpenAI from 'npm:openai@4.78.1';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function verifyUser(req: Request): Promise<{ user_id: string } | null> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.substring(7);
  try {
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) return null;
    return { user_id: data.user.id };
  } catch {
    return null;
  }
}

async function getUserApiKey(user_id: string, provider: string = 'openai'): Promise<string | null> {
  const { data, error } = await supabase
    .from('user_api_keys')
    .select('encrypted_api_key')
    .eq('user_id', user_id)
    .eq('provider', provider)
    .single();

  if (error || !data) return null;
  return data.encrypted_api_key;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    const { user_id } = await verifyUser(req);
    if (!user_id) {
      return jsonResponse({ error: 'Unauthorized', message: 'Authentication required' }, 401);
    }

    const userApiKey = await getUserApiKey(user_id, 'openai');
    if (!userApiKey) {
      return jsonResponse({
        success: false,
        error: 'OPENAI_KEY_MISSING',
        message: 'Please add your OpenAI API key in your profile settings.',
        provider: 'openai',
      }, 403);
    }

    const body = await req.json();
    const openai = new OpenAI({ apiKey: userApiKey });

    const prompt = `You are a game design director. Create a comprehensive game design document based on the provided concept.

Game Concept: ${body.concept || 'Not specified'}
Genre: ${body.genre || 'Not specified'}
Target Audience: ${body.target_audience || 'Not specified'}
Platform: ${body.platform || 'Not specified'}
Core Mechanics: ${body.core_mechanics || 'Not specified'}

Create a game design document including:
1. Game overview and vision
2. Core gameplay loop
3. Character and world design
4. Art and audio direction
5. Monetization strategy
6. Development roadmap

Return ONLY valid JSON with keys: overview, gameplayLoop, characterDesign, artAudioDirection, monetizationStrategy, developmentRoadmap`;

    const response = await openai.responses.create({
      model: 'gpt-5.5',
      input: prompt,
    });

    const content = response.output_text || '{}';
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? jsonMatch[0] : content;

    return jsonResponse({
      success: true,
      status: 'completed',
      function: 'ai-game-design-agent-team',
      data: JSON.parse(jsonStr),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('ai-game-design-agent-team error:', error);
    return jsonResponse({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      status: 'error',
    }, 500);
  }
});
