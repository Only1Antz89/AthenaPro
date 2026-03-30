"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/layout/page-container";
import { useStaffBook } from "@/features/app/use-staffbook";

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { session, mode, signOut, loading } = useStaffBook();

  const links = [
    { href: "/jobs", label: "Jobs" },
    { href: "/staff", label: "Ranked staff" },
    { href: "/dashboard/organiser", label: "Organiser" },
    { href: "/dashboard/staff", label: "Staff" }
  ];

  return (
    <header className="sticky top-0 z-30 border-b border-white/60 bg-white/80 backdrop-blur-xl">
      <PageContainer className="flex h-20 items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/" className="font-display text-2xl font-semibold text-ink">
            StaffBook
          </Link>
          <Badge variant={mode === "demo" ? "warning" : "accent"}>
            {mode === "demo" ? "Demo mode" : "Supabase live"}
          </Badge>
        </div>
        <nav className="hidden items-center gap-6 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={pathname === link.href ? "font-semibold text-ink" : "text-sm text-slate"}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          {session ? (
            <>
              <span className="hidden text-sm text-slate md:inline">{session.email}</span>
              <Button
                variant="secondary"
                disabled={loading}
                onClick={async () => {
                  await signOut();
                  router.push("/");
                }}
              >
                Sign out
              </Button>
            </>
          ) : (
            <>
              <Link href="/auth/login">
                <Button variant="secondary">Log in</Button>
              </Link>
              <Link href="/auth/signup">
                <Button>Get started</Button>
              </Link>
            </>
          )}
        </div>
      </PageContainer>
    </header>
  );
}
