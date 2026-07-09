import { useSession } from "../providers/ClerkProvider";
import { useCallback } from "react";

/**
 * Returns a function that retrieves the current Clerk session token.
 *
 * Use this anywhere you need to make a raw fetch() call to a Supabase
 * Edge Function. The Supabase client is configured with the Clerk token
 * via the `accessToken` option, so it can't be used here.
 *
 * @example
 *   const getToken = useSupabaseToken();
 *   const response = await fetch(url, {
 *     headers: { Authorization: `Bearer ${await getToken()}` },
 *   });
 */
export function useSupabaseToken(): () => Promise<string | null> {
  const { session } = useSession();
  return useCallback(async () => {
    if (!session) return null;
    try {
      return (await session.getToken()) ?? null;
    } catch {
      return null;
    }
  }, [session]);
}
