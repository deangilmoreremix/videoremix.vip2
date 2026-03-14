import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@4";

// Input validation schemas
const userCreateSchema = z.object({
  email: z.string().email().max(254),
  first_name: z.string().max(50).optional(),
  last_name: z.string().max(50).optional(),
  role: z.enum(['user', 'admin', 'super_admin']).default('user'),
});

const bulkUserCreateSchema = z.object({
  users: z.array(userCreateSchema).max(100), // Limit bulk operations to 100 users
});

const userUpdateSchema = z.object({
  id: z.string().uuid(),
  is_active: z.boolean(),
});

// Simple in-memory rate limiter for Edge Functions
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function checkAdminRateLimit(userId: string, action: string = 'default'): { allowed: boolean; error?: string } {
  const key = `admin:${userId}:${action}`;
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxRequests = action === 'delete' ? 10 : action === 'create' ? 50 : 100;

  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetTime) {
    // First request or window expired
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + windowMs
    });
    return { allowed: true };
  }

  if (entry.count >= maxRequests) {
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
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
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

    // Rate limiting for admin operations
    const rateLimitResult = await checkAdminRateLimit(user.id, req.method.toLowerCase());
    if (!rateLimitResult.allowed) {
      return new Response(
        JSON.stringify({ success: false, error: rateLimitResult.error }),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
            "Retry-After": Math.ceil((Date.now() + 60000) / 1000).toString()
          },
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
      // Validate bulk user creation input
      const validationResult = bulkUserCreateSchema.safeParse(body);
      if (!validationResult.success) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Invalid input data",
            details: validationResult.error.issues
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const { users } = validationResult.data;
      const createdUsers = [];
      const errors = [];

      for (const userData of users) {
        try {
          // Generate cryptographically secure password
          const crypto = globalThis.crypto || require('crypto').webcrypto;
          const password = Array.from(crypto.getRandomValues(new Uint8Array(16)))
            .map(byte => byte.toString(36))
            .join('')
            .slice(0, 16) + "Aa1!@";

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
            // Log failed user creation
            await supabase.rpc('log_admin_user_operation', {
              p_operation: 'BULK_OPERATION',
              p_target_user_id: null,
              p_operation_details: { action: 'create_user', email: userData.email, error: createError.message },
              p_success: false,
              p_error_message: createError.message
            });
            continue;
          }
    
          await supabase
            .from("user_roles")
            .insert({
              user_id: newUser.user.id,
              role: userData.role || "user",
            });
    
          // Log successful user creation
          await supabase.rpc('log_admin_user_operation', {
            p_operation: 'CREATE',
            p_target_user_id: newUser.user.id,
            p_operation_details: { action: 'bulk_create_user', email: userData.email, role: userData.role || "user" },
            p_success: true
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

    // Validate single user creation input
    const validationResult = userCreateSchema.safeParse(body);
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid input data",
          details: validationResult.error.issues
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const userData = validationResult.data;

    // Generate cryptographically secure password
    const crypto = globalThis.crypto || require('crypto').webcrypto;
    const password = Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map(byte => byte.toString(36))
      .join('')
      .slice(0, 16) + "Aa1!@";

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
        role: userData.role,
      });

    // Log successful single user creation
    await supabase.rpc('log_admin_user_operation', {
      p_operation: 'CREATE',
      p_target_user_id: newUser.user.id,
      p_operation_details: { action: 'create_user', email: userData.email, role: userData.role },
      p_success: true
    });

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          id: newUser.user.id,
          email: newUser.user.email,
          first_name: userData.first_name || "",
          last_name: userData.last_name || "",
          role: userData.role,
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

    // Log user deletion attempt
    await supabase.rpc('log_admin_user_operation', {
      p_operation: 'DELETE',
      p_target_user_id: userId,
      p_operation_details: { action: 'delete_user' },
      p_success: deleteError ? false : true,
      p_error_message: deleteError?.message
    });

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
