import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

// Fetch user's API key from Supabase (user-provided keys)
async function getUserApiKey(user_id, provider) {
  const { data, error } = await supabase
    .from('user_api_keys')
    .select('encrypted_api_key')
    .eq('user_id', user_id)
    .eq('provider', provider)
    .single();

  if (error || !data) {
    return null;
  }
  return data.encrypted_api_key;
}

// Verify JWT token to get user_id
async function verifyUser(req) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.substring(7);
  try {
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) return null;
    return { user_id: user.id };
  } catch (e) {
    console.error('JWT verification failed:', e);
    return null;
  }
}


const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};


  // Verify authentication and get user's API key
  const { user_id } = await verifyUser(req);
  if (!user_id) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }

  // Get user's openai API key
  const userApiKey = await getUserApiKey(user_id, 'openai');
  if (!userApiKey) {
    return jsonResponse({ 
      error: 'API_KEY_MISSING',
      message: 'Please add your openai API key in your profile.',
      provider: 'openai'
    }, 403);
  }

  // Parse body
  let body;
  try {
    body = await req.json();
  } catch (e) {
    // body remains undefined for non-JSON requests
  }
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
    const supabase = createClient(supabaseUrl, supabaseKey);

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
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

      if (authError || !user) {
        return new Response(
          JSON.stringify({ success: false, error: "Invalid authorization" }),
          {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const { data: roleData } = await supabase
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

    if (req.method === "GET") {
      const { data: subscriptions, error } = await supabase
        .from("subscription_status")
        .select(`
          *,
          purchases!inner(user_id, email),
          user_app_access(app_slug)
        `)
        .order("current_period_end", { ascending: true });

      if (error) {
        return new Response(
          JSON.stringify({ success: false, error: error.message }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const enrichedData = subscriptions?.map((sub: any) => ({
        ...sub,
        user_email: sub.purchases?.email,
        app_access_count: sub.user_app_access?.length || 0,
      })) || [];

      return new Response(
        JSON.stringify({ success: true, data: enrichedData }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: "Method not allowed" }),
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
