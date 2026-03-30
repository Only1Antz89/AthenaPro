"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/layout/site-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useStaffBook } from "@/features/app/use-staffbook";
import { toDisplayError } from "@/lib/errors";
import { loginSchema } from "@/lib/validation/schemas";

export function LoginForm() {
  const router = useRouter();
  const { provider, refreshSession, mode } = useStaffBook();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  return (
    <main>
      <SiteHeader />
      <section className="flex min-h-[calc(100vh-80px)] items-center justify-center px-6 py-12">
        <Card className="w-full max-w-lg">
          <Badge variant={mode === "demo" ? "warning" : "accent"}>
            {mode === "demo" ? "Demo login" : "Supabase login"}
          </Badge>
          <h1 className="mt-5 font-display text-4xl font-semibold text-ink">Sign in to StaffBook</h1>
          <p className="mt-3 text-sm text-slate">
            In demo mode, create an account first on signup, then sign in with the same email.
          </p>
          <form
            className="mt-8 space-y-4"
            onSubmit={async (event) => {
              event.preventDefault();
              try {
                setSubmitting(true);
                const payload = loginSchema.parse({ email, password });
                const session = await provider.signIn(payload);
                await refreshSession();
                toast.success("Signed in.");
                router.push(session.role === "organiser" ? "/dashboard/organiser" : "/dashboard/staff");
              } catch (error) {
                toast.error(toDisplayError(error));
              } finally {
                setSubmitting(false);
              }
            }}
          >
            <Field label="Email">
              <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
            </Field>
            <Field label="Password">
              <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
            </Field>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Signing in..." : "Sign in"}
            </Button>
          </form>
          <p className="mt-6 text-sm text-slate">
            No account yet?{" "}
            <Link href="/auth/signup" className="font-semibold text-accent">
              Create one
            </Link>
          </p>
        </Card>
      </section>
    </main>
  );
}
