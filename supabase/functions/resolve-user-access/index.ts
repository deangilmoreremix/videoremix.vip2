// resolve-user-access
//
// Returns the apps the current Clerk-authenticated user can access. The
// primary source of truth is the `user_app_access` table, which the Stripe /
// PayPal / Zaxxa webhooks populate directly with Clerk user_ids. This edge
// function exists for legacy CSV-imported purchase data.
//
// In the current production schema the legacy tables (import_user_records,
// product_app_mappings, access_tiers) do not exist. The function detects
// their absence and returns an empty access list — the frontend's
// useUserAccess hook reads `user_app_access` directly and will still show
// the user's apps correctly. If/when the legacy tables are deployed, this
// function will automatically start resolving them.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
  "Access-Control-Max-Age": "86400",
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

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/**
 * Returns true if the legacy CSV-import tables exist in the database.
 * We probe information_schema once per cold start and cache the result.
 */
let legacyTablesExistCache: boolean | null = null;
async function legacyTablesExist(supabase: ReturnType<typeof createClient>): Promise<boolean> {
  if (legacyTablesExistCache !== null) return legacyTablesExistCache;
  const { data, error } = await supabase
    .from("information_schema.tables")
    .select("table_name")
    .eq("table_schema", "public")
    .in("table_name", ["import_user_records", "product_app_mappings", "access_tiers"]);
  legacyTablesExistCache = !error && (data?.length ?? 0) === 3;
  return legacyTablesExistCache;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !supabaseKey) {
    return jsonResponse({ success: false, error: "Server misconfigured" }, 500);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Auth: verify the Clerk JWT and extract the Clerk user id.
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return jsonResponse({ success: false, error: "Missing bearer token" }, 401);
  }
  const token = authHeader.slice(7);

  let clerkUserId: string;
  try {
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user?.id) {
      return jsonResponse(
        { success: false, error: "Invalid or expired token" },
        401,
      );
    }
    clerkUserId = data.user.id;
  } catch (err) {
    console.error("JWT verification failed:", err);
    return jsonResponse({ success: false, error: "Auth failed" }, 401);
  }

  try {
    // If the legacy tables aren't deployed, return empty access. The
    // frontend reads user_app_access directly and will still show the
    // user's apps.
    if (!(await legacyTablesExist(supabase))) {
      return jsonResponse({
        success: true,
        data: { hasAccess: false, apps: [], products: [] },
        note: "Legacy CSV import tables not present; access resolved from user_app_access only.",
      });
    }

    // 1. Read the user's import records (CSV-imported purchases).
    const { data: userRecords, error: recordsError } = await supabase
      .from("import_user_records")
      .select(`
        id,
        product_name,
        import_product_id,
        import_products!inner (
          id,
          product_name,
          is_mapped
        )
      `)
      .eq("user_id", clerkUserId)
      .eq("processing_status", "processed");

    if (recordsError) {
      console.error("import_user_records query failed:", recordsError);
      return jsonResponse(
        { success: false, error: "Failed to load import records" },
        500,
      );
    }

    if (!userRecords || userRecords.length === 0) {
      return jsonResponse({
        success: true,
        data: { hasAccess: false, apps: [], products: [] },
      });
    }

    const productIds = userRecords
      .map((r) => r.import_product_id)
      .filter((id): id is string => !!id);

    // 2. Resolve which apps each imported product grants access to.
    const { data: mappings, error: mappingsError } = await supabase
      .from("product_app_mappings")
      .select(`
        id,
        import_product_id,
        app_id,
        access_tier_id,
        is_active,
        import_products!inner ( product_name ),
        apps!inner ( id, slug, name ),
        access_tiers!inner ( tier_name, tier_level, display_name )
      `)
      .in("import_product_id", productIds)
      .eq("is_active", true);

    if (mappingsError) {
      console.error("product_app_mappings query failed:", mappingsError);
      return jsonResponse(
        { success: false, error: "Failed to load app mappings" },
        500,
      );
    }

    // 3. Collapse mappings into a per-app access list. If two products
    //    grant the same app at different tiers, keep the higher tier and
    //    merge the "grantedBy" product names.
    const appAccessMap = new Map<string, AppAccess>();
    for (const mapping of (mappings ?? []) as any[]) {
      const appId: string = mapping.app_id;
      const current = appAccessMap.get(appId);
      const tierLevel: number = mapping.access_tiers.tier_level;
      const productName: string = mapping.import_products.product_name;

      if (!current) {
        appAccessMap.set(appId, {
          appId: mapping.apps.id,
          appSlug: mapping.apps.slug,
          appName: mapping.apps.name,
          accessTier: mapping.access_tiers.tier_name,
          tierLevel,
          tierDisplayName: mapping.access_tiers.display_name,
          grantedBy: [productName],
        });
        continue;
      }

      if (tierLevel > current.tierLevel) {
        current.accessTier = mapping.access_tiers.tier_name;
        current.tierLevel = tierLevel;
        current.tierDisplayName = mapping.access_tiers.display_name;
        current.grantedBy = [productName];
      } else if (tierLevel === current.tierLevel) {
        current.grantedBy.push(productName);
      }
    }

    const apps = Array.from(appAccessMap.values());

    return jsonResponse({
      success: true,
      data: {
        hasAccess: apps.length > 0,
        apps,
        products: userRecords.map((r) => ({
          productId: r.import_product_id,
          productName: r.product_name,
          isMapped: (r.import_products as any)?.is_mapped ?? false,
        })),
      },
    });
  } catch (err: any) {
    console.error("resolve-user-access error:", err);
    return jsonResponse(
      { success: false, error: err?.message ?? "Unexpected error" },
      500,
    );
  }
});
