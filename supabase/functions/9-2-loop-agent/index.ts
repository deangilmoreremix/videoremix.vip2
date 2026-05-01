/**
 * Edge Function: 9-2-loop-agent
 * Agent Framework Crash Course — Chapter 9.2: Loop Agent Pattern
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
      message: 'Loop agent stub: repeatedly executes an agent until condition met.',
      agent: '9-2-loop-agent',
      timestamp: new Date().toISOString(),
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message, status: 'error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
