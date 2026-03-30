import { DemoDataProvider } from "@/lib/data/demo-provider";
import { SupabaseDataProvider } from "@/lib/data/supabase-provider";
import { getRuntimeMode } from "@/lib/env";

let browserProvider: DemoDataProvider | SupabaseDataProvider | null = null;

export function getClientDataProvider() {
  if (!browserProvider) {
    browserProvider =
      getRuntimeMode() === "live" ? new SupabaseDataProvider() : new DemoDataProvider();
  }

  return browserProvider;
}
