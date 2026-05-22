// supabase/functions/run-ai-app/index.ts
// Production dispatcher for Batch 1 (Sales/Lead Gen 10 apps) + future 95.
// Real OpenAI calls with per-app system prompts from app-configs.ts

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getAppConfig } from "./app-configs.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { appSlug, inputs, userId } = await req.json();

    if (!appSlug) {
      return new Response(JSON.stringify({ error: "appSlug is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // (Optional future) access check via RPC
    // const { data: hasAccess } = await supabase.rpc("user_has_app_access", { p_user_id: userId, p_app_slug: appSlug });

    const config = getAppConfig(appSlug);
    const openaiKey = Deno.env.get("OPENAI_API_KEY");

    if (!config || !openaiKey) {
      // Graceful fallback for missing config/key during rollout
      const fallback = {
        success: true,
        appSlug,
        output: {
          summary: `Demo mode for ${appSlug}. Connect OPENAI_API_KEY and add config for full AI.`,
          opportunities: ["Add your OpenAI key in Supabase Edge secrets"],
          nextSteps: ["Deploy with real key", "Test end-to-end"],
        },
        metadata: { model: "fallback", demo: true, timestamp: new Date().toISOString() },
      };
      return new Response(JSON.stringify(fallback), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build messages
    const userMessage = `App: ${appSlug}\nUser Inputs:\n${JSON.stringify(inputs, null, 2)}\n\nRespond ONLY with valid JSON matching the expected structure for this app. No extra text outside the JSON.`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          { role: "system", content: config.systemPrompt },
          { role: "user", content: userMessage },
        ],
        temperature: config.temperature ?? 0.7,
        max_tokens: config.maxTokens ?? 1600,
        response_format: { type: "json_object" }, // forces JSON mode on supported models
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`OpenAI error ${response.status}: ${errText}`);
    }

    const openaiData = await response.json();
    const rawContent = openaiData.choices?.[0]?.message?.content || "{}";

    let parsedOutput: any;
    try {
      parsedOutput = JSON.parse(rawContent);
    } catch {
      parsedOutput = { raw: rawContent, note: "Model returned non-JSON, wrapped for safety." };
    }

    const result = {
      success: true,
      appSlug,
      output: parsedOutput,
      metadata: {
        model: config.model,
        tokensUsed: openaiData.usage?.total_tokens || 0,
        timestamp: new Date().toISOString(),
        userId: userId || null,
      },
    };

    // TODO: insert into app_runs table for usage tracking + billing
    // await supabase.from("app_runs").insert({ user_id: userId, app_slug: appSlug, tokens: ..., created_at: ... });

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("run-ai-app error:", error);
    return new Response(JSON.stringify({ error: error.message || "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
