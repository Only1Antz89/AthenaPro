"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { SiteHeader } from "@/components/layout/site-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { PasswordField } from "@/components/ui/password-field";
import { useStaffBook } from "@/features/app/use-staffbook";
import { BRAND } from "@/lib/brand";
import { toDisplayError } from "@/lib/errors";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { passwordResetCompleteSchema } from "@/lib/validation/schemas";

export function ResetPasswordForm() {
  const router = useRouter();
  const { provider, mode } = useStaffBook();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [ready, setReady] = useState(mode === "demo");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (mode !== "live") {
      return;
    }

    const supabase = createBrowserSupabaseClient();
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const accessToken = hashParams.get("access_token");
    const refreshToken = hashParams.get("refresh_token");
    const type = hashParams.get("type");

    if (type === "recovery" && accessToken && refreshToken) {
      void supabase.auth
        .setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        })
        .finally(() => {
          window.history.replaceState({}, document.title, window.location.pathname);
          setReady(true);
        });
      return;
    }

    void supabase.auth.getSession().then(() => setReady(true));
  }, [mode]);

  return (
    <main>
      <SiteHeader />
      <section className="flex min-h-[calc(100svh-72px)] items-center justify-center px-4 py-8 sm:min-h-[calc(100svh-80px)] sm:px-6 sm:py-12">
        <Card className="w-full max-w-xl">
          <h1 className="text-balance font-display text-3xl font-semibold tracking-[-0.05em] text-ink sm:text-4xl">
            Choose a new {BRAND.plainName} password
          </h1>
          <p className="mt-3 text-sm leading-7 text-slate">
            Set a strong password for your Athena Pro account, then sign back in normally.
          </p>

          <form
            className="mt-8 space-y-4"
            onSubmit={async (event) => {
              event.preventDefault();

              try {
                setSubmitting(true);
                const payload = passwordResetCompleteSchema.parse({ password, confirmPassword });
                await provider.updatePassword(payload);
                toast.success("Password updated. Use your new credentials to sign in.");
                router.push("/auth/login");
              } catch (error) {
                toast.error(toDisplayError(error));
              } finally {
                setSubmitting(false);
              }
            }}
          >
            <Field label="New password">
              <PasswordField value={password} onChange={(event) => setPassword(event.target.value)} showChecklist />
            </Field>
            <Field label="Confirm password">
              <PasswordField
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
              />
            </Field>
            <Button type="submit" className="w-full" disabled={submitting || !ready}>
              {submitting ? "Updating password..." : ready ? "Save new password" : "Preparing reset..."}
            </Button>
          </form>

          <div className="mt-6 text-sm text-slate">
            <Link href="/auth/login" className="text-mist transition hover:text-ink">
              Back to platform access
            </Link>
          </div>
        </Card>
      </section>
    </main>
  );
}
