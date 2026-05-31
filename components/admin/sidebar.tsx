"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  BellDot,
  BriefcaseBusiness,
  Building2,
  FileClock,
  Gauge,
  Menu,
  Mail,
  NotebookTabs,
  Scale,
  Settings,
  Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AdminRole } from "@/types/admin";

const navigation = [
  { href: "/admin", label: "Dashboard", icon: Gauge },
  { href: "/admin/clients", label: "Clients", icon: Building2 },
  { href: "/admin/operators", label: "Operators", icon: Shield },
  { href: "/admin/assignments", label: "Assignments", icon: BriefcaseBusiness },
  { href: "/admin/finance", label: "Finance", icon: Scale },
  { href: "/admin/onboarding", label: "Onboarding", icon: NotebookTabs },
  { href: "/admin/communications", label: "Communications", icon: Mail },
  { href: "/admin/reports", label: "Reports", icon: FileClock },
  { href: "/admin/audit-log", label: "Audit Log", icon: BellDot },
  { href: "/admin/settings", label: "Settings", icon: Settings }
];

function formatRole(role: AdminRole) {
  return role
    .split("_")
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}

export function AdminSidebar({
  adminName,
  role
}: {
  adminName: string;
  role: AdminRole;
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const sidebarContent = (
    <>
      <div className="border-b border-white/8 px-3 pb-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate">
          Athena Internal
        </p>
        <h2 className="mt-3 font-display text-2xl font-semibold tracking-[-0.04em] text-ink">
          Corporate Ops
        </h2>
        <p className="mt-3 text-sm text-slate">{adminName}</p>
        <p className="text-xs uppercase tracking-[0.18em] text-slate/80">{formatRole(role)}</p>
      </div>

      <nav className="mt-4 space-y-1">
        {navigation.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-[20px] px-3 py-3 text-sm transition",
                active
                  ? "bg-white/[0.08] text-ink shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                  : "text-slate hover:bg-white/[0.04] hover:text-ink"
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );

  return (
    <>
      <div className="panel-shell flex items-center justify-between rounded-[24px] px-4 py-3 lg:hidden">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate">Athena Internal</p>
          <p className="mt-1 truncate text-sm font-medium text-ink">{adminName}</p>
        </div>
        <Button
          type="button"
          variant="secondary"
          className="h-11 w-11 px-0"
          aria-label="Open admin navigation"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((current) => !current)}
        >
          <Menu className="h-4.5 w-4.5" />
        </Button>
      </div>

      {menuOpen ? (
        <div className="panel-shell rounded-[24px] p-4 lg:hidden">{sidebarContent}</div>
      ) : null}

      <aside className="panel-shell hidden h-fit rounded-[32px] p-4 lg:sticky lg:top-6 lg:block lg:w-[272px]">
        {sidebarContent}
      </aside>
    </>
  );
}
