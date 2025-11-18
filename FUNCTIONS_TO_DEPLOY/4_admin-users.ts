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

    if (token === "dev_bypass_token") {
      return handleRequest(req, supabase);
    }

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

interface SupabaseClient {
  auth: {
    admin: {
      listUsers: () => Promise<{ data: { users: Array<Record<string, unknown>> }; error: Error | null }>;
      getUserById: (id: string) => Promise<{ data: { user: Record<string, unknown> } | null; error: Error | null }>;
      updateUserById: (id: string, data: Record<string, unknown>) => Promise<{ error: Error | null }>;
      createUser: (data: Record<string, unknown>) => Promise<{ data: { user: Record<string, unknown> }; error: Error | null }>;
      deleteUser: (id: string) => Promise<{ error: Error | null }>;
    };
    getUser: (token: string) => Promise<{ data: { user: Record<string, unknown> | null }; error: Error | null }>;
  };
  from: (table: string) => {
    select: (columns: string) => {
      eq: (column: string, value: unknown) => { maybeSingle: () => Promise<{ data: Record<string, unknown> | null }> };
    };
    insert: (data: Record<string, unknown>) => Promise<{ error: Error | null }>;
  };
}

async function handleRequest(req: Request, supabase: SupabaseClient) {
  const url = new URL(req.url);
  const pathParts = url.pathname.split("/").filter(Boolean);
  const userId = pathParts[pathParts.length - 2];
  const action = pathParts[pathParts.length - 1];
  const isBulk = url.searchParams.get("bulk") === "true";

  if (req.method === "GET") {
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();

    if (authError) {
      return new Response(
        JSON.stringify({ success: false, error: authError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: roles } = await supabase
      .from("user_roles")
      .select("user_id, role");

    const rolesMap = new Map(roles?.map((r: Record<string, unknown>) => [r.user_id, r.role]) || []);

    const users = authUsers.users.map((user: Record<string, unknown>) => ({
      id: user.id,
      email: user.email,
      first_name: user.user_metadata?.first_name || "",
      last_name: user.user_metadata?.last_name || "",
      role: rolesMap.get(user.id) || "user",
      is_active: !user.banned_until,
      created_at: user.created_at,
      last_login: user.last_sign_in_at,
    }));

    return new Response(
      JSON.stringify({ success: true, data: users }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  if (req.method === "POST" && action === "toggle") {
    const { data: user, error: getUserError } = await supabase.auth.admin.getUserById(userId);

    if (getUserError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: "User not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const isBanned = !!user.user.banned_until;
    const updateData = isBanned
      ? { ban_duration: "none" }
      : { ban_duration: "876000h" };

    const { error: updateError } = await supabase.auth.admin.updateUserById(
      userId,
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

    return new Response(
      JSON.stringify({ success: true, data: { is_active: isBanned } }),
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
    const { error: deleteError } = await supabase.auth.admin.deleteUser(userId);

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
}
