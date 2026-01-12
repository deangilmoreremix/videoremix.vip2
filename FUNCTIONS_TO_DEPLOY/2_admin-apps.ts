import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

// Simple in-memory rate limiter for admin endpoints
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function checkAdminRateLimit(userId: string, action: string = 'default'): { allowed: boolean; error?: string } {
  const now = Date.now();
  const key = `admin:${userId}:${action}`;

  // Different limits for different actions
  const limits = {
    'read': { windowMs: 5 * 60 * 1000, maxRequests: 200 },
    'write': { windowMs: 15 * 60 * 1000, maxRequests: 50 },
    'delete': { windowMs: 60 * 60 * 1000, maxRequests: 10 },
    'default': { windowMs: 15 * 60 * 1000, maxRequests: 100 }
  };

  const limit = limits[action as keyof typeof limits] || limits.default;
  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + limit.windowMs });
    return { allowed: true };
  }

  if (entry.count >= limit.maxRequests) {
    const resetInMinutes = Math.ceil((entry.resetTime - now) / (60 * 1000));
    return {
      allowed: false,
      error: `Rate limit exceeded. Try again in ${resetInMinutes} minutes.`
    };
  }

  entry.count++;
  return { allowed: true };
}

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

    // Rate limiting check
    const rateLimitAction = req.method === 'GET' ? 'read' :
                            req.method === 'DELETE' ? 'delete' : 'write';
    const rateLimitCheck = checkAdminRateLimit(user.id, rateLimitAction);
    if (!rateLimitCheck.allowed) {
      return new Response(
        JSON.stringify({ success: false, error: rateLimitCheck.error }),
        {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const url = new URL(req.url);
    const pathParts = url.pathname.split("/").filter(Boolean);
    const appId = pathParts[pathParts.length - 2];
    const action = pathParts[pathParts.length - 1];

    if (req.method === "GET") {
      const url = new URL(req.url);
      const page = parseInt(url.searchParams.get('page') || '1');
      const limit = parseInt(url.searchParams.get('limit') || '20');
      const offset = (page - 1) * limit;

      // Get total count for pagination
      const { count, error: countError } = await supabase
        .from("apps")
        .select("*", { count: "exact", head: true });

      if (countError) {
        return new Response(
          JSON.stringify({ success: false, error: countError.message }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Get paginated data
      const { data: apps, error } = await supabase
        .from("apps")
        .select("*")
        .order("sort_order", { ascending: true })
        .range(offset, offset + limit - 1);

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
        JSON.stringify({
          success: true,
          data: apps || [],
          pagination: {
            page,
            limit,
            total: count || 0,
            totalPages: Math.ceil((count || 0) / limit)
          }
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (req.method === "POST" && action === "toggle") {
      const { data: app, error: fetchError } = await supabase
        .from("apps")
        .select("is_active")
        .eq("id", appId)
        .maybeSingle();

      if (fetchError || !app) {
        return new Response(
          JSON.stringify({ success: false, error: "App not found" }),
          {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const { error: updateError } = await supabase
        .from("apps")
        .update({ is_active: !app.is_active })
        .eq("id", appId);

      if (updateError) {
        return new Response(
          JSON.stringify({ success: false, error: updateError.message }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      return new Response(
        JSON.stringify({ success: true, data: { is_active: !app.is_active } }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (req.method === "POST" && !action) {
      const body = await req.json();

      const { data: newApp, error: insertError } = await supabase
        .from("apps")
        .insert([{
          name: body.name,
          slug: body.slug,
          description: body.description,
          category: body.category,
          icon_url: body.icon_url,
          is_active: body.is_active ?? true,
          is_featured: body.is_featured ?? false,
          sort_order: body.sort_order ?? 0,
        }])
        .select()
        .maybeSingle();

      if (insertError) {
        return new Response(
          JSON.stringify({ success: false, error: insertError.message }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      return new Response(
        JSON.stringify({ success: true, data: newApp }),
        {
          status: 201,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (req.method === "PUT") {
      const body = await req.json();
      const updateAppId = pathParts[pathParts.length - 1];

      const { data: updatedApp, error: updateError } = await supabase
        .from("apps")
        .update({
          name: body.name,
          slug: body.slug,
          description: body.description,
          category: body.category,
          icon_url: body.icon_url,
          is_active: body.is_active,
          is_featured: body.is_featured,
          sort_order: body.sort_order,
        })
        .eq("id", updateAppId)
        .select()
        .maybeSingle();

      if (updateError) {
        return new Response(
          JSON.stringify({ success: false, error: updateError.message }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      return new Response(
        JSON.stringify({ success: true, data: updatedApp }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (req.method === "DELETE") {
      const deleteAppId = pathParts[pathParts.length - 1];

      const { error: deleteError } = await supabase
        .from("apps")
        .delete()
        .eq("id", deleteAppId);

      if (deleteError) {
        return new Response(
          JSON.stringify({ success: false, error: deleteError.message }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      return new Response(
        JSON.stringify({ success: true }),
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
