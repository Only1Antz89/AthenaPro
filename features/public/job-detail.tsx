"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { PageContainer } from "@/components/layout/page-container";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { useStaffBook } from "@/features/app/use-staffbook";
import { toDisplayError } from "@/lib/errors";
import { jobApplicationSchema } from "@/lib/validation/schemas";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import type { EnrichedJob } from "@/types/domain";

export function JobDetail({ job }: { job: EnrichedJob }) {
  const router = useRouter();
  const { provider, session } = useStaffBook();
  const [coverNote, setCoverNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  return (
    <main>
      <SiteHeader />
      <section className="py-12">
        <PageContainer className="grid gap-8 lg:grid-cols-[1fr_360px]">
          <div>
            <Link href="/jobs" className="text-sm font-semibold text-accent">
              Back to jobs
            </Link>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <h1 className="font-display text-5xl font-semibold text-ink">{job.title}</h1>
              <Badge variant={job.status === "open" ? "success" : "neutral"}>{job.status}</Badge>
              <Badge variant="accent">{job.roleType}</Badge>
            </div>
            <p className="mt-5 max-w-3xl text-lg text-slate">{job.description}</p>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {[
                ["Event", job.event.title],
                ["Location", job.event.location],
                ["Event date", formatDate(job.event.eventDate)],
                ["Shift", `${formatDateTime(job.shiftStart)} - ${formatDateTime(job.shiftEnd)}`],
                ["Pay", `${formatCurrency(job.payRate)}/hr`],
                ["Positions", String(job.positionsNeeded)]
              ].map(([label, value]) => (
                <Card key={label} className="space-y-2">
                  <p className="text-sm font-medium text-slate">{label}</p>
                  <p className="text-lg font-semibold text-ink">{value}</p>
                </Card>
              ))}
            </div>
          </div>

          <div className="space-y-5">
            <Card>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-accent">Organiser</p>
              <h2 className="mt-3 text-2xl font-semibold text-ink">{job.organization.name}</h2>
              <p className="mt-2 text-sm text-slate">
                Believable organiser identity with event-linked jobs and staffing actions.
              </p>
              <p className="mt-4 text-sm text-slate">{job.applicationCount} applications on this role</p>
            </Card>

            <Card>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-accent">Apply for this job</p>
              {session?.role === "staff" ? (
                <form
                  className="mt-5 space-y-4"
                  onSubmit={async (event) => {
                    event.preventDefault();
                    try {
                      setSubmitting(true);
                      const payload = jobApplicationSchema.parse({
                        jobId: job.id,
                        coverNote
                      });
                      await provider.applyToJob(payload);
                      toast.success("Application submitted.");
                      setCoverNote("");
                      router.push("/dashboard/staff");
                    } catch (error) {
                      toast.error(toDisplayError(error));
                    } finally {
                      setSubmitting(false);
                    }
                  }}
                >
                  <Field label="Cover note" hint="This is validated and persisted locally in demo mode.">
                    <Textarea
                      value={coverNote}
                      onChange={(event) => setCoverNote(event.target.value)}
                      placeholder="Tell the organiser why you are a strong fit."
                    />
                  </Field>
                  <Button type="submit" variant="accent" disabled={submitting}>
                    {submitting ? "Submitting..." : "Apply now"}
                  </Button>
                </form>
              ) : (
                <div className="mt-5 space-y-4">
                  <p className="text-sm text-slate">
                    Sign in as staff to apply and track your application status.
                  </p>
                  <Link href="/auth/login">
                    <Button variant="accent">Log in to apply</Button>
                  </Link>
                </div>
              )}
            </Card>
          </div>
        </PageContainer>
      </section>
      <SiteFooter />
    </main>
  );
}
