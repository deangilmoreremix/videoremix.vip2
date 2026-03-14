import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseClient = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: "Authorization required" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid authorization" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: roleData } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!roleData || (roleData.role !== 'super_admin' && roleData.role !== 'admin')) {
      return new Response(
        JSON.stringify({ success: false, error: "Admin access required" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    const videoId = pathParts[pathParts.length - 1];

    if (req.method === 'GET' && pathParts.length === 3) {
      return await getVideos(req, supabaseClient);
    } else if (req.method === 'POST') {
      return await createVideo(req, supabaseClient);
    } else if (req.method === 'PUT' && videoId) {
      return await updateVideo(req, videoId, supabaseClient);
    } else if (req.method === 'DELETE' && videoId) {
      return await deleteVideo(videoId, supabaseClient);
    }

    return new Response(
      JSON.stringify({ success: false, error: 'Method not allowed' }),
      {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

async function getVideos(req: Request, supabaseClient: any) {
  const url = new URL(req.url);
  const filter = url.searchParams.get('filter');

  let query = supabaseClient
    .from("videos")
    .select("*");

  if (filter === 'homepage') {
    query = query.eq('display_on_homepage', true);
  } else if (filter === 'featured') {
    query = query.eq('is_featured', true);
  } else if (filter === 'public') {
    query = query.eq('is_public', true);
  }

  const { data: videos, error } = await query.order("created_at", { ascending: false });

  if (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  return new Response(
    JSON.stringify({ success: true, data: videos || [] }),
    {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
}

async function createVideo(req: Request, supabaseClient: any) {
  const videoData = await req.json();

  const { data: video, error } = await supabaseClient
    .from("videos")
    .insert([videoData])
    .select()
    .maybeSingle();

  if (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  return new Response(
    JSON.stringify({ success: true, data: video }),
    {
      status: 201,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
}

async function getVideo(videoId: string, supabaseClient: any) {
  const { data: video, error } = await supabaseClient
    .from("videos")
    .select("*")
    .eq("id", videoId)
    .maybeSingle();

  if (error || !video) {
    return new Response(
      JSON.stringify({ success: false, error: "Video not found" }),
      {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  return new Response(
    JSON.stringify({ success: true, data: video }),
    {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
}

async function updateVideo(req: Request, videoId: string, supabaseClient: any) {
  const videoData = await req.json();

  const { data: video, error } = await supabaseClient
    .from("videos")
    .update(videoData)
    .eq("id", videoId)
    .select()
    .maybeSingle();

  if (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  return new Response(
    JSON.stringify({ success: true, data: video }),
    {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
}

async function deleteVideo(videoId: string, supabaseClient: any) {
  const { data: video, error: fetchError } = await supabaseClient
    .from("videos")
    .select("file_path, thumbnail_path")
    .eq("id", videoId)
    .maybeSingle();

  if (fetchError) {
    return new Response(
      JSON.stringify({ success: false, error: fetchError.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  if (!video) {
    return new Response(
      JSON.stringify({ success: false, error: "Video not found" }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  if (video.file_path) {
    const { error: storageError } = await supabaseClient.storage
      .from("videos")
      .remove([video.file_path]);
    if (storageError) {
      console.error("Error deleting video file from storage:", storageError.message);
    }
  }

  if (video.thumbnail_path) {
    const { error: thumbError } = await supabaseClient.storage
      .from("thumbnails")
      .remove([video.thumbnail_path]);
    if (thumbError) {
      console.error("Error deleting thumbnail from storage:", thumbError.message);
    }
  }

  const { error } = await supabaseClient
    .from("videos")
    .delete()
    .eq("id", videoId);

  if (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  return new Response(
    JSON.stringify({ success: true }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}