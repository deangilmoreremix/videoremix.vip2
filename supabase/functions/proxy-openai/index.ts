import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

const MODEL_PRICING: Record<string, { per1k_input: number; per1k_output: number }> = {
  'gpt-4o': { per1k_input: 500, per1k_output: 1500 },
  'gpt-4o-mini': { per1k_input: 15, per1k_output: 60 },
  'o1': { per1k_input: 1500, per1k_output: 6000 },
  'o1-mini': { per1k_input: 300, per1k_output: 1200 },
  'dall-e-3': { per1k_input: 4000, per1k_output: 4000 },
  'whisper-1': { per1k_input: 600, per1k_output: 0 },
};

const DEFAULT_APP_ID = 'videoremixvip';

async function verifyUser(req: Request) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.substring(7);
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: `Bearer ${token}` },
        },
      }
    );
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) return null;
    return { user_id: user.id, supabase };
  } catch (e) {
    console.error('JWT verification failed:', e);
    return null;
  }
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    const userContext = await verifyUser(req);
    if (!userContext) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { user_id, supabase } = userContext;
    const appId = DEFAULT_APP_ID;

    // Parse path from URL
    const url = new URL(req.url);
    const openaiPath = url.pathname.replace(/^\/functions\/v1\/proxy-openai/, '') || '/';

    // Read request body
    const body = await req.text();
    let requestBody: any = {};
    try {
      requestBody = JSON.parse(body);
    } catch {
      // body may be empty or not JSON
    }

    // Determine model from request body
    const model = requestBody.model || 'gpt-4o-mini';

    // Get credit balance for this app
    const { data: balanceData, error: balanceError } = await supabase
      .from('credit_balances', { schema: 'credits' })
      .select('balance_credits')
      .eq('user_id', user_id)
      .eq('app_id', appId)
      .maybeSingle();

    if (balanceError) {
      console.error('Error fetching credit balance:', balanceError);
      return new Response(
        JSON.stringify({ error: 'Failed to check credit balance' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const balance = balanceData?.balance_credits ?? 0;

    // Estimate cost based on request body
    const estimatedInputTokens = Number(requestBody.max_tokens) || 100;
    const estimatedOutputTokens = Number(requestBody.max_tokens) || 100;
    const pricing = MODEL_PRICING[model] || MODEL_PRICING['gpt-4o-mini'];
    const estimatedCost = Math.ceil(
      (estimatedInputTokens / 1000) * pricing.per1k_input +
        (estimatedOutputTokens / 1000) * pricing.per1k_output
    );

    if (balance < estimatedCost) {
      return new Response(
        JSON.stringify({
          error: 'Insufficient credits',
          required: estimatedCost,
          balance,
          model,
        }),
        {
          status: 402,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            'X-Credits-Balance': String(balance),
            'X-Credits-Required': String(estimatedCost),
          },
        }
      );
    }

    // Forward request to OpenAI
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      console.error('OPENAI_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const openaiUrl = `https://api.openai.com${openaiPath}`;
    
    let openaiResponse: Response;
    try {
      openaiResponse = await fetch(openaiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiApiKey}`,
        },
        body,
      });
    } catch (error) {
      console.error('OpenAI request failed:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to reach AI service' }),
        {
          status: 503,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Read OpenAI response
    const responseBody = await openaiResponse.text();
    let responseData: any = {};
    try {
      responseData = JSON.parse(responseBody);
    } catch {
      // not JSON
    }

    // Only deduct credits for successful responses
    if (openaiResponse.ok) {
      // Extract token usage from response
      let actualCost = estimatedCost;
      if (responseData.usage) {
        const usage = responseData.usage;
        const inputTokens = usage.prompt_tokens || 0;
        const outputTokens = usage.completion_tokens || 0;
        actualCost = Math.ceil(
          (inputTokens / 1000) * pricing.per1k_input +
            (outputTokens / 1000) * pricing.per1k_output
        );
        actualCost = Math.max(actualCost, 1); // minimum 1 credit
      }

      // Deduct credits
      const { data: updateData, error: updateError } = await supabase.rpc(
        'deduct_credits',
        {
          p_user_id: user_id,
          p_app_id: appId,
          p_amount: actualCost,
          p_type: 'api_usage',
          p_source: 'api_proxy',
          p_metadata: {
            model,
            path: openaiPath,
            input_tokens: responseData.usage?.prompt_tokens,
            output_tokens: responseData.usage?.completion_tokens,
          },
        }
      );

      if (updateError) {
        console.error('Error deducting credits:', updateError);
      }

      const newBalance = updateData?.[0]?.new_balance ?? balance - actualCost;

      return new Response(responseBody, {
        status: openaiResponse.status,
        headers: {
          ...corsHeaders,
          'Content-Type': openaiResponse.headers.get('Content-Type') || 'application/json',
          'X-Credits-Remaining': String(newBalance),
          'X-Credits-Deducted': String(actualCost),
        },
      });
    }

    // For non-OK responses, do not deduct credits, just forward the error
    return new Response(responseBody, {
      status: openaiResponse.status,
      headers: {
        ...corsHeaders,
        'Content-Type': openaiResponse.headers.get('Content-Type') || 'application/json',
      },
    });
  } catch (error) {
    console.error('Proxy error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
