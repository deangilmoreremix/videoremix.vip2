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

    const { prompt, projectId, generationType, imageUrl } = await req.json();

    if (!prompt || !projectId) {
      return new Response(
        JSON.stringify({ error: "Missing prompt or projectId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update status to processing
    await supabase
      .from("ai_image_projects")
      .update({ status: "processing" })
      .eq("id", projectId);

    // Call OpenAI DALL-E for image generation
    const openaiResponse = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt: prompt,
        n: 1,
        size: "1024x1024",
      }),
    });

    if (!openaiResponse.ok) {
      const error = await openaiResponse.json();
      throw new Error(`OpenAI API error: ${error.error?.message || "Unknown error"}`);
    }

    const openaiData = await openaiResponse.json();
    const generatedImageUrl = openaiData.data[0]?.url;

    if (!generatedImageUrl) {
      throw new Error("No image URL returned from OpenAI");
    }

    // Download the image and upload to Supabase storage
    const imageResponse = await fetch(generatedImageUrl);
    const imageBlob = await imageResponse.blob();
    const fileName = `ai-generated-${Date.now()}.png`;
    const filePath = `${projectId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("app-assets")
      .upload(filePath, imageBlob);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from("app-assets")
      .getPublicUrl(filePath);

    // Update project with completed status
    await supabase
      .from("ai_image_projects")
      .update({
        status: "completed",
        output_image_url: publicUrl,
        settings: { prompt, generation_type: generationType, completed_at: new Date().toISOString() },
      })
      .eq("id", projectId);

    return new Response(
      JSON.stringify({ success: true, imageUrl: publicUrl }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in ai-image-generator:", error);

    // Update project status to failed if projectId is available
    try {
      const { projectId } = await req.json().catch(() => ({ projectId: null }));
      if (projectId) {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseKey);
        await supabase
          .from("ai_image_projects")
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
