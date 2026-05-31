import { createBrowserClient } from "@supabase/ssr";
import { env } from "@/lib/env";

let browserClient: ReturnType<typeof createBrowserClient> | null = null;

export function createBrowserSupabaseClient() {
  if (!env.hasSupabase) {
    throw new Error("Supabase browser configuration is missing.");
  }

  if (!browserClient) {
    browserClient = createBrowserClient(env.supabaseUrl, env.supabaseAnonKey);
  }

  return browserClient;
}
