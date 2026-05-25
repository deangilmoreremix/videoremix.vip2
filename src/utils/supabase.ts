import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Initialize the Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

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

export const supabase: SupabaseClient = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storage: window.localStorage,
      storageKey: "videoremix-auth",
      flowType: "pkce",
    },
  },
);