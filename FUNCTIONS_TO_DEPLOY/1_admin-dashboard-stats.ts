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

    if (req.method === "GET") {
      const [appsResult, usersResult, purchasesResult] = await Promise.all([
        supabase.from("apps").select("id, is_active", { count: "exact" }),
        supabase.from("user_roles").select("id", { count: "exact" }),
        supabase.from("purchases").select("id, created_at", { count: "exact" })
      ]);

      const totalApps = appsResult.count || 0;
      const activeApps = appsResult.data?.filter(app => app.is_active).length || 0;
      const inactiveApps = totalApps - activeApps;

      const totalUsers = usersResult.count || 0;

      const now = new Date();
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      const recentPurchases = purchasesResult.data?.filter(p =>
        new Date(p.created_at) > lastMonth
      ).length || 0;
      const totalPurchases = purchasesResult.count || 0;

      const growthPercentage = totalPurchases > 0
        ? Math.round((recentPurchases / totalPurchases) * 100)
        : 0;

      const stats = {
        totalApps: {
          count: totalApps,
          active: activeApps,
          inactive: inactiveApps
        },
        features: {
          count: totalApps * 2,
          enabled: activeApps * 2,
          disabled: inactiveApps * 2
        },
        users: {
          count: totalUsers,
          growth: `+${growthPercentage}% from last month`
        }
      };

      return new Response(
        JSON.stringify({ success: true, data: stats }),
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
