import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Initialize the Supabase clients
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || "";

// Debug logging for environment variables (only in development)
if (import.meta.env.DEV) {
  console.log("Supabase Environment check:", {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseAnonKey,
    mode: import.meta.env.MODE,
  });
}

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "❌ Supabase credentials are not set. Please check your environment variables.",
  );
  console.error("Missing:", {
    VITE_SUPABASE_URL: !supabaseUrl ? "MISSING" : "OK",
    VITE_SUPABASE_ANON_KEY: !supabaseAnonKey ? "MISSING" : "OK",
  });
  console.error(
    "⚠️ Make sure you have a .env file with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY",
  );
  console.error("⚠️ After adding .env, restart your dev server");
  throw new Error("supabaseKey is required.");
}

// Clerk-Supabase native integration: send the Clerk session token on every
// Supabase request via the accessToken callback. AuthContext sets the
// getter to use Clerk's session.getToken() once Clerk is available.
//
// IMPORTANT: When a client is created with `accessToken`, the `auth` namespace
// is disabled by @supabase/supabase-js. This is by design — the client is meant
// to be used with a pre-existing token, not to manage auth state.
//
// For code that needs Supabase auth operations (getUser, getSession, etc.),
// use `supabaseAuth` below. It's a separate client without `accessToken` set.
let getClerkToken: () => Promise<string | null> = async () => null;

export function setClerkTokenGetter(fn: () => Promise<string | null>) {
  getClerkToken = fn;
}

/**
 * Synchronous helper to get the current Clerk token getter.
 * Useful for non-React code (lib files, utility functions) that need to
 * retrieve the Clerk session token without using a hook.
 *
 * @example
 *   const getToken = getClerkTokenGetter();
 *   const token = await getToken();
 */
export function getClerkTokenGetter(): () => Promise<string | null> {
  return getClerkToken;
}

/**
 * Main Supabase client with Clerk JWT integration.
 *
 * Use this for ALL data operations (from, select, insert, update, delete,
 * storage, functions, rpc). It automatically sends the Clerk session token
 * on every request.
 *
 * DO NOT use `supabase.auth.*` on this client — it's disabled because of
 * the `accessToken` option. Use `supabaseAuth` instead.
 */
export const supabase: SupabaseClient = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    accessToken: async () => {
      const token = await getClerkToken();
      return token ?? null;
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  },
);

/**
 * Secondary Supabase client for auth operations only.
 *
 * This client does NOT have `accessToken` set, so its `auth` namespace works
 * normally. Use it when you need `supabase.auth.getUser()`, `getSession()`,
 * `onAuthStateChange()`, etc.
 *
 * Note: this client's auth state is independent of Clerk. In this app, Clerk
 * is the source of truth for authentication, so prefer using Clerk's hooks
 * (`useUser`, `useSession`) directly. This client is provided as a fallback
 * for legacy code paths and edge cases.
 */
export const supabaseAuth: SupabaseClient = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  },
);
