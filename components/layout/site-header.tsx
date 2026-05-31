"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BriefcaseBusiness, Building2, Menu, UserCircle, UsersRound, X } from "lucide-react";
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
    { href: "/pricing", label: "Resources" },
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
        <div className="flex items-center">
          <Link href="/" className="font-display text-xl font-semibold tracking-[0.18em] text-white sm:text-2xl">
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
            <>
              <Link href="/auth/signup?type=field-team">
                <Button variant="accent" className="gap-2 bg-lime-300 text-black hover:bg-lime-200">
                  <UsersRound className="h-4 w-4" />
                  Field-team sign up
                </Button>
              </Link>
              <Link href="/auth/signup?type=company">
                <Button variant="accent" className="gap-2 bg-rose-400 text-black hover:bg-rose-300">
                  <Building2 className="h-4 w-4" />
                  Company sign up
                </Button>
              </Link>
              <Link href="/auth/login">
                <Button variant="ghost" className="text-white hover:bg-white/10 hover:text-white">{NAV_LABELS.login}</Button>
              </Link>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 md:hidden">
          {session ? (
            <Link href={profileHref}>
              <Button className="bg-lime-300 px-4 py-2.5 text-black">
                {session.role === "organiser" ? "Workspace" : "Profile"}
              </Button>
            </Link>
          ) : (
            <Link href="/auth/login">
              <Button className="bg-white px-4 py-2.5 text-black">{NAV_LABELS.login}</Button>
            </Link>
          )}
          <Button
            type="button"
            variant="secondary"
            className="h-11 w-11 border-white/10 bg-white/5 px-0 text-white"
            aria-label={menuOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((current) => !current)}
          >
            {menuOpen ? <X className="h-4.5 w-4.5" /> : <Menu className="h-4.5 w-4.5" />}
          </Button>
        </div>
      </PageContainer>

      {menuOpen ? (
        <div className="border-t border-white/10 bg-black/95 backdrop-blur-2xl md:hidden">
          <PageContainer className="py-4">
            <div className="space-y-2">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={
                    pathname === link.href
                      ? "block rounded-[18px] bg-lime-300 px-4 py-3 text-sm font-semibold text-black"
                      : "block rounded-[18px] px-4 py-3 text-sm text-white/70 transition hover:bg-white/10 hover:text-white"
                  }
                >
                  {link.label}
                </Link>
              ))}
            </div>

              <div className="mt-4 border-t border-white/10 pt-4">
              {session ? (
                <div className="space-y-3">
                  <div className="rounded-[20px] border border-line/40 bg-surfaceRaised/70 px-4 py-3">
                    <p className="text-sm font-medium text-ink">{session.email}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate">
                      {session.role === "organiser" ? "Company access" : "Field team access"}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    className="w-full justify-center"
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
                  <Link href="/auth/signup?type=field-team" className="block">
                    <Button variant="accent" className="w-full bg-lime-300 text-black">
                      Field-team sign up
                    </Button>
                  </Link>
                  <Link href="/auth/signup?type=company" className="block">
                    <Button variant="accent" className="w-full bg-rose-400 text-black">
                      Company sign up
                    </Button>
                  </Link>
                  <Link href="/auth/login" className="block">
                    <Button variant="secondary" className="w-full">
                      {NAV_LABELS.login}
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
