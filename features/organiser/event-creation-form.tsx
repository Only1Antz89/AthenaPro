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
    requiredRoles: ""
  });

  if (!loading && (!session || session.role !== "organiser")) {
    return (
      <main>
        <SiteHeader />
        <DashboardShell eyebrow="Create event" title="Sign in required" description="Only organisers can create events.">
          <EmptyState title="Create an organiser account" description="Use signup to create an organiser workspace first." />
        </DashboardShell>
      </main>
    );
  }

  return (
    <main>
      <SiteHeader />
      <DashboardShell
        eyebrow="Create event"
        title="Create a new event"
        description="Define the event details first, then attach one or more job postings from the organiser dashboard."
      >
        <Card className="max-w-3xl">
          <form
            className="space-y-4"
            onSubmit={async (event) => {
              event.preventDefault();
              try {
                const payload = createEventSchema.parse(form);
                await provider.createEvent(payload);
                toast.success("Event created.");
                router.push("/dashboard/organiser");
              } catch (error) {
                toast.error(toDisplayError(error));
              }
            }}
          >
            <Field label="Title">
              <Input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} />
            </Field>
            <Field label="Description">
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
              <Field label="Required roles">
                <Input value={form.requiredRoles} onChange={(event) => setForm((current) => ({ ...current, requiredRoles: event.target.value }))} placeholder="Host, Bartender, Registration" />
              </Field>
            </div>
            <Button type="submit" variant="accent">
              Create event
            </Button>
          </form>
        </Card>
      </DashboardShell>
    </main>
  );
}
