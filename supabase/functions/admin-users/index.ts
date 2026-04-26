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

    return handleRequest(req, supabase);
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

async function handleRequest(req: Request, supabase: any) {
  const url = new URL(req.url);
  const pathParts = url.pathname.split("/").filter(Boolean);
  const userId = pathParts[pathParts.length - 2];
  const action = pathParts[pathParts.length - 1];
  const isBulk = url.searchParams.get("bulk") === "true";

  if (req.method === "GET") {
    // Fetch ALL users with pagination (not just first 50)
    let allUsers = [];
    let page = 1;
    const perPage = 1000;
    while (true) {
      const { data: authUsersPage, error: authError } = await supabase.auth.admin.listUsers({ page, perPage });

      if (authError) {
        return new Response(
          JSON.stringify({ success: false, error: authError.message }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      allUsers = allUsers.concat(authUsersPage.users);
      if (authUsersPage.users.length < perPage) break;
      page++;
    }

    const authUsers = { users: allUsers };

    const { data: roles } = await supabase
      .from("user_roles")
      .select("user_id, role");

    const rolesMap = new Map(roles?.map((r: any) => [r.user_id, r.role]) || []);

    // Fetch app access for all users
    const { data: appAccessData } = await supabase
      .from("user_app_access")
      .select("user_id, app_slug, is_active")
      .eq("is_active", true);

    const appAccessMap = new Map<string, string[]>();
    appAccessData?.forEach((access: any) => {
      if (!appAccessMap.has(access.user_id)) {
        appAccessMap.set(access.user_id, []);
      }
      appAccessMap.get(access.user_id)?.push(access.app_slug);
    });

    const users = authUsers.users.map((user: any) => ({
      id: user.id,
      email: user.email,
      first_name: user.user_metadata?.first_name || "",
      last_name: user.user_metadata?.last_name || "",
      role: rolesMap.get(user.id) || "user",
      is_active: !user.banned_until,
      created_at: user.created_at,
      last_login: user.last_sign_in_at,
      app_access: appAccessMap.get(user.id) || [],
      app_count: (appAccessMap.get(user.id) || []).length,
    }));

    return new Response(
      JSON.stringify({ success: true, data: users }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  if (req.method === "PUT") {
    const body = await req.json();
    const updateUserId = body.id;

    if (body.is_active !== undefined) {
      const { data: user, error: getUserError } = await supabase.auth.admin.getUserById(updateUserId);

      if (getUserError || !user) {
        return new Response(
          JSON.stringify({ success: false, error: "User not found" }),
          {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const updateData = body.is_active
        ? { ban_duration: "none" }
        : { ban_duration: "876000h" };

      const { error: updateError } = await supabase.auth.admin.updateUserById(
        updateUserId,
        updateData
      );

      if (updateError) {
        return new Response(
          JSON.stringify({ success: false, error: updateError.message }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  if (req.method === "POST" && !action) {
    const body = await req.json();

    if (isBulk && body.users) {
      const createdUsers = [];
      const errors = [];

      for (const userData of body.users) {
        try {
          const password = Math.random().toString(36).slice(-12) + "Aa1!";
          const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
            email: userData.email,
            password: password,
            email_confirm: true,
            user_metadata: {
              first_name: userData.first_name || "",
              last_name: userData.last_name || "",
            },
          });

          if (createError) {
            errors.push({ email: userData.email, error: createError.message });
            continue;
          }

          await supabase
            .from("user_roles")
            .insert({
              user_id: newUser.user.id,
              role: userData.role || "user",
            });

          createdUsers.push({
            id: newUser.user.id,
            email: newUser.user.email,
            first_name: userData.first_name || "",
            last_name: userData.last_name || "",
            role: userData.role || "user",
            is_active: true,
            created_at: newUser.user.created_at,
          });
        } catch (err) {
          errors.push({ email: userData.email, error: err.message });
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          data: createdUsers,
          errors: errors,
          count: createdUsers.length,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const password = Math.random().toString(36).slice(-12) + "Aa1!";
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: body.email,
      password: password,
      email_confirm: true,
      user_metadata: {
        first_name: body.first_name || "",
        last_name: body.last_name || "",
      },
    });

    if (createError) {
      return new Response(
        JSON.stringify({ success: false, error: createError.message }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    await supabase
      .from("user_roles")
      .insert({
        user_id: newUser.user.id,
        role: body.role || "user",
      });

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          id: newUser.user.id,
          email: newUser.user.email,
          first_name: body.first_name || "",
          last_name: body.last_name || "",
          role: body.role || "user",
          is_active: true,
          created_at: newUser.user.created_at,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  if (req.method === "DELETE") {
    const body = await req.json();
    const deleteUserId = body.id;

    const { error: deleteError } = await supabase.auth.admin.deleteUser(deleteUserId);

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

  // Handle app access management for specific users
  if (action === "app-access") {
    if (req.method === "GET") {
      // Get app access for a specific user
      const { data: userAccess, error: accessError } = await supabase
        .from("user_app_access")
        .select(`
          app_slug,
          is_active,
          access_type,
          granted_at,
          expires_at
        `)
        .eq("user_id", userId)
        .eq("is_active", true);

      if (accessError) {
        return new Response(
          JSON.stringify({ success: false, error: accessError.message }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Get all available apps
      const { data: apps, error: appsError } = await supabase
        .from("apps")
        .select("slug, name, category")
        .eq("is_active", true)
        .order("category", { ascending: true })
        .order("name", { ascending: true });

      if (appsError) {
        return new Response(
          JSON.stringify({ success: false, error: appsError.message }),
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
            user_access: userAccess || [],
            available_apps: apps || [],
          },
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (req.method === "POST") {
      // Grant app access to a user
      const body = await req.json();
      const { app_slugs, access_type = "lifetime" } = body;

      if (!app_slugs || !Array.isArray(app_slugs)) {
        return new Response(
          JSON.stringify({ success: false, error: "app_slugs array is required" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const accessRecords = app_slugs.map((slug: string) => ({
        user_id: userId,
        app_slug: slug,
        access_type: access_type,
        is_active: true,
        granted_at: new Date().toISOString(),
      }));

      const { error: insertError } = await supabase
        .from("user_app_access")
        .upsert(accessRecords, {
          onConflict: "user_id,app_slug",
        });

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
        JSON.stringify({
          success: true,
          message: `Granted access to ${app_slugs.length} apps`,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (req.method === "DELETE") {
      // Revoke app access from a user
      const body = await req.json();
      const { app_slugs } = body;

      if (!app_slugs || !Array.isArray(app_slugs)) {
        return new Response(
          JSON.stringify({ success: false, error: "app_slugs array is required" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const { error: deleteError } = await supabase
        .from("user_app_access")
        .update({ is_active: false })
        .eq("user_id", userId)
        .in("app_slug", app_slugs);

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
        JSON.stringify({
          success: true,
          message: `Revoked access to ${app_slugs.length} apps`,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  }

  return new Response(
    JSON.stringify({ success: false, error: "Method not allowed" }),
    {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
}
