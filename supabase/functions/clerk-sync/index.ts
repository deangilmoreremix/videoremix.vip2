import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function verifyClerkToken(token: string): Promise<{ sub: string }> {
  const res = await fetch("https://api.clerk.com/v1/sessions/me/verify", {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error(`Clerk token verification failed: ${res.status}`);
  }

  const data = await res.json();
  const userId = data.user_id || data.sub || data.id;
  if (!userId) {
    throw new Error("Clerk response missing user identifier");
  }

  return { sub: String(userId) };
}

async function getClerkUserEmail(clerkUserId: string, clerkSecretKey: string): Promise<string | null> {
  const res = await fetch(`https://api.clerk.com/v1/users/${encodeURIComponent(clerkUserId)}`, {
    headers: { Authorization: `Bearer ${clerkSecretKey}` },
  });

  if (!res.ok) {
    return null;
  }

  const user = await res.json();
  const primary = user.email_addresses?.find((e: any) => e.id === user.primary_email_address_id);
  return primary?.email_address || user.primary_email_address || null;
}

async function supabaseFetch(supabaseUrl: string, serviceRoleKey: string, path: string, init?: RequestInit) {
  const res = await fetch(`${supabaseUrl}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${serviceRoleKey}`,
      apikey: serviceRoleKey,
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase ${path} failed (${res.status}): ${text}`);
  }
  return res;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const clerkSecretKey = Deno.env.get("CLERK_SECRET_KEY");

    if (!supabaseUrl || !serviceRoleKey || !clerkSecretKey) {
      return jsonResponse({ error: "Server configuration missing" }, 500);
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return jsonResponse({ error: "Missing authorization token" }, 401);
    }

    const token = authHeader.replace("Bearer ", "");
    let clerkUserId: string;
    try {
      const verified = await verifyClerkToken(token);
      clerkUserId = verified.sub;
    } catch (error) {
      console.error("clerk-sync token verification failed:", error);
      return jsonResponse({ error: "Invalid Clerk session" }, 401);
    }

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      // body optional
    }

    const requestedEmail = typeof body.email === "string" ? body.email.toLowerCase().trim() : null;
    const redirectTo = typeof body.redirect_to === "string" ? body.redirect_to : `${supabaseUrl}/auth/v1/callback`;

    let targetUserId: string | null = null;
    let tenantId: string | null = null;

    const profilesRes = await supabaseFetch(
      supabaseUrl,
      serviceRoleKey,
      `/rest/v1/profiles?clerk_user_id=eq.${encodeURIComponent(clerkUserId)}&select=user_id,tenant_id`
    );
    const profiles = await profilesRes.json();
    const existingProfile = Array.isArray(profiles) ? profiles[0] : profiles;

    if (existingProfile?.user_id) {
      targetUserId = existingProfile.user_id;
      tenantId = existingProfile.tenant_id || null;
    }

    const email = requestedEmail || (await getClerkUserEmail(clerkUserId, clerkSecretKey));
    if (!email) {
      return jsonResponse({ error: "Unable to resolve Clerk user email" }, 400);
    }

    if (!targetUserId) {
      const listRes = await supabaseFetch(
        supabaseUrl,
        serviceRoleKey,
        `/rest/v1/users?email=eq.${encodeURIComponent(email)}&select=id&limit=1`
      );
      const listData = await listRes.json();
      const matchedUser = Array.isArray(listData) ? listData[0] : listData;

      if (matchedUser?.id) {
        targetUserId = matchedUser.id;
      } else {
        const randomPassword = crypto.randomUUID();
        const createRes = await supabaseFetch(
          supabaseUrl,
          serviceRoleKey,
          `/auth/v1/admin/users`,
          {
            method: "POST",
            body: JSON.stringify({
              email,
              password: randomPassword,
              email_confirm: true,
            }),
          }
        );
        const createData = await createRes.json();
        targetUserId = createData?.id;
        if (!targetUserId) {
          return jsonResponse({ error: "Failed to create user account" }, 500);
        }
      }
    }

    if (!tenantId) {
      const tenantRes = await supabaseFetch(
        supabaseUrl,
        serviceRoleKey,
        `/rest/v1/tenants?select=id&limit=1`
      );
      const tenantData = await tenantRes.json();
      tenantId = Array.isArray(tenantData) ? tenantData[0]?.id || targetUserId : targetUserId;
    }

    await supabaseFetch(
      supabaseUrl,
      serviceRoleKey,
      `/rest/v1/profiles?user_id=eq.${encodeURIComponent(targetUserId)}`,
      {
        method: "POST",
        body: JSON.stringify({
          user_id: targetUserId,
          email,
          clerk_user_id: clerkUserId,
          tenant_id: tenantId,
        }),
        headers: { Prefer: "resolution=merge-duplicates" },
      }
    );

    const linkRes = await supabaseFetch(
      supabaseUrl,
      serviceRoleKey,
      `/auth/v1/admin/users/${encodeURIComponent(targetUserId)}/generate_link`,
      {
        method: "POST",
        body: JSON.stringify({
          type: "magiclink",
          email,
          options: {
            redirectTo: redirectTo,
          },
        }),
      }
    );

    const linkData = await linkRes.json();
    const actionLink = linkData?.properties?.action_link;
    if (!actionLink) {
      console.error("Supabase generateLink missing action_link", linkData);
      return jsonResponse({ error: "Failed to establish session link" }, 500);
    }

    return jsonResponse({
      success: true,
      action_link: actionLink,
      supabase_user_id: targetUserId,
    });
  } catch (error: any) {
    console.error("clerk-sync error:", error);
    return jsonResponse({ error: error.message || "Internal server error" }, 500);
  }
});
