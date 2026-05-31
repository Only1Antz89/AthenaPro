"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { SiteHeader } from "@/components/layout/site-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useStaffBook } from "@/features/app/use-staffbook";
import { toDisplayError } from "@/lib/errors";
import { createEventSchema } from "@/lib/validation/schemas";

export function EventCreationForm() {
  const router = useRouter();
  const { provider, session, loading } = useStaffBook();
  const [form, setForm] = useState({
    title: "",
    description: "",
    location: "",
    eventDate: "",
    eventType: "",
    requiredRoles: "",
    serviceTier: "mixed" as const
  });

  if (!loading && (!session || session.role !== "organiser")) {
    return (
      <main>
        <SiteHeader />
        <DashboardShell
          eyebrow="Create engagement"
          title="Sign in required"
          description="Only company accounts can create new engagements."
        >
          <EmptyState
            title="Create a company workspace"
            description="Open a company account first to define engagements and post jobs."
          />
        </DashboardShell>
      </main>
    );
  }

  return (
    <main>
      <SiteHeader />
      <DashboardShell
        eyebrow="Create engagement"
        title="Create a new engagement"
        description="Define the event first, then post jobs from the company workspace."
      >
        <Card className="max-w-3xl">
          <form
            className="space-y-4"
            onSubmit={async (event) => {
              event.preventDefault();
              try {
                const payload = createEventSchema.parse(form);
                await provider.createEvent(payload);
                toast.success("Engagement created.");
                router.push("/dashboard/organiser");
              } catch (error) {
                toast.error(toDisplayError(error));
              }
            }}
          >
            <Field label="Engagement title">
              <Input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} />
            </Field>
            <Field label="Operational brief">
              <Textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} />
            </Field>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Location">
                <Input value={form.location} onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))} />
              </Field>
              <Field label="Event date">
                <Input type="datetime-local" value={form.eventDate} onChange={(event) => setForm((current) => ({ ...current, eventDate: event.target.value }))} />
              </Field>
              <Field label="Event type">
                <Input value={form.eventType} onChange={(event) => setForm((current) => ({ ...current, eventType: event.target.value }))} />
              </Field>
              <Field label="Required disciplines">
                <Input value={form.requiredRoles} onChange={(event) => setForm((current) => ({ ...current, requiredRoles: event.target.value }))} placeholder="Ingress, scanner support, supervisor" />
              </Field>
              <Field label="Service tier">
                <Select value={form.serviceTier} onChange={(event) => setForm((current) => ({ ...current, serviceTier: event.target.value as typeof form.serviceTier }))}>
                  <option value="festival">Festival</option>
                  <option value="mixed">Mixed</option>
                  <option value="formal">Formal</option>
                  <option value="high_end">High-end</option>
                </Select>
              </Field>
            </div>
            <Button type="submit" variant="accent">
              Create engagement
            </Button>
          </form>
        </Card>
      </DashboardShell>
    </main>
  );
}
