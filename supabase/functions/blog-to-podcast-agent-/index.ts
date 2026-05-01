/**
 * Edge Function: ai-blog-to-podcast-agent (with trailing dash fix)
 * Note: React page uses fetch('/.netlify/functions/blog-to-podcast-agent-') — trailing dash kept for compatibility
 * Implementation will be added in Sprint 0.4 (Starter Agents)
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
      message: 'AI Blog to Podcast Agent stub: converts blog URLs to podcast scripts + TTS.',
      agent: 'blog-to-podcast-agent-',
      timestamp: new Date().toISOString(),
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message, status: 'error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
