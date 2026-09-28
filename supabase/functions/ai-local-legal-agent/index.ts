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
        provider: 'openai',
      }, 403);
    }

    const body = await req.json();
    const openai = new OpenAI({ apiKey: userApiKey });

    const prompt = `You are an AI legal assistant specialized in local and regional law. Help the user with legal questions, document analysis, and case research.

User Request: ${body.request || body.message || 'General legal assistance'}
Jurisdiction: ${body.jurisdiction || 'Not specified'}
Document Type: ${body.document_type || 'Not specified'}

Provide:
1. Legal analysis and applicable statutes
2. Relevant case law and precedents
3. Document review and risk assessment
4. Recommended next steps
5. Disclaimer that this is informational, not legal advice

Return ONLY valid JSON with keys: response, applicableLaws, caseLaw, riskAssessment, recommendations, disclaimer`;

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
      function: 'ai-local-legal-agent',
      data: JSON.parse(jsonStr),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('ai-local-legal-agent error:', error);
    return jsonResponse({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      status: 'error',
    }, 500);
  }
});
