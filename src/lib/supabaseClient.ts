import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { supabase as canonicalSupabase } from '../utils/supabase';

export const supabase: SupabaseClient = canonicalSupabase;
