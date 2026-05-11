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
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { videoId, userId } = await req.json();

    if (!videoId || !userId) {
      return new Response(
        JSON.stringify({ error: "Missing videoId or userId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: video, error: videoError } = await supabase
      .from("videos")
      .select("*")
      .eq("id", videoId)
      .single();

    if (videoError || !video) {
      return new Response(
        JSON.stringify({ error: "Video not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (video.user_id !== userId) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const processedData = {
      thumbnail_url: video.thumbnail_path || `https://via.placeholder.com/640x360?text=Video+${videoId}`,
      duration: null,
      status: "processed",
      processed_at: new Date().toISOString(),
    };

    const { error: updateError } = await supabase
      .from("videos")
      .update({
        status: "processed",
        thumbnail_path: processedData.thumbnail_url,
        metadata: processedData,
      })
      .eq("id", videoId);

    if (updateError) throw updateError;

    return new Response(
      JSON.stringify({ success: true, data: processedData }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
