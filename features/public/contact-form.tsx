"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CONTACT_EVENT_TYPES, CONTACT_SERVICE_NEEDS } from "@/lib/site-content";
import { contactInquirySchema } from "@/lib/validation/schemas";

type ContactFormState = {
  name: string;
  email: string;
  eventType: string;
  expectedAttendance: string;
  serviceNeeds: string[];
  brief: string;
};

export function ContactForm() {
  const [form, setForm] = useState<ContactFormState>({
    name: "",
    email: "",
    eventType: "",
    expectedAttendance: "",
    serviceNeeds: [],
    brief: ""
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [website, setWebsite] = useState("");

  const toggleServiceNeed = (value: string) => {
    setForm((current) => ({
      ...current,
      serviceNeeds: current.serviceNeeds.includes(value)
        ? current.serviceNeeds.filter((item) => item !== value)
        : [...current.serviceNeeds, value]
    }));
  };

  if (submitted) {
    return (
      <Card className="space-y-4">
        <Badge variant="success">Enquiry sent</Badge>
        <h2 className="font-display text-3xl font-semibold tracking-[-0.04em] text-ink">
          Your brief is with the Athena Pro team.
        </h2>
        <p className="text-base leading-7 text-slate">
          We&apos;ll review the event requirements and reply to the email address you provided.
        </p>
        <Button variant="secondary" onClick={() => setSubmitted(false)}>
          Submit another enquiry
        </Button>
      </Card>
    );
  }

  return (
    <Card className="space-y-6">
      <div className="hidden" aria-hidden="true">
        <label htmlFor="contact-website">Website</label>
        <input
          id="contact-website"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(event) => setWebsite(event.target.value)}
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Name" hint={errors.name}>
          <Input
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            placeholder="Full name"
          />
        </Field>
        <Field label="Email" hint={errors.email}>
          <Input
            type="email"
            value={form.email}
            onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
            placeholder="name@company.com"
          />
        </Field>
        <Field label="Event type" hint={errors.eventType}>
          <Select
            value={form.eventType}
            onChange={(event) => setForm((current) => ({ ...current, eventType: event.target.value }))}
          >
            <option value="">Select event type</option>
            {CONTACT_EVENT_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Expected attendance" hint={errors.expectedAttendance}>
          <Input
            value={form.expectedAttendance}
            onChange={(event) =>
              setForm((current) => ({ ...current, expectedAttendance: event.target.value }))
            }
            placeholder="e.g. 12,000"
          />
        </Field>
      </div>

      <Field
        label="Service needs"
        hint={errors.serviceNeeds ?? "Choose the operating layer you need Athena Pro to cover."}
      >
        <div className="flex flex-wrap gap-3">
          {CONTACT_SERVICE_NEEDS.map((option) => {
            const active = form.serviceNeeds.includes(option);

            return (
              <button
                key={option}
                type="button"
                className={
                  active
                    ? "rounded-full border border-accent bg-accent px-4 py-2 text-sm font-medium text-ink"
                    : "rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-medium text-slate transition hover:border-white/20 hover:text-ink"
                }
                onClick={() => toggleServiceNeed(option)}
              >
                {option}
              </button>
            );
          })}
        </div>
      </Field>

      <Field label="Event brief" hint={errors.brief ?? "Optional, but useful for venue, timing, and risk context."}>
        <Textarea
          value={form.brief}
          onChange={(event) => setForm((current) => ({ ...current, brief: event.target.value }))}
          placeholder="Outline the event environment, access pressure, technical complexity, or commercial concerns."
        />
      </Field>

      <Button
        disabled={submitting}
        onClick={async () => {
          const parsed = contactInquirySchema.safeParse(form);

          if (!parsed.success) {
            const nextErrors = parsed.error.flatten().fieldErrors;
            setErrors({
              name: nextErrors.name?.[0] ?? "",
              email: nextErrors.email?.[0] ?? "",
              eventType: nextErrors.eventType?.[0] ?? "",
              expectedAttendance: nextErrors.expectedAttendance?.[0] ?? "",
              serviceNeeds: nextErrors.serviceNeeds?.[0] ?? "",
              brief: nextErrors.brief?.[0] ?? ""
            });
            return;
          }

          setErrors({});
          setSubmitError(null);
          setSubmitting(true);

          try {
            const response = await fetch("/api/contact", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ ...parsed.data, website })
            });
            const result = (await response.json()) as { error?: string };

            if (!response.ok) {
              throw new Error(result.error || "Unable to send the enquiry.");
            }

            setSubmitted(true);
          } catch (error) {
            setSubmitError(error instanceof Error ? error.message : "Unable to send the enquiry.");
          } finally {
            setSubmitting(false);
          }
        }}
      >
        {submitting ? "Sending enquiry..." : "Submit enquiry"}
      </Button>
      {submitError ? <p role="alert" className="text-sm text-red-300">{submitError}</p> : null}
    </Card>
  );
}
