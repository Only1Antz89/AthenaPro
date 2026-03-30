import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

let browserClient: any = null;

export function getBrowserSupabaseClient() {
  if (!env.hasSupabase) {
    throw new Error("Supabase is not configured.");
  }

  if (!browserClient) {
    browserClient = createClient(env.supabaseUrl, env.supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true
      }
    });
  }

  return browserClient;
}

export function createServiceRoleClient() {
  if (!env.supabaseServiceRoleKey || !env.supabaseUrl) {
    throw new Error("Service role configuration is missing.");
  }

  return createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}
