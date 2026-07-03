import { useMemo } from "react";
import { useClerk, useUser } from "@clerk/clerk-react";
import { supabase } from "./supabase";

const CLERK_SYNC_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/clerk-sync`;
const REDIRECT_URL = (import.meta.env.VITE_SITE_URL || window.location.origin) + "/auth/callback";

export function useClerkSync() {
  const { session } = useClerk();
  const { user, isSignedIn, isLoaded } = useUser();

  const ensureSupabaseSessionFromClerk = async () => {
    if (!isLoaded || !isSignedIn || !user) {
      return false;
    }

    const primaryEmail = user.primaryEmailAddress?.emailAddress;
    if (!primaryEmail) {
      console.warn("[clerkSync] Clerk user missing primary email");
      return false;
    }

    const { data } = await supabase.auth.getUser();
    if (data.user) {
      console.log("[clerkSync] Supabase session already active");
      return true;
    }

    if (!import.meta.env.VITE_SUPABASE_URL || !session?.lastActiveToken) {
      console.warn("[clerkSync] Missing SUPABASE_URL or Clerk session token");
      return false;
    }

    const clerkToken = session.lastActiveToken.getRawString?.() || null;
    if (!clerkToken) {
      console.warn("[clerkSync] Clerk session token unavailable");
      return false;
    }

    try {
      const response = await fetch(CLERK_SYNC_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${clerkToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: primaryEmail.toLowerCase(),
          clerk_user_id: user.id,
          redirect_to: `${REDIRECT_URL}?clerk_sync=true`,
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`clerk-sync failed (${response.status}): ${text}`);
      }

      const result = await response.json();

      if (result.action_link) {
        window.location.replace(result.action_link);
        return true;
      }

      if (result.access_token && result.refresh_token) {
        await supabase.auth.setSession({
          access_token: result.access_token,
          refresh_token: result.refresh_token,
        });
        return true;
      }

      console.warn("[clerkSync] Unexpected response from clerk-sync function", result);
      return false;
    } catch (error) {
      console.error("[clerkSync] Failed to establish Supabase session from Clerk:", error);
      return false;
    }
  };

  const memoizedSync = useMemo(
    () => ensureSupabaseSessionFromClerk,
    [isLoaded, isSignedIn, user?.id, session?.lastActiveToken]
  );

  return {
    isSignedIn,
    isLoaded,
    clerkUser: user,
    ensureSupabaseSessionFromClerk: memoizedSync,
  };
}

export function isClerkConfigured() {
  return Boolean(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);
}
