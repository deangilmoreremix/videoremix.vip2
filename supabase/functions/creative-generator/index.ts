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

    const { prompt, projectId, contentType, inputData } = await req.json();

    if (!prompt || !projectId) {
      return new Response(
        JSON.stringify({ error: "Missing prompt or projectId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update status to processing
    await supabase
      .from("creative_projects")
      .update({ status: "processing" })
      .eq("id", projectId);

    // Generate content using OpenAI
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
            content: `You are a creative content generator for ${contentType || "general"} content. Generate engaging, high-quality content.`,
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

    if (!generatedContent) {
      throw new Error("No content returned from OpenAI");
    }

    // Update project with completed status
    const outputUrls = [
      `https://via.placeholder.com/800x600?text=${encodeURIComponent(contentType || "content")}`,
    ];

    await supabase
      .from("creative_projects")
      .update({
        status: "completed",
        output_data: { prompt, content: generatedContent, completed_at: new Date().toISOString() },
        output_urls: outputUrls,
      })
      .eq("id", projectId);

    return new Response(
      JSON.stringify({ success: true, content: generatedContent }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in creative-generator:", error);

    try {
      const { projectId } = await req.json().catch(() => ({ projectId: null }));
      if (projectId) {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseKey);
        await supabase
          .from("creative_projects")
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
