/**
 * Edge Function: 5-1-in-memory-conversation-agent
 * Agent Framework Crash Course — Chapter 5.1: In-Memory Conversation
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders, jsonResponse } from '../_shared/utils.ts';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders });
  if (req.method !== 'POST') return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  try {
    const body = await req.json();
    // In-memory conversation agent maintains state per request (for demo)
    // In production, use database or Redis for persistence
    return jsonResponse({
      status: 'coming_soon',
      message: 'In-memory conversation agent stub. Implement with OpenAI chat completions + session array.',
      agent: '5-1-in-memory-conversation-agent',
      timestamp: new Date().toISOString(),
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message, status: 'error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
