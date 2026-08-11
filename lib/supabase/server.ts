import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { env } from "@/lib/env";

type CookieWrite = {
  name: string;
  value: string;
  options?: Record<string, unknown>;
};

export async function createServerSupabaseClient() {
  if (!env.hasSupabase) {
    throw new Error("Supabase server configuration is missing.");
  }

  const cookieStore = await cookies();

  return createServerClient(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: CookieWrite[]) {
        try {
          const mutableCookieStore = cookieStore as unknown as {
            set: (name: string, value: string, options?: Record<string, unknown>) => void;
          };

          cookiesToSet.forEach(({ name, value, options }) => {
            mutableCookieStore.set(name, value, options);
          });
        } catch {
          // Server components can read cookies even when writes are not allowed.
        }
      }
    }
  });
}
