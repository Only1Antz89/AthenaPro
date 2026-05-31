"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/layout/page-container";
import { useStaffBook } from "@/features/app/use-staffbook";
import { BRAND, NAV_LABELS } from "@/lib/brand";

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { session, signOut, loading } = useStaffBook();
  const [menuOpen, setMenuOpen] = useState(false);

  const links = [
    { href: "/", label: "Home" },
    { href: "/services", label: NAV_LABELS.services },
    { href: "/about", label: NAV_LABELS.about },
    { href: "/contact", label: NAV_LABELS.contact },
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

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  return (
    <header className="theme-dark sticky top-0 z-30 border-b border-line/40 bg-canvas/80 backdrop-blur-2xl">
      <PageContainer className="flex h-18 items-center justify-between gap-3 sm:h-20 sm:gap-4">
        <div className="flex items-center">
          <Link href="/" className="font-display text-xl font-semibold tracking-[0.18em] text-ink sm:text-2xl">
            {BRAND.name}
          </Link>
        </div>
        <nav className="hidden items-center gap-6 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={
                pathname === link.href
                  ? "text-sm font-semibold text-ink"
                  : "text-sm text-slate transition hover:text-ink"
              }
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-3 md:flex">
          {session ? (
            <>
              <span className="hidden text-sm text-slate md:inline">{session.email}</span>
              <Link href={session.role === "organiser" ? "/dashboard/organiser" : "/dashboard/staff"}>
                <Button variant="secondary">
                  {session.role === "organiser" ? NAV_LABELS.clientDashboard : NAV_LABELS.fieldTeamDashboard}
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
              <Button variant="secondary">{NAV_LABELS.login}</Button>
            </Link>
          )}
        </div>

        <div className="flex items-center gap-2 md:hidden">
          {session ? (
            <Link href={session.role === "organiser" ? "/dashboard/organiser" : "/dashboard/staff"}>
              <Button className="px-4 py-2.5">
                {session.role === "organiser" ? "Workspace" : "Dashboard"}
              </Button>
            </Link>
          ) : (
            <Link href="/auth/login">
              <Button className="px-4 py-2.5">{NAV_LABELS.login}</Button>
            </Link>
          )}
          <Button
            type="button"
            variant="secondary"
            className="h-11 w-11 px-0"
            aria-label={menuOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((current) => !current)}
          >
            {menuOpen ? <X className="h-4.5 w-4.5" /> : <Menu className="h-4.5 w-4.5" />}
          </Button>
        </div>
      </PageContainer>

      {menuOpen ? (
        <div className="border-t border-line/40 bg-canvas/95 backdrop-blur-2xl md:hidden">
          <PageContainer className="py-4">
            <div className="space-y-2">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={
                    pathname === link.href
                      ? "block rounded-[18px] bg-surfaceRaised/80 px-4 py-3 text-sm font-semibold text-ink"
                      : "block rounded-[18px] px-4 py-3 text-sm text-slate transition hover:bg-surfaceRaised/70 hover:text-ink"
                  }
                >
                  {link.label}
                </Link>
              ))}
            </div>

            <div className="mt-4 border-t border-line/40 pt-4">
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
