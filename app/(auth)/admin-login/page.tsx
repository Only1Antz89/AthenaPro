import { redirect } from "next/navigation";
import { AdminLoginForm } from "@/features/auth/admin-login-form";
import { AdminAccessDeniedError, requireAdmin } from "@/lib/auth/require-admin";
import { getRuntimeMode } from "@/lib/env";

export default async function AdminLoginPage() {
  const mode = getRuntimeMode();

  if (mode === "live") {
    try {
      await requireAdmin({ redirectToLogin: false });
      redirect("/admin");
    } catch (error) {
      if (!(error instanceof AdminAccessDeniedError)) {
        throw error;
      }
    }
  }

  return <AdminLoginForm mode={mode} />;
}
