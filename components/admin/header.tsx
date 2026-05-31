import { ShieldCheck } from "lucide-react";
import { AdminSignOutButton } from "@/components/admin/sign-out-button";
import type { AdminRole } from "@/types/admin";

function formatRole(role: AdminRole) {
  return role
    .split("_")
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}

export function AdminHeader({
  adminName,
  role
}: {
  adminName: string;
  role: AdminRole;
}) {
  return (
    <header className="panel-shell flex flex-col gap-4 rounded-[24px] px-4 py-4 sm:px-5 md:flex-row md:items-center md:justify-between">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate">
          Athena Admin Portal
        </p>
        <h1 className="mt-2 text-balance font-display text-xl font-semibold tracking-[-0.04em] text-ink sm:text-2xl">
          Corporate operations control layer
        </h1>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="sm:text-right">
          <p className="text-sm font-medium text-ink">{adminName}</p>
          <p className="text-xs uppercase tracking-[0.16em] text-slate">{formatRole(role)}</p>
          <p className="mt-1 inline-flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-slate">
            <ShieldCheck className="h-3.5 w-3.5" />
            Secure internal surface
          </p>
        </div>
        <AdminSignOutButton />
      </div>
    </header>
  );
}
