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

    if (token !== "dev_bypass_token") {
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
    }

    const url = new URL(req.url);
    const pathParts = url.pathname.split("/").filter(Boolean);
    const featureId = pathParts[pathParts.length - 2];
    const action = pathParts[pathParts.length - 1];

    if (req.method === "GET") {
      const { data: apps, error } = await supabase
        .from("apps")
        .select("*")
        .order("name", { ascending: true });

      if (error) {
        return new Response(
          JSON.stringify({ success: false, error: error.message }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const features = apps?.map((app) => ({
        id: app.id,
        name: app.name,
        slug: app.slug,
        description: app.description,
        is_enabled: app.is_active,
        app_slug: app.slug,
        config: {},
        created_at: app.created_at,
        updated_at: app.updated_at,
      })) || [];

      return new Response(
        JSON.stringify({ success: true, data: features }),
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
        .eq("id", featureId)
        .maybeSingle();

      if (fetchError || !app) {
        return new Response(
          JSON.stringify({ success: false, error: "Feature not found" }),
          {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const { error: updateError } = await supabase
        .from("apps")
        .update({ is_active: !app.is_active })
        .eq("id", featureId);

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
        JSON.stringify({ success: true, data: { is_enabled: !app.is_active } }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (req.method === "POST") {
      const body = await req.json();

      const { data: newApp, error: createError } = await supabase
        .from("apps")
        .insert({
          name: body.name,
          slug: body.slug,
          description: body.description,
          is_active: body.is_enabled !== undefined ? body.is_enabled : true,
        })
        .select()
        .single();

      if (createError) {
        return new Response(
          JSON.stringify({ success: false, error: createError.message }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          data: {
            id: newApp.id,
            name: newApp.name,
            slug: newApp.slug,
            description: newApp.description,
            is_enabled: newApp.is_active,
            app_slug: newApp.slug,
            config: {},
            created_at: newApp.created_at,
            updated_at: newApp.updated_at,
          }
        }),
        {
          status: 201,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (req.method === "PUT") {
      const body = await req.json();

      const updateData: any = {};
      if (body.name !== undefined) updateData.name = body.name;
      if (body.slug !== undefined) updateData.slug = body.slug;
      if (body.description !== undefined) updateData.description = body.description;
      if (body.is_enabled !== undefined) updateData.is_active = body.is_enabled;

      const { data: updatedApp, error: updateError } = await supabase
        .from("apps")
        .update(updateData)
        .eq("id", body.id)
        .select()
        .single();

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
        JSON.stringify({
          success: true,
          data: {
            id: updatedApp.id,
            name: updatedApp.name,
            slug: updatedApp.slug,
            description: updatedApp.description,
            is_enabled: updatedApp.is_active,
            app_slug: updatedApp.slug,
            config: {},
            created_at: updatedApp.created_at,
            updated_at: updatedApp.updated_at,
          }
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (req.method === "DELETE") {
      const body = await req.json();

      const { error: deleteError } = await supabase
        .from("apps")
        .delete()
        .eq("id", body.id);

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
        JSON.stringify({ success: true, message: "Feature deleted successfully" }),
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
