import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { Webhook } from "npm:svix@1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, svix-id, svix-timestamp, svix-signature",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface ClerkEmail {
  email_address: string;
  verification?: { status?: string };
  linked_to?: unknown;
}

function primaryEmail(data: {
  email_addresses?: ClerkEmail[];
  primary_email_address_id?: string | null;
}): string | null {
  const emails = data.email_addresses ?? [];
  if (data.primary_email_address_id) {
    const primary = emails.find(
      (e) => e.email_address && e.verification?.status === "verified",
    );
    if (primary) return primary.email_address;
  }
  return emails[0]?.email_address ?? null;
}

function buildProfile(data: any) {
  const fullName = [data.first_name, data.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();
  return {
    user_id: data.id,
    email: primaryEmail(data),
    full_name: fullName || null,
    avatar_url: data.image_url || null,
    updated_at: new Date().toISOString(),
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const secret = Deno.env.get("CLERK_WEBHOOK_SECRET");
  if (!secret) {
    return new Response(
      JSON.stringify({ error: "CLERK_WEBHOOK_SECRET is not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const svixId = req.headers.get("svix-id") ?? "";
  const svixTimestamp = req.headers.get("svix-timestamp") ?? "";
  const svixSignature = req.headers.get("svix-signature") ?? "";

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response(
      JSON.stringify({ error: "Missing svix headers" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const payload = await req.text();
  let evt: { type: string; data: any };
  try {
    const wh = new Webhook(secret);
    evt = wh.verify(payload, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as { type: string; data: any };
  } catch (err) {
    console.error("Webhook verification failed:", err);
    return new Response(
      JSON.stringify({ error: "Invalid signature" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  try {
    switch (evt.type) {
      case "user.created":
      case "user.updated": {
        const { error } = await supabase
          .from("profiles")
          .upsert(buildProfile(evt.data), { onConflict: "user_id" });
        if (error) throw error;
        break;
      }
      case "user.deleted": {
        const { error } = await supabase
          .from("profiles")
          .delete()
          .eq("user_id", evt.data.id);
        if (error) throw error;
        break;
      }
      default:
        // Ignore other event types
        break;
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Sync error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
