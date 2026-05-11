import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const openaiKey = Deno.env.get("OPENAI_API_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { prompt, projectId, brandData } = await req.json();

    if (!prompt || !projectId) {
      return new Response(
        JSON.stringify({ error: "Missing prompt or projectId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    await supabase
      .from("branding_projects")
      .update({ status: "in_progress" })
      .eq("id", projectId);

    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4-turbo-preview",
        messages: [
          {
            role: "system",
            content: "You are a professional branding expert. Generate complete brand identity including logo concepts, color palette, typography suggestions, and brand guidelines.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
      }),
    });

    if (!openaiResponse.ok) {
      const error = await openaiResponse.json();
      throw new Error(`OpenAI API error: ${error.error?.message || "Unknown error"}`);
    }

    const openaiData = await openaiResponse.json();
    const generatedContent = openaiData.choices[0]?.message?.content;

    const outputUrls = [
      `https://via.placeholder.com/512x512?text=Logo+${brandData?.brandName || "Brand"}`,
      `https://via.placeholder.com/1920x1080?text=Branding+${brandData?.brandName || "Brand"}`,
    ];

    await supabase
      .from("branding_projects")
      .update({
        status: "completed",
        output_urls: outputUrls,
        guidelines: { content: generatedContent, colors: ["#000", "#fff"], fonts: ["Arial"] },
      })
      .eq("id", projectId);

    return new Response(
      JSON.stringify({ success: true, content: generatedContent, outputUrls }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in branding-generator:", error);

    try {
      const { projectId } = await req.json().catch(() => ({ projectId: null }));
      if (projectId) {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseKey);
        await supabase
          .from("branding_projects")
          .update({ status: "failed" })
          .eq("id", projectId);
      }
    } catch {}

    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
