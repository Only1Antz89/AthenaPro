import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

export function createAdminSupabaseClient() {
  if (!env.supabaseUrl || !env.supabaseServiceRoleKey) {
    throw new Error("Supabase service role configuration is missing.");
  }

  return createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}
