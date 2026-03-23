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

    const url = new URL(req.url);
    const pathParts = url.pathname.split("/").filter(Boolean);
    const featureId = pathParts[pathParts.length - 2];
    const action = pathParts[pathParts.length - 1];

    if (req.method === "GET") {
      // Get all features (apps with item_type = 'feature') with their parent app info
      const { data: features, error } = await supabase
        .from("apps")
        .select(`
          id,
          name,
          slug,
          description,
          is_active,
          parent_app_id,
          item_type,
          sort_order,
          created_at,
          updated_at,
          parent_app:apps!parent_app_id (
            id,
            name,
            slug,
            description
          )
        `)
        .eq("item_type", "feature")
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

      // Transform the data to match the expected format
      const transformedFeatures = features?.map((feature) => ({
        id: feature.id,
        name: feature.name,
        slug: feature.slug,
        description: feature.description,
        is_enabled: feature.is_active,
        app_slug: feature.parent_app?.slug || null,
        app_name: feature.parent_app?.name || null,
        parent_app_id: feature.parent_app_id,
        config: {},
        created_at: feature.created_at,
        updated_at: feature.updated_at,
      })) || [];

      return new Response(
        JSON.stringify({ success: true, data: transformedFeatures }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (req.method === "POST" && action === "toggle") {
      const { data: feature, error: fetchError } = await supabase
        .from("apps")
        .select("is_active, item_type")
        .eq("id", featureId)
        .eq("item_type", "feature")
        .maybeSingle();

      if (fetchError || !feature) {
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
        .update({ is_active: !feature.is_active })
        .eq("id", featureId)
        .eq("item_type", "feature");

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
        JSON.stringify({ success: true, data: { is_enabled: !feature.is_active } }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (req.method === "POST") {
      const body = await req.json();

      // Validate that parent_app_id exists and is an app
      if (body.parent_app_id) {
        const { data: parentApp, error: parentError } = await supabase
          .from("apps")
          .select("id, item_type")
          .eq("id", body.parent_app_id)
          .eq("item_type", "app")
          .maybeSingle();

        if (parentError || !parentApp) {
          return new Response(
            JSON.stringify({ success: false, error: "Invalid parent app" }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }
      }

      const { data: newFeature, error: createError } = await supabase
        .from("apps")
        .insert({
          name: body.name,
          slug: body.slug,
          description: body.description,
          is_active: body.is_enabled !== undefined ? body.is_enabled : true,
          item_type: "feature",
          parent_app_id: body.parent_app_id || null,
          sort_order: body.sort_order || 0,
        })
        .select(`
          id,
          name,
          slug,
          description,
          is_active,
          parent_app_id,
          item_type,
          sort_order,
          created_at,
          updated_at,
          parent_app:apps!parent_app_id (
            id,
            name,
            slug,
            description
          )
        `)
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
            id: newFeature.id,
            name: newFeature.name,
            slug: newFeature.slug,
            description: newFeature.description,
            is_enabled: newFeature.is_active,
            app_slug: newFeature.parent_app?.slug || null,
            app_name: newFeature.parent_app?.name || null,
            parent_app_id: newFeature.parent_app_id,
            config: {},
            created_at: newFeature.created_at,
            updated_at: newFeature.updated_at,
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

      // Validate parent_app_id if provided
      if (body.parent_app_id) {
        const { data: parentApp, error: parentError } = await supabase
          .from("apps")
          .select("id, item_type")
          .eq("id", body.parent_app_id)
          .eq("item_type", "app")
          .maybeSingle();

        if (parentError || !parentApp) {
          return new Response(
            JSON.stringify({ success: false, error: "Invalid parent app" }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }
      }

      const updateData: any = {};
      if (body.name !== undefined) updateData.name = body.name;
      if (body.slug !== undefined) updateData.slug = body.slug;
      if (body.description !== undefined) updateData.description = body.description;
      if (body.is_enabled !== undefined) updateData.is_active = body.is_enabled;
      if (body.parent_app_id !== undefined) updateData.parent_app_id = body.parent_app_id;
      if (body.sort_order !== undefined) updateData.sort_order = body.sort_order;

      const { data: updatedFeature, error: updateError } = await supabase
        .from("apps")
        .update(updateData)
        .eq("id", body.id)
        .eq("item_type", "feature")
        .select(`
          id,
          name,
          slug,
          description,
          is_active,
          parent_app_id,
          item_type,
          sort_order,
          created_at,
          updated_at,
          parent_app:apps!parent_app_id (
            id,
            name,
            slug,
            description
          )
        `)
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
            id: updatedFeature.id,
            name: updatedFeature.name,
            slug: updatedFeature.slug,
            description: updatedFeature.description,
            is_enabled: updatedFeature.is_active,
            app_slug: updatedFeature.parent_app?.slug || null,
            app_name: updatedFeature.parent_app?.name || null,
            parent_app_id: updatedFeature.parent_app_id,
            config: {},
            created_at: updatedFeature.created_at,
            updated_at: updatedFeature.updated_at,
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
        .eq("id", body.id)
        .eq("item_type", "feature");

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
