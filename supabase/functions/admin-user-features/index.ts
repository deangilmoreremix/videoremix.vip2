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
    const userId = pathParts[pathParts.length - 2];
    const action = pathParts[pathParts.length - 1];

    // GET /admin-user-features/:userId - Get all features assigned to a user
    if (req.method === "GET" && userId) {
      // Get user's app access first
      const { data: userAppAccess, error: appAccessError } = await supabase
        .from("user_app_access")
        .select(`
          app_slug,
          access_type,
          is_active,
          apps!inner (
            id,
            name,
            slug,
            item_type
          )
        `)
        .eq("user_id", userId)
        .eq("is_active", true);

      if (appAccessError) {
        return new Response(
          JSON.stringify({ success: false, error: appAccessError.message }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Get all apps the user has access to
      const accessibleAppSlugs = userAppAccess?.map(access => access.app_slug) || [];

      // Get all features from apps the user has access to
      const { data: allFeatures, error: featuresError } = await supabase
        .from("apps")
        .select(`
          id,
          name,
          slug,
          description,
          is_active,
          parent_app_id,
          item_type,
          parent_app:apps!parent_app_id (
            id,
            name,
            slug
          )
        `)
        .eq("item_type", "feature")
        .in("parent_app.slug", accessibleAppSlugs)
        .order("name", { ascending: true });

      if (featuresError) {
        return new Response(
          JSON.stringify({ success: false, error: featuresError.message }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // For now, we'll assume all features in accessible apps are available
      // In the future, we could extend user_app_access to support feature-level permissions
      const userFeatures = allFeatures?.map(feature => ({
        id: feature.id,
        name: feature.name,
        slug: feature.slug,
        description: feature.description,
        is_enabled: feature.is_active,
        app_slug: feature.parent_app?.slug || null,
        app_name: feature.parent_app?.name || null,
        has_access: true, // All features in accessible apps are available
        access_type: "granted", // Could be "granted", "inherited", "denied"
      })) || [];

      return new Response(
        JSON.stringify({ success: true, data: userFeatures }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // POST /admin-user-features/:userId/grant - Grant feature access to user
    if (req.method === "POST" && action === "grant") {
      const body = await req.json();
      const { feature_slug } = body;

      if (!feature_slug) {
        return new Response(
          JSON.stringify({ success: false, error: "feature_slug is required" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Verify the feature exists
      const { data: feature, error: featureError } = await supabase
        .from("apps")
        .select(`
          id,
          slug,
          parent_app_id,
          parent_app:apps!parent_app_id (
            slug
          )
        `)
        .eq("slug", feature_slug)
        .eq("item_type", "feature")
        .maybeSingle();

      if (featureError || !feature) {
        return new Response(
          JSON.stringify({ success: false, error: "Feature not found" }),
          {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Check if user has access to the parent app
      const { data: appAccess, error: accessError } = await supabase
        .from("user_app_access")
        .select("id")
        .eq("user_id", userId)
        .eq("app_slug", feature.parent_app.slug)
        .eq("is_active", true)
        .maybeSingle();

      if (accessError) {
        return new Response(
          JSON.stringify({ success: false, error: accessError.message }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      if (!appAccess) {
        return new Response(
          JSON.stringify({ success: false, error: "User does not have access to the parent app" }),
          {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // For now, since we don't have a separate feature access table,
      // we'll consider the feature granted if the user has app access
      // In the future, we could create a user_feature_access table for granular control

      return new Response(
        JSON.stringify({
          success: true,
          message: "Feature access granted",
          data: {
            user_id: userId,
            feature_slug: feature_slug,
            access_type: "granted"
          }
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // POST /admin-user-features/:userId/revoke - Revoke feature access from user
    if (req.method === "POST" && action === "revoke") {
      const body = await req.json();
      const { feature_slug } = body;

      if (!feature_slug) {
        return new Response(
          JSON.stringify({ success: false, error: "feature_slug is required" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Verify the feature exists
      const { data: feature, error: featureError } = await supabase
        .from("apps")
        .select("id, slug")
        .eq("slug", feature_slug)
        .eq("item_type", "feature")
        .maybeSingle();

      if (featureError || !feature) {
        return new Response(
          JSON.stringify({ success: false, error: "Feature not found" }),
          {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // For now, since feature access is tied to app access,
      // we can't revoke individual features without revoking app access
      // In the future, we could implement granular feature permissions

      return new Response(
        JSON.stringify({
          success: false,
          error: "Individual feature revocation not yet implemented. Revoke app access instead."
        }),
        {
          status: 501,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // POST /admin-user-features/:userId/bulk - Bulk assign/revoke features
    if (req.method === "POST" && action === "bulk") {
      const body = await req.json();
      const { features_to_grant = [], features_to_revoke = [] } = body;

      const results = {
        granted: [],
        revoked: [],
        errors: []
      };

      // Process grants
      for (const feature_slug of features_to_grant) {
        try {
          const grantResponse = await fetch(`${url.origin}/functions/v1/admin-user-features/${userId}/grant`, {
            method: "POST",
            headers: {
              "Authorization": authHeader,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ feature_slug }),
          });

          const grantResult = await grantResponse.json();
          if (grantResult.success) {
            results.granted.push(feature_slug);
          } else {
            results.errors.push({ feature_slug, error: grantResult.error, action: "grant" });
          }
        } catch (error) {
          results.errors.push({ feature_slug, error: error.message, action: "grant" });
        }
      }

      // Process revokes
      for (const feature_slug of features_to_revoke) {
        try {
          const revokeResponse = await fetch(`${url.origin}/functions/v1/admin-user-features/${userId}/revoke`, {
            method: "POST",
            headers: {
              "Authorization": authHeader,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ feature_slug }),
          });

          const revokeResult = await revokeResponse.json();
          if (revokeResult.success) {
            results.revoked.push(feature_slug);
          } else {
            results.errors.push({ feature_slug, error: revokeResult.error, action: "revoke" });
          }
        } catch (error) {
          results.errors.push({ feature_slug, error: error.message, action: "revoke" });
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: `Bulk operation completed. Granted: ${results.granted.length}, Revoked: ${results.revoked.length}, Errors: ${results.errors.length}`,
          data: results
        }),
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