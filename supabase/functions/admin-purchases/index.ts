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
    const action = pathParts[pathParts.length - 1];

    if (req.method === "GET") {
      const { data: purchases, error } = await supabase
        .from("purchases")
        .select("*")
        .order("purchase_date", { ascending: false });

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
        JSON.stringify({ success: true, data: purchases || [] }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (req.method === "POST" && action === "import") {
      const body = await req.json();
      const { purchases } = body;

      if (!purchases || !Array.isArray(purchases)) {
        return new Response(
          JSON.stringify({ success: false, error: "Invalid purchases data" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const importedPurchases = [];

      for (const purchase of purchases) {
        try {
          let userId = null;

          const { data: authUser } = await supabase.auth.admin.listUsers();
          const existingUser = authUser?.users.find((u: any) => u.email === purchase.email);

          if (existingUser) {
            userId = existingUser.id;
          } else {
            const password = Math.random().toString(36).slice(-12) + "Aa1!";
            const { data: newUser } = await supabase.auth.admin.createUser({
              email: purchase.email,
              password: password,
              email_confirm: true,
            });

            if (newUser?.user) {
              userId = newUser.user.id;
              await supabase.from("user_roles").insert({
                user_id: userId,
                role: "user",
              });
            }
          }

          const { data: insertedPurchase, error: insertError } = await supabase
            .from("purchases")
            .insert({
              user_id: userId,
              email: purchase.email,
              platform: purchase.platform || "manual",
              platform_transaction_id: purchase.transactionId,
              product_name: purchase.productName,
              amount: purchase.amount,
              currency: "USD",
              status: "completed",
              is_subscription: false,
              purchase_date: new Date().toISOString(),
              processed: true,
            })
            .select()
            .single();

          if (!insertError && insertedPurchase) {
            importedPurchases.push(insertedPurchase);
          }
        } catch (err) {
          console.error("Error importing purchase:", err);
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          count: importedPurchases.length,
          data: importedPurchases,
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
