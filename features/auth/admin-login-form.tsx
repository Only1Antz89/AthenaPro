"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState, type FormEvent } from "react";
import {
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  LockKeyhole,
  Radar,
  ShieldCheck
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PasswordField } from "@/components/ui/password-field";
import { BRAND } from "@/lib/brand";
import { toDisplayError } from "@/lib/errors";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { loginSchema } from "@/lib/validation/schemas";
import type { RuntimeMode } from "@/types/domain";

const ADMIN_MODULES = [
  {
    label: "Company control",
    detail: "Review commercial accounts, job demand, and account health.",
    icon: Building2
  },
  {
    label: "Field operations",
    detail: "Track operators, readiness, onboarding progress, and deployment quality.",
    icon: Radar
  },
  {
    label: "Admin oversight",
    detail: "Open the protected dashboard, finance surfaces, reports, and audit trail.",
    icon: BriefcaseBusiness
  }
] as const;

export function AdminLoginForm({ mode }: { mode: RuntimeMode }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setSubmitting(true);
      const payload = loginSchema.parse({ email, password });
      const supabase = createBrowserSupabaseClient();

      const { error } = await supabase.auth.signInWithPassword(payload);

      if (error) {
        throw error;
      }

      const adminResponse = await fetch("/api/admin/session", {
        method: "GET",
        credentials: "include",
        cache: "no-store"
      });

      if (!adminResponse.ok) {
        await supabase.auth.signOut();
        toast.error("This account is valid, but it is not provisioned for admin access.");
        return;
      }

      toast.success("Admin access granted.");
      router.replace("/admin");
      router.refresh();
    } catch (error) {
      toast.error(toDisplayError(error));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden px-6 py-8 md:px-8 md:py-10">
      <div className="absolute inset-0 opacity-60" style={{ backgroundImage: "var(--auth-grid-background)" }} />
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle at 16% 18%, rgba(123,212,255,0.16), transparent 0 24%), radial-gradient(circle at 84% 18%, rgba(196,204,214,0.14), transparent 0 20%), var(--auth-admin-wash)"
        }}
      />
      <div className="absolute left-[-10%] top-[14%] h-[340px] w-[340px] rounded-full bg-[#7bd4ff]/10 blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-6%] h-[380px] w-[380px] rounded-full bg-white/10 blur-[140px]" />

      <div className="relative mx-auto flex min-h-[calc(100svh-4rem)] w-full max-w-[1420px] flex-col justify-between gap-12 lg:flex-row lg:items-stretch lg:gap-16">
        <section className="flex w-full flex-1 flex-col justify-between py-4 lg:max-w-[700px] lg:py-10">
          <div className="animate-fade-up">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate">
              {mode === "demo" ? "Demo admin surface" : "Protected admin access"}
            </p>
            <div className="mt-8">
              <Link href="/" className="inline-flex items-center gap-3 text-ink transition hover:text-mist">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-line/60 bg-surfaceRaised/70">
                  <ShieldCheck className="h-5 w-5" />
                </span>
                <span className="font-display text-2xl font-semibold tracking-[0.18em]">{BRAND.name}</span>
              </Link>
            </div>

            <p className="mt-10 text-[11px] font-semibold uppercase tracking-[0.26em] text-slate">{BRAND.tagline}</p>
            <h1 className="mt-5 max-w-[10ch] font-display text-5xl font-semibold leading-[0.9] tracking-[-0.08em] text-ink md:text-7xl">
              Corporate operations start here.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-slate md:text-lg">
              Direct entry for Athena staff who have been provisioned in Supabase Auth and cleared for the internal
              admin workspace.
            </p>
          </div>

          <div className="animate-soft-in grid gap-5 md:grid-cols-3">
            {ADMIN_MODULES.map(({ label, detail, icon: Icon }) => (
              <div key={label} className="border-t border-line/60 pt-5">
                <Icon className="h-5 w-5 text-accent" strokeWidth={2} />
                <h2 className="mt-4 font-display text-2xl font-semibold tracking-[-0.05em] text-ink">{label}</h2>
                <p className="mt-3 text-sm leading-7 text-slate">{detail}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="flex w-full items-center justify-center lg:max-w-[480px]">
          <Card className="animate-soft-in w-full rounded-[34px] border-line/60 p-8 md:p-10">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-full border border-line/60 bg-surfaceRaised/70">
              <LockKeyhole className="h-6 w-6 text-ink" />
            </div>

            <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate">
              Athena admin login
            </p>
            <h2 className="mt-3 font-display text-4xl font-semibold tracking-[-0.06em] text-ink">
              {mode === "demo" ? "Open the seeded admin workspace." : "Sign in and go straight to the admin portal."}
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate">
              {mode === "demo"
                ? "This environment is running in demo mode, so the internal dashboard uses seeded data and can be opened directly."
                : "Live access is granted only after Supabase authenticates the account and the server confirms an active admin role."}
            </p>

            {mode === "demo" ? (
              <div className="mt-8 space-y-3">
                <Button className="w-full justify-between gap-2" onClick={() => router.push("/admin")}>
                  Open admin portal <ArrowRight className="h-4 w-4" />
                </Button>
                <Button variant="secondary" className="w-full" onClick={() => router.push("/")}>
                  Return to platform
                </Button>
              </div>
            ) : (
              <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
                <Field label="Admin email">
                  <Input
                    autoComplete="email"
                    type="email"
                    placeholder="admin@company.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                </Field>
                <Field label="Password" hint="After sign-in, the server checks `admin_users` before opening `/admin`.">
                  <PasswordField
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                  />
                </Field>
                <div className="flex justify-end">
                  <Link href="/auth/forgot-password" className="text-sm text-mist transition hover:text-ink">
                    Forgot password?
                  </Link>
                </div>
                <Button type="submit" variant="accent" className="mt-3 w-full" disabled={submitting}>
                  {submitting ? "Checking admin access..." : "Enter admin portal"}
                </Button>
              </form>
            )}

            <div className="mt-8 flex flex-wrap items-center gap-3 text-sm text-slate">
              <Link href="/admin" className="inline-flex items-center gap-2 transition hover:text-ink">
                Direct `/admin` access <ArrowRight className="h-4 w-4" />
              </Link>
              <span className="hidden h-1 w-1 rounded-full bg-line md:inline-flex" />
              <Link href="/auth/login" className="transition hover:text-ink">
                Standard platform login
              </Link>
            </div>
          </Card>
        </section>
      </div>
    </main>
  );
}
