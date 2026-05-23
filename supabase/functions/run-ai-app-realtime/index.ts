// supabase/functions/run-ai-app-realtime/index.ts
// OpenAI Realtime API for voice-enabled AI apps
// https://platform.openai.com/docs/guides/realtime

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getAppConfig } from "../run-ai-app/app-configs.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, upgrade, connection",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

// Apps that use Realtime API
const REALTIME_APPS = new Set([
  "ai-intake-voice-agent",
  "ai-dictation-assistant",
]);

interface RealtimeSessionRequest {
  appSlug: string;
  userId?: string;
  voice?: "alloy" | "echo" | "shimmer" | "fable" | "onyx" | "nova";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split("/");
    const appSlug = pathParts[pathParts.length - 1] || pathParts[pathParts.length - 2];

    if (!appSlug || !REALTIME_APPS.has(appSlug)) {
      return new Response(JSON.stringify({
        error: "App does not support Realtime API",
        supported: Array.from(REALTIME_APPS),
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const config = getAppConfig(appSlug);
    const openaiKey = Deno.env.get("OPENAI_API_KEY");

    if (!openaiKey) {
      return new Response(JSON.stringify({ error: "OPENAI_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse request body
    let body: RealtimeSessionRequest = {};
    try {
      body = await req.json();
    } catch {}

    const { voice = config?.realtimeVoice || "shimmer" } = body;

    // Generate ephemeral key session for client-side WebSocket connection
    // The client will use this to connect directly to OpenAI's Realtime API
    const sessionResponse = {
      success: true,
      appSlug,
      model: config?.model || "gpt-4o-mini",
      voice,
      instructions: getAppInstructions(appSlug),
      systemPrompt: config?.systemPrompt || "",
      realtime_protocol: "openai_realtime",
      // Note: In production, you would generate an ephemeral key server-side
      // For now, we pass the API key for client-side usage
      // In a real implementation, use OpenAI's session creation API
      api_key: openaiKey,
      sample_rate: 24000,
      modalities: ["audio", "text"],
      tools: config?.tools || [],
    };

    return new Response(JSON.stringify(sessionResponse), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("run-ai-app-realtime error:", error);
    return new Response(JSON.stringify({ error: error.message || "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

/**
 * Get system instructions for each realtime app
 */
function getAppInstructions(appSlug: string): string {
  const instructions: Record<string, string> = {
    "ai-intake-voice-agent": `You are AI Intake Voice Agent. Help businesses collect client information through natural voice conversations.

Your approach:
1. Greet the caller warmly and introduce yourself
2. Ask one question at a time in a natural, conversational manner
3. Wait for clear responses before proceeding
4. If you don't understand, politely ask them to repeat
5. Confirm information by summarizing what you heard
6. Keep responses concise - 1-2 sentences for questions
7. After collecting all needed info, provide a summary and next steps

Collect: Name, contact info, reason for contact, any relevant details.
Follow the conversation flow naturally - you don't need to ask questions in a rigid order.
Adapt to how the caller responds while ensuring you get all necessary information.

Keep responses short and conversational for voice interaction.`,

    "ai-dictation-assistant": `You are AI Dictation Assistant. Transform spoken words into perfectly organized, professional content.

Your approach:
1. Listen carefully to the speaker's dictation
2. Transform rough spoken notes into well-structured professional content
3. Organize thoughts into clear categories and sections
4. Identify action items and suggest next steps
5. Maintain the speaker's voice and intent while improving clarity
6. Provide brief acknowledgments ("Got it", "Understood", "Sure") to confirm you're listening
7. If something is unclear, ask for clarification naturally

Output formats you can produce:
- Meeting notes
- Email drafts
- Summaries
- Reports
- Action item lists
- Todo lists

Wait for the speaker to finish, then produce the final organized output.
For voice interaction, keep responses brief and confirm understanding frequently.`,
  };

  return instructions[appSlug] || instructions["ai-intake-voice-agent"];
}