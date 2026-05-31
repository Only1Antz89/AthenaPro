"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getRuntimeMode } from "@/lib/env";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

export function AdminSignOutButton() {
  const router = useRouter();

  return (
    <Button
      variant="secondary"
      className="gap-2"
      onClick={async () => {
        await fetch("/api/admin/logout", {
          method: "POST",
          credentials: "include"
        });

        if (getRuntimeMode() === "live") {
          await createBrowserSupabaseClient().auth.signOut();
        }

        router.push("/admin-login");
        router.refresh();
      }}
    >
      <LogOut className="h-4 w-4" />
      Sign out
    </Button>
  );
}
