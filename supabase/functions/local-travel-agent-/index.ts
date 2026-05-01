/**
 * Edge Function: local-travel-agent
 * Note: React page uses fetch('/.netlify/functions/local-travel-agent-') with trailing dash.
 * Keeping name for compatibility; implementation will follow.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders, jsonResponse } from '../_shared/utils.ts';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders });
  if (req.method !== 'POST') return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  try {
    const body = await req.json();
    return jsonResponse({
      status: 'coming_soon',
      message: 'Local Travel Agent stub: plans trips using local LLM or external APIs.',
      agent: 'local-travel-agent-',
      timestamp: new Date().toISOString(),
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message, status: 'error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
