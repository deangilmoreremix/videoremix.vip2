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
      const url = new URL(req.url);
      const detailedView = url.searchParams.get("detailed") === "true";
      const timeRange = url.searchParams.get("range") || "30";

      const now = new Date();
      const rangeStart = new Date(now.getTime() - parseInt(timeRange) * 24 * 60 * 60 * 1000);

      // Fetch all data in parallel
      const [
        appsResult,
        usersResult,
        purchasesResult,
        subscriptionsResult,
        appAccessResult,
        analyticsEventsResult,
        dailySnapshotsResult,
        revenueResult
      ] = await Promise.all([
        supabase.from("apps").select("id, is_active, category", { count: "exact" }),
        supabase.from("user_roles").select("id, role, created_at", { count: "exact" }),
        supabase.from("purchases").select("id, amount, status, purchase_date, platform, product_name", { count: "exact" }),
        supabase.from("subscription_status").select("id, status", { count: "exact" }),
        supabase.from("user_app_access").select("id, app_slug, is_active, granted_at", { count: "exact" }),
        supabase.from("admin_analytics_events")
          .select("event_type, created_at, metadata")
          .gte("created_at", rangeStart.toISOString()),
        supabase.from("daily_analytics_snapshots")
          .select("*")
          .gte("snapshot_date", rangeStart.toISOString().split('T')[0])
          .order("snapshot_date", { ascending: false })
          .limit(parseInt(timeRange)),
        supabase.from("revenue_analytics")
          .select("*")
          .gte("date", rangeStart.toISOString().split('T')[0])
          .order("date", { ascending: false })
      ]);

      // Calculate basic stats
      const totalApps = appsResult.count || 0;
      const activeApps = appsResult.data?.filter(app => app.is_active).length || 0;
      const inactiveApps = totalApps - activeApps;

      const totalUsers = usersResult.count || 0;
      const adminCount = usersResult.data?.filter(u => u.role === 'admin' || u.role === 'super_admin').length || 0;
      const regularUsers = totalUsers - adminCount;

      // Calculate user growth
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      const newUsersThisMonth = usersResult.data?.filter(u =>
        new Date(u.created_at) > lastMonth
      ).length || 0;
      const userGrowthPercentage = totalUsers > 0
        ? Math.round((newUsersThisMonth / totalUsers) * 100)
        : 0;

      // Calculate purchase stats
      const completedPurchases = purchasesResult.data?.filter(p => p.status === 'completed') || [];
      const totalRevenue = completedPurchases.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
      const recentPurchases = completedPurchases.filter(p =>
        new Date(p.purchase_date) > rangeStart
      );
      const recentRevenue = recentPurchases.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);

      // Calculate subscription stats
      const activeSubscriptions = subscriptionsResult.data?.filter(s => s.status === 'active').length || 0;
      const cancelledSubscriptions = subscriptionsResult.data?.filter(s => s.status === 'cancelled').length || 0;
      const totalSubscriptions = subscriptionsResult.count || 0;

      // Calculate app access stats
      const activeAccessCount = appAccessResult.data?.filter(a => a.is_active).length || 0;
      const recentAccessGrants = appAccessResult.data?.filter(a =>
        new Date(a.granted_at) > rangeStart
      ).length || 0;

      // Basic stats response
      const basicStats = {
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
          growth: `+${userGrowthPercentage}% this month`,
          regular: regularUsers,
          admins: adminCount,
          newThisMonth: newUsersThisMonth
        },
        purchases: {
          total: completedPurchases.length,
          recent: recentPurchases.length,
          revenue: totalRevenue.toFixed(2),
          recentRevenue: recentRevenue.toFixed(2)
        },
        subscriptions: {
          total: totalSubscriptions,
          active: activeSubscriptions,
          cancelled: cancelledSubscriptions
        },
        appAccess: {
          total: activeAccessCount,
          recentGrants: recentAccessGrants
        }
      };

      // Return basic stats if not detailed
      if (!detailedView) {
        return new Response(
          JSON.stringify({ success: true, data: basicStats }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Detailed analytics
      // Event breakdown
      const eventBreakdown = {};
      analyticsEventsResult.data?.forEach(event => {
        eventBreakdown[event.event_type] = (eventBreakdown[event.event_type] || 0) + 1;
      });

      // Top apps by access
      const appAccessMap = {};
      appAccessResult.data?.forEach(access => {
        if (access.is_active) {
          appAccessMap[access.app_slug] = (appAccessMap[access.app_slug] || 0) + 1;
        }
      });
      const topApps = Object.entries(appAccessMap)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([slug, count]) => ({ app_slug: slug, user_count: count }));

      // Revenue by platform
      const revenueByPlatform = {};
      completedPurchases.forEach(p => {
        const platform = p.platform || 'unknown';
        if (!revenueByPlatform[platform]) {
          revenueByPlatform[platform] = { count: 0, revenue: 0 };
        }
        revenueByPlatform[platform].count += 1;
        revenueByPlatform[platform].revenue += parseFloat(p.amount) || 0;
      });

      // Top products
      const productMap = {};
      completedPurchases.forEach(p => {
        const product = p.product_name || 'Unknown';
        if (!productMap[product]) {
          productMap[product] = { count: 0, revenue: 0 };
        }
        productMap[product].count += 1;
        productMap[product].revenue += parseFloat(p.amount) || 0;
      });
      const topProducts = Object.entries(productMap)
        .sort(([, a], [, b]) => b.revenue - a.revenue)
        .slice(0, 10)
        .map(([name, data]) => ({ name, ...data }));

      // Daily trends from snapshots
      const dailyTrends = dailySnapshotsResult.data?.map(snapshot => ({
        date: snapshot.snapshot_date,
        users: snapshot.total_users,
        activeUsers: snapshot.active_users,
        newUsers: snapshot.new_users,
        revenue: parseFloat(snapshot.revenue_usd) || 0,
        purchases: snapshot.total_purchases,
        activeSubscriptions: snapshot.active_subscriptions
      })) || [];

      // App category breakdown
      const categoryBreakdown = {};
      appsResult.data?.forEach(app => {
        const category = app.category || 'Uncategorized';
        if (!categoryBreakdown[category]) {
          categoryBreakdown[category] = { total: 0, active: 0 };
        }
        categoryBreakdown[category].total += 1;
        if (app.is_active) {
          categoryBreakdown[category].active += 1;
        }
      });

      const detailedStats = {
        ...basicStats,
        analytics: {
          eventBreakdown,
          topApps,
          revenueByPlatform,
          topProducts,
          dailyTrends,
          categoryBreakdown
        },
        metrics: {
          avgRevenuePerUser: totalUsers > 0 ? (totalRevenue / totalUsers).toFixed(2) : 0,
          avgRevenuePerPurchase: completedPurchases.length > 0 ? (totalRevenue / completedPurchases.length).toFixed(2) : 0,
          subscriptionRetentionRate: totalSubscriptions > 0 ? ((activeSubscriptions / totalSubscriptions) * 100).toFixed(1) : 0,
          avgAppsPerUser: totalUsers > 0 ? (activeAccessCount / totalUsers).toFixed(1) : 0
        }
      };

      return new Response(
        JSON.stringify({ success: true, data: detailedStats }),
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
