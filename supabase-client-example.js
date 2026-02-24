/**
 * Correct Supabase Client Setup for Vite
 * 
 * IMPORTANT: Use import.meta.env for Vite, NOT process.env
 */

// ✅ CORRECT - For Vite/React projects
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY

// Alternative: Use VITE_SUPABASE_ANON_KEY (same thing)
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey || supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
    storageKey: 'videoremix-auth',
    flowType: 'pkce'
  }
})

// ❌ INCORRECT - process.env doesn't work in Vite client-side code
// const supabaseKey = process.env.SUPABASE_KEY  // WRONG!

export { supabase }
