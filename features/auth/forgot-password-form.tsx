"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/layout/site-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useStaffBook } from "@/features/app/use-staffbook";
import { BRAND } from "@/lib/brand";
import { toDisplayError } from "@/lib/errors";
import { getRuntimeMode } from "@/lib/env";
import { passwordResetRequestSchema } from "@/lib/validation/schemas";

export function ForgotPasswordForm() {
  const { provider } = useStaffBook();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  return (
    <main>
      <SiteHeader />
      <section className="flex min-h-[calc(100svh-72px)] items-center justify-center px-4 py-8 sm:min-h-[calc(100svh-80px)] sm:px-6 sm:py-12">
        <Card className="w-full max-w-xl">
          <h1 className="text-balance font-display text-3xl font-semibold tracking-[-0.05em] text-ink sm:text-4xl">
            Reset your {BRAND.plainName} password
          </h1>
          <p className="mt-3 text-sm leading-7 text-slate">
            Enter the email attached to your Athena Pro account. If it exists, we will send a reset link.
          </p>

          <form
            className="mt-8 space-y-4"
            onSubmit={async (event) => {
              event.preventDefault();
              try {
                setSubmitting(true);
                const payload = passwordResetRequestSchema.parse({ email });

                if (getRuntimeMode() === "live") {
                  await provider.requestPasswordReset(
                    payload,
                    `${window.location.origin}/auth/reset-password`
                  );
                }

                toast.success("If this email exists, a reset link is on its way.");
              } catch (error) {
                toast.error(toDisplayError(error));
              } finally {
                setSubmitting(false);
              }
            }}
          >
            <Field label="Email address">
              <Input
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </Field>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Sending link..." : "Send reset link"}
            </Button>
          </form>

          <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-slate">
            <Link href="/auth/login" className="text-mist transition hover:text-ink">
              Return to platform access
            </Link>
            <span className="hidden h-1 w-1 rounded-full bg-white/20 md:inline-flex" />
            <Link href="/admin-login" className="transition hover:text-ink">
              Admin login
            </Link>
          </div>
        </Card>
      </section>
    </main>
  );
}
