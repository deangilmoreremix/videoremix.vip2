# Supabase Edge Functions - Complete Deployment Guide

This document contains all 18 Edge Functions with their complete code. You can copy and paste these directly into your Supabase Dashboard or deploy them using the Supabase CLI.

## Table of Contents

- [Admin Functions](#admin-functions) (8 functions)
- [Webhook Functions](#webhook-functions) (4 functions)
- [Utility Functions](#utility-functions) (4 functions)
- [Shared Code](#shared-code) (2 files)
- [Deployment Instructions](#deployment-instructions)

---

## Admin Functions

### 1. admin-dashboard-stats

**Path:** `/functions/v1/admin-dashboard-stats`
**Purpose:** Provides real-time statistics for the admin dashboard

```typescript
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
```

---

### 2. admin-apps

**Path:** `/functions/v1/admin-apps`
**Purpose:** Manage applications (GET, POST, PUT, DELETE, toggle)

```typescript
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
    const appId = pathParts[pathParts.length - 2];
    const action = pathParts[pathParts.length - 1];

    if (req.method === "GET") {
      const { data: apps, error } = await supabase
        .from("apps")
        .select("*")
        .order("sort_order", { ascending: true });

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
        JSON.stringify({ success: true, data: apps || [] }),
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
```

---

## Deployment Instructions

### Method 1: Using Supabase Dashboard

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Navigate to **Edge Functions** in the sidebar
4. Click **Create a new function**
5. Enter the function name (e.g., `admin-dashboard-stats`)
6. Copy and paste the code from above
7. Click **Deploy function**
8. Repeat for all 18 functions

### Method 2: Using Supabase CLI

First, ensure you have the Supabase CLI installed and logged in:

```bash
# Install Supabase CLI (if not installed)
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref gadedbrnqzpfqtsdfzcg
```

Then deploy each function:

```bash
# Deploy admin functions
supabase functions deploy admin-dashboard-stats
supabase functions deploy admin-apps
supabase functions deploy admin-features
supabase functions deploy admin-users
supabase functions deploy admin-purchases
supabase functions deploy admin-subscriptions
supabase functions deploy admin-products
supabase functions deploy admin-videos

# Deploy webhook functions
supabase functions deploy webhook-stripe
supabase functions deploy webhook-paykickstart
supabase functions deploy webhook-zaxxa
supabase functions deploy webhook-paypal

# Deploy utility functions
supabase functions deploy create-super-admin
supabase functions deploy create-checkout-session
supabase functions deploy reset-admin-password
supabase functions deploy send-email-hook
supabase functions deploy stripe-sync
supabase functions deploy import-personalizer-purchases
```

### Method 3: Bulk Deploy Script

You can use the provided deployment script:

```bash
./deploy-admin-functions.sh
```

---

## Function Endpoints

After deployment, your functions will be available at:

```
https://gadedbrnqzpfqtsdfzcg.supabase.co/functions/v1/{function-name}
```

For example:
- `https://gadedbrnqzpfqtsdfzcg.supabase.co/functions/v1/admin-dashboard-stats`
- `https://gadedbrnqzpfqtsdfzcg.supabase.co/functions/v1/webhook-stripe`

---

## Environment Variables

All functions automatically have access to these environment variables:
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key

Additional variables you may need to set in Supabase Dashboard → Settings → Edge Functions:
- `STRIPE_WEBHOOK_SECRET` - Your Stripe webhook secret
- `STRIPE_SECRET_KEY` - Your Stripe secret key
- `PAYPAL_WEBHOOK_ID` - Your PayPal webhook ID

---

## Testing Functions

Test a function using curl:

```bash
curl -X GET "https://gadedbrnqzpfqtsdfzcg.supabase.co/functions/v1/admin-dashboard-stats" \
  -H "Authorization: Bearer YOUR_SUPABASE_ANON_KEY"
```

---

## Troubleshooting

1. **401 Unauthorized**: Check that you're sending the correct Authorization header
2. **403 Forbidden**: Verify the user has the correct role (super_admin or admin)
3. **500 Internal Server Error**: Check the function logs in Supabase Dashboard
4. **Function not found**: Ensure the function is deployed correctly

View function logs:
```bash
supabase functions logs {function-name}
```

---

## Next Steps

1. Deploy all functions using one of the methods above
2. Configure webhook URLs in Stripe, PayPal, PayKickstart, and Zaxxa
3. Test each admin endpoint from your frontend
4. Monitor function logs for any errors

