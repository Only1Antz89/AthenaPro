"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/layout/site-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useStaffBook } from "@/features/app/use-staffbook";
import { toDisplayError } from "@/lib/errors";
import { organiserSignupSchema, staffSignupSchema } from "@/lib/validation/schemas";

export function SignupForm() {
  const router = useRouter();
  const { provider, refreshSession, mode } = useStaffBook();
  const [role, setRole] = useState<"organiser" | "staff">("organiser");
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    companyName: "",
    phone: "",
    skills: "",
    bio: "",
    availability: ""
  });
  const [submitting, setSubmitting] = useState(false);

  const update = (key: keyof typeof form, value: string) =>
    setForm((current) => ({ ...current, [key]: value }));

  return (
    <main>
      <SiteHeader />
      <section className="flex min-h-[calc(100vh-80px)] items-center justify-center px-6 py-12">
        <Card className="w-full max-w-2xl">
          <Badge variant={mode === "demo" ? "warning" : "accent"}>
            {mode === "demo" ? "Interactive demo mode" : "Supabase live mode"}
          </Badge>
          <h1 className="mt-5 font-display text-4xl font-semibold text-ink">Create your StaffBook account</h1>
          <p className="mt-3 text-sm text-slate">
            Organiser signup creates an organisation workspace. Staff signup creates a profile and seeded rating context in demo mode.
          </p>
          <form
            className="mt-8 space-y-4"
            onSubmit={async (event) => {
              event.preventDefault();
              try {
                setSubmitting(true);
                if (role === "organiser") {
                  const payload = organiserSignupSchema.parse({
                    role,
                    fullName: form.fullName,
                    email: form.email,
                    password: form.password,
                    companyName: form.companyName
                  });
                  await provider.signUpOrganiser(payload);
                  await refreshSession();
                  toast.success("Organiser account created.");
                  router.push("/dashboard/organiser");
                } else {
                  const payload = staffSignupSchema.parse({
                    role,
                    fullName: form.fullName,
                    email: form.email,
                    password: form.password,
                    phone: form.phone,
                    skills: form.skills,
                    bio: form.bio,
                    availability: form.availability
                  });
                  await provider.signUpStaff(payload);
                  await refreshSession();
                  toast.success("Staff account created.");
                  router.push("/dashboard/staff");
                }
              } catch (error) {
                toast.error(toDisplayError(error));
              } finally {
                setSubmitting(false);
              }
            }}
          >
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Role">
                <Select value={role} onChange={(event) => setRole(event.target.value as "organiser" | "staff")}>
                  <option value="organiser">Organiser</option>
                  <option value="staff">Staff</option>
                </Select>
              </Field>
              <Field label="Full name">
                <Input value={form.fullName} onChange={(event) => update("fullName", event.target.value)} />
              </Field>
              <Field label="Email">
                <Input type="email" value={form.email} onChange={(event) => update("email", event.target.value)} />
              </Field>
              <Field label="Password">
                <Input type="password" value={form.password} onChange={(event) => update("password", event.target.value)} />
              </Field>
            </div>

            {role === "organiser" ? (
              <Field label="Company name">
                <Input value={form.companyName} onChange={(event) => update("companyName", event.target.value)} />
              </Field>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Phone">
                  <Input value={form.phone} onChange={(event) => update("phone", event.target.value)} />
                </Field>
                <Field label="Availability">
                  <Input value={form.availability} onChange={(event) => update("availability", event.target.value)} />
                </Field>
                <Field label="Skills (comma separated)" hint="Used for search and staff ranking display.">
                  <Input value={form.skills} onChange={(event) => update("skills", event.target.value)} className="md:col-span-2" />
                </Field>
                <Field label="Bio" hint="A concise summary that makes the profile feel credible.">
                  <Textarea value={form.bio} onChange={(event) => update("bio", event.target.value)} className="md:col-span-2" />
                </Field>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Creating account..." : "Create account"}
            </Button>
          </form>
        </Card>
      </section>
    </main>
  );
}
