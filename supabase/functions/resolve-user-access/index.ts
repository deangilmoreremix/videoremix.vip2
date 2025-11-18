import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface AppAccess {
  appId: string;
  appSlug: string;
  appName: string;
  accessTier: string;
  tierLevel: number;
  tierDisplayName: string;
  grantedBy: string[];
}

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
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid authorization" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: userRecords } = await supabase
      .from('import_user_records')
      .select(`
        id,
        product_name,
        import_product_id,
        import_products!inner(
          id,
          product_name,
          is_mapped
        )
      `)
      .eq('user_id', user.id)
      .eq('processing_status', 'processed');

    if (!userRecords || userRecords.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            hasAccess: false,
            apps: [],
            products: [],
          },
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const productIds = userRecords
      .map(r => r.import_product_id)
      .filter(id => id !== null);

    const { data: mappings } = await supabase
      .from('product_app_mappings')
      .select(`
        id,
        import_product_id,
        app_id,
        access_tier_id,
        is_active,
        import_products!inner(product_name),
        apps!inner(id, slug, name),
        access_tiers!inner(tier_name, tier_level, display_name)
      `)
      .in('import_product_id', productIds)
      .eq('is_active', true);

    const appAccessMap = new Map<string, AppAccess>();

    if (mappings) {
      mappings.forEach((mapping: any) => {
        const appId = mapping.app_id;
        const currentAccess = appAccessMap.get(appId);

        if (!currentAccess || mapping.access_tiers.tier_level > currentAccess.tierLevel) {
          appAccessMap.set(appId, {
            appId: mapping.apps.id,
            appSlug: mapping.apps.slug,
            appName: mapping.apps.name,
            accessTier: mapping.access_tiers.tier_name,
            tierLevel: mapping.access_tiers.tier_level,
            tierDisplayName: mapping.access_tiers.display_name,
            grantedBy: [mapping.import_products.product_name],
          });
        } else if (currentAccess && mapping.access_tiers.tier_level === currentAccess.tierLevel) {
          currentAccess.grantedBy.push(mapping.import_products.product_name);
        }
      });
    }

    const apps = Array.from(appAccessMap.values());

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          hasAccess: apps.length > 0,
          apps,
          products: userRecords.map(r => ({
            productId: r.import_product_id,
            productName: r.product_name,
            isMapped: r.import_products?.is_mapped || false,
          })),
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error: any) {
    console.error("Error resolving user access:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Failed to resolve access' }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
