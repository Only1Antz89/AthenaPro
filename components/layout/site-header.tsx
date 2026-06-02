"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BriefcaseBusiness, Menu, UserCircle, UserPlus, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/layout/page-container";
import { useStaffBook } from "@/features/app/use-staffbook";
import { NAV_LABELS } from "@/lib/brand";

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { session, signOut, loading } = useStaffBook();
  const [menuOpen, setMenuOpen] = useState(false);

  const links = [
    { href: "/jobs", label: "Find Roles" },
    { href: "/services", label: "For Companies" },
    { href: "/staff", label: "How It Works" },
    { href: "/about", label: NAV_LABELS.about },
    ...(session
      ? [
          {
            href: session.role === "organiser" ? "/dashboard/organiser" : "/dashboard/staff",
            label:
              session.role === "organiser" ? NAV_LABELS.clientDashboard : NAV_LABELS.fieldTeamDashboard
          }
        ]
      : [])
  ];
  const profileHref =
    session?.role === "staff"
      ? "/dashboard/staff/profile"
      : session?.role === "organiser"
        ? "/dashboard/organiser"
        : "/auth/login";

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  return (
    <header className="theme-dark sticky top-0 z-30 border-b border-white/10 bg-black/92 backdrop-blur-2xl">
      <PageContainer className="flex h-18 items-center justify-between gap-3 sm:h-20 sm:gap-4">
        <div className="flex min-w-0 items-center">
          <Link href="/" className="inline-flex min-h-12 items-center whitespace-nowrap font-display text-lg font-semibold tracking-[0.13em] text-white sm:text-2xl sm:tracking-[0.18em]">
            <span className="text-lime-300">ATHENA</span> PRO
          </Link>
        </div>
        <nav className="hidden items-center gap-7 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={
                pathname === link.href
                  ? "text-sm font-semibold text-lime-200"
                  : "text-sm text-white/72 transition hover:text-white"
              }
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-3 md:flex">
          {session ? (
            <>
              {session.role === "staff" ? (
                <Link href="/dashboard/staff/jobs">
                  <Button variant="secondary" className="gap-2">
                    <BriefcaseBusiness className="h-4 w-4" />
                    Jobs
                  </Button>
                </Link>
              ) : null}
              <Link href={profileHref}>
                <Button variant="accent" className="gap-2">
                  <UserCircle className="h-4 w-4" />
                  {session.role === "organiser" ? NAV_LABELS.clientDashboard : "Profile"}
                </Button>
              </Link>
              <Button
                variant="ghost"
                disabled={loading}
                onClick={async () => {
                  await signOut();
                  router.push("/");
                }}
              >
                Exit
              </Button>
            </>
          ) : (
            <Link href="/auth/login">
              <Button variant="accent" className="bg-lime-300 text-black hover:bg-lime-200">{NAV_LABELS.login}</Button>
            </Link>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2 md:hidden">
          {session ? (
            <Link href={profileHref}>
              <Button className="min-h-12 bg-lime-300 px-4 py-2 text-sm text-black">
                {session.role === "organiser" ? "Workspace" : "Profile"}
              </Button>
            </Link>
          ) : (
            <Link href="/auth/login">
              <Button className="min-h-12 bg-white px-4 py-2 text-sm text-black">Login</Button>
            </Link>
          )}
          <Button
            type="button"
            variant="secondary"
            className="h-12 w-12 border-white/10 bg-white/5 px-0 text-white"
            aria-label={menuOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((current) => !current)}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </PageContainer>

      {menuOpen ? (
        <div className="border-t border-white/10 bg-black/95 backdrop-blur-2xl md:hidden">
          <PageContainer className="py-4">
            <div className="grid gap-2">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={
                    pathname === link.href
                      ? "block min-h-12 rounded-[14px] bg-lime-300 px-4 py-3 text-base font-semibold text-black"
                      : "block min-h-12 rounded-[14px] border border-white/10 bg-white/[0.03] px-4 py-3 text-base text-white/78 transition hover:bg-white/10 hover:text-white"
                  }
                >
                  {link.label}
                </Link>
              ))}
            </div>

              <div className="mt-4 border-t border-white/10 pt-4">
              {session ? (
                <div className="space-y-3">
                  <div className="rounded-[16px] border border-white/10 bg-white/[0.04] px-4 py-3">
                    <p className="break-words text-sm font-medium text-white">{session.email}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate">
                      {session.role === "organiser" ? "Company access" : "Field team access"}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    className="w-full justify-center border border-white/10 bg-white/[0.03] text-white hover:bg-white/10"
                    disabled={loading}
                    onClick={async () => {
                      await signOut();
                      router.push("/");
                    }}
                  >
                    Exit
                  </Button>
                </div>
              ) : (
                <div className="grid gap-3">
                  <Link href="/auth/login" className="block">
                    <Button variant="accent" className="w-full min-h-12 bg-lime-300 text-black">
                      {NAV_LABELS.login}
                    </Button>
                  </Link>
                  <Link href="/auth/signup?type=field-team" className="block">
                    <Button variant="secondary" className="w-full min-h-12 gap-2 border-white/10 bg-white/[0.04] text-white hover:bg-white/10">
                      <UserPlus className="h-4 w-4" />
                      Create profile
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </PageContainer>
        </div>
      ) : null}
    </header>
  );
}
