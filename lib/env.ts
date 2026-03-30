import { z } from "zod";
import type { RuntimeMode } from "@/types/domain";

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional()
});

const parsed = envSchema.safeParse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY
});

const data = parsed.success ? parsed.data : {};

export const env = {
  supabaseUrl: data.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnonKey: data.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  supabaseServiceRoleKey: data.SUPABASE_SERVICE_ROLE_KEY ?? "",
  hasSupabase:
    Boolean(data.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(data.NEXT_PUBLIC_SUPABASE_ANON_KEY)
};

export function getRuntimeMode(): RuntimeMode {
  return env.hasSupabase ? "live" : "demo";
}
