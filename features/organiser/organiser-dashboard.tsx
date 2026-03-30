"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { SiteHeader } from "@/components/layout/site-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { LoadingPanel } from "@/components/ui/loading-panel";
import { Select } from "@/components/ui/select";
import { StarInput } from "@/components/ui/star-input";
import { StatCard } from "@/components/ui/stat-card";
import { Textarea } from "@/components/ui/textarea";
import { useQueryState } from "@/features/app/use-query-state";
import { useStaffBook } from "@/features/app/use-staffbook";
import { toDisplayError } from "@/lib/errors";
import { createJobSchema, staffRatingSchema } from "@/lib/validation/schemas";
import { formatCurrency, formatDate } from "@/lib/utils";

export function OrganiserDashboard() {
  const router = useRouter();
  const { provider, session, loading, refreshSession } = useStaffBook();
  const [jobForm, setJobForm] = useState({
    eventId: "",
    title: "",
    description: "",
    roleType: "",
    shiftStart: "",
    shiftEnd: "",
    payRate: "15",
    positionsNeeded: "2"
  });
  const [ratingForm, setRatingForm] = useState({
    eventId: "",
    staffId: "",
    jobId: "",
    rating: 5,
    comment: ""
  });

  const dashboard = useQueryState(
    () => provider.getOrganiserDashboard(),
    [provider, session?.userId]
  );

  const selectedRatingContext = useMemo(
    () =>
      dashboard.data?.ratingQueue.find(
        (item) =>
          item.event.id === ratingForm.eventId &&
          item.staff.id === ratingForm.staffId &&
          item.job.id === ratingForm.jobId
      ),
    [dashboard.data?.ratingQueue, ratingForm]
  );

  if (loading || dashboard.loading) {
    return (
      <main>
        <SiteHeader />
        <DashboardShell
          eyebrow="Organiser"
          title="Loading dashboard"
          description="Preparing events, jobs, and applicant activity."
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <LoadingPanel key={index} />
            ))}
          </div>
        </DashboardShell>
      </main>
    );
  }

  if (!session || session.role !== "organiser") {
    return (
      <main>
        <SiteHeader />
        <DashboardShell
          eyebrow="Organiser"
          title="Sign in required"
          description="This dashboard is available only to organiser accounts."
        >
          <EmptyState
            title="Sign in as an organiser"
            description="Use signup to create a demo organiser workspace or connect live Supabase auth."
            action={
              <Link href="/auth/login">
                <Button>Go to login</Button>
              </Link>
            }
          />
        </DashboardShell>
      </main>
    );
  }

  if (dashboard.error || !dashboard.data) {
    return (
      <main>
        <SiteHeader />
        <DashboardShell eyebrow="Organiser" title="Dashboard unavailable" description={dashboard.error ?? "Unable to load organiser dashboard."}>
          <EmptyState title="Retry loading" description="The dashboard data did not resolve cleanly." action={<Button onClick={() => router.refresh()}>Refresh</Button>} />
        </DashboardShell>
      </main>
    );
  }

  return (
    <main>
      <SiteHeader />
      <DashboardShell
        eyebrow="Organiser dashboard"
        title={`Welcome back, ${dashboard.data.profile.fullName}`}
        description={`You are managing ${dashboard.data.organization.name}, with events, jobs, and rating tasks visible below.`}
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Upcoming events" value={dashboard.data.stats.upcomingEvents} hint="Published events still to be delivered." />
          <StatCard label="Active jobs" value={dashboard.data.stats.activeJobs} hint="Open positions currently visible to staff." />
          <StatCard label="Pending applicants" value={dashboard.data.stats.pendingApplicants} hint="Recent applications needing a decision." />
          <StatCard label="Completed events" value={dashboard.data.stats.completedEvents} hint="Historical events eligible for ratings." />
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-accent">Events</p>
                  <h2 className="mt-3 text-2xl font-semibold text-ink">Your event pipeline</h2>
                </div>
                <Link href="/events/new">
                  <Button variant="secondary">Create event</Button>
                </Link>
              </div>
              <div className="mt-6 space-y-4">
                {dashboard.data.events.map((event) => (
                  <div key={event.id} className="rounded-[24px] border border-slate-100 p-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="text-lg font-semibold text-ink">{event.title}</p>
                      <Badge variant={event.status === "completed" ? "neutral" : "accent"}>{event.status}</Badge>
                    </div>
                    <p className="mt-2 text-sm text-slate">
                      {event.location} • {formatDate(event.eventDate)} • {event.requiredRoles.join(", ")}
                    </p>
                    {event.status !== "completed" ? (
                      <Button
                        className="mt-4"
                        variant="ghost"
                        onClick={async () => {
                          try {
                            await provider.markEventCompleted(event.id);
                            toast.success("Event marked completed.");
                            await refreshSession();
                            router.refresh();
                          } catch (error) {
                            toast.error(toDisplayError(error));
                          }
                        }}
                      >
                        Mark completed
                      </Button>
                    ) : null}
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-accent">Recent applicants</p>
              <h2 className="mt-3 text-2xl font-semibold text-ink">Accept or reject with clear status history</h2>
              <div className="mt-6 space-y-4">
                {dashboard.data.recentApplicants.map((application) => (
                  <div key={application.id} className="rounded-[24px] border border-slate-100 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-ink">{application.staff.fullName}</p>
                        <p className="text-sm text-slate">
                          {application.job.title} • {application.event.title}
                        </p>
                      </div>
                      <Badge
                        variant={
                          application.status === "accepted"
                            ? "success"
                            : application.status === "rejected"
                              ? "danger"
                              : "warning"
                        }
                      >
                        {application.status}
                      </Badge>
                    </div>
                    <p className="mt-3 text-sm text-slate">{application.coverNote}</p>
                    {application.status === "pending" ? (
                      <div className="mt-4 flex gap-3">
                        <Button
                          variant="accent"
                          onClick={async () => {
                            try {
                              await provider.updateApplicationStatus(application.id, "accepted");
                              toast.success("Applicant accepted.");
                              router.refresh();
                            } catch (error) {
                              toast.error(toDisplayError(error));
                            }
                          }}
                        >
                          Accept
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={async () => {
                            try {
                              await provider.updateApplicationStatus(application.id, "rejected");
                              toast.success("Applicant rejected.");
                              router.refresh();
                            } catch (error) {
                              toast.error(toDisplayError(error));
                            }
                          }}
                        >
                          Reject
                        </Button>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-accent">Post a job</p>
              <h2 className="mt-3 text-2xl font-semibold text-ink">Attach new staffing roles to an existing event</h2>
              <form
                className="mt-6 space-y-4"
                onSubmit={async (event) => {
                  event.preventDefault();
                  try {
                    const payload = createJobSchema.parse({
                      ...jobForm,
                      payRate: Number(jobForm.payRate),
                      positionsNeeded: Number(jobForm.positionsNeeded)
                    });
                    await provider.createJob(payload);
                    toast.success("Job created.");
                    setJobForm({
                      eventId: "",
                      title: "",
                      description: "",
                      roleType: "",
                      shiftStart: "",
                      shiftEnd: "",
                      payRate: "15",
                      positionsNeeded: "2"
                    });
                    router.refresh();
                  } catch (error) {
                    toast.error(toDisplayError(error));
                  }
                }}
              >
                <Field label="Event">
                  <Select value={jobForm.eventId} onChange={(event) => setJobForm((current) => ({ ...current, eventId: event.target.value }))}>
                    <option value="">Choose an event</option>
                    {dashboard.data.events.map((event) => (
                      <option key={event.id} value={event.id}>
                        {event.title}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Job title">
                  <Input value={jobForm.title} onChange={(event) => setJobForm((current) => ({ ...current, title: event.target.value }))} />
                </Field>
                <Field label="Role type">
                  <Input value={jobForm.roleType} onChange={(event) => setJobForm((current) => ({ ...current, roleType: event.target.value }))} />
                </Field>
                <Field label="Description">
                  <Textarea value={jobForm.description} onChange={(event) => setJobForm((current) => ({ ...current, description: event.target.value }))} />
                </Field>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Shift start">
                    <Input type="datetime-local" value={jobForm.shiftStart} onChange={(event) => setJobForm((current) => ({ ...current, shiftStart: event.target.value }))} />
                  </Field>
                  <Field label="Shift end">
                    <Input type="datetime-local" value={jobForm.shiftEnd} onChange={(event) => setJobForm((current) => ({ ...current, shiftEnd: event.target.value }))} />
                  </Field>
                  <Field label="Pay rate">
                    <Input type="number" min={1} value={jobForm.payRate} onChange={(event) => setJobForm((current) => ({ ...current, payRate: event.target.value }))} />
                  </Field>
                  <Field label="Positions needed">
                    <Input type="number" min={1} value={jobForm.positionsNeeded} onChange={(event) => setJobForm((current) => ({ ...current, positionsNeeded: event.target.value }))} />
                  </Field>
                </div>
                <Button type="submit" variant="accent">
                  Post job
                </Button>
              </form>
            </Card>

            <Card>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-accent">Rating queue</p>
              <h2 className="mt-3 text-2xl font-semibold text-ink">Capture post-event quality while it is still fresh</h2>
              {dashboard.data.ratingQueue.length === 0 ? (
                <div className="mt-6">
                  <EmptyState
                    title="Nothing waiting for rating"
                    description="Accepted staff from completed events will appear here once they have not yet been reviewed."
                  />
                </div>
              ) : (
                <div className="mt-6 space-y-4">
                  <Field label="Select eligible staff">
                    <Select
                      value={selectedRatingContext ? `${selectedRatingContext.event.id}:${selectedRatingContext.staff.id}:${selectedRatingContext.job.id}` : ""}
                      onChange={(event) => {
                        const [eventId, staffId, jobId] = event.target.value.split(":");
                        setRatingForm((current) => ({ ...current, eventId, staffId, jobId }));
                      }}
                    >
                      <option value="">Choose a staff member</option>
                      {dashboard.data.ratingQueue.map((item) => (
                        <option key={`${item.event.id}:${item.staff.id}:${item.job.id}`} value={`${item.event.id}:${item.staff.id}:${item.job.id}`}>
                          {item.staff.fullName} • {item.event.title}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Star rating">
                    <StarInput value={ratingForm.rating} onChange={(value) => setRatingForm((current) => ({ ...current, rating: value }))} />
                  </Field>
                  <Field label="Comment">
                    <Textarea value={ratingForm.comment} onChange={(event) => setRatingForm((current) => ({ ...current, comment: event.target.value }))} />
                  </Field>
                  <Button
                    variant="accent"
                    onClick={async () => {
                      try {
                        const payload = staffRatingSchema.parse(ratingForm);
                        await provider.submitRating(payload);
                        toast.success("Rating submitted.");
                        setRatingForm({ eventId: "", staffId: "", jobId: "", rating: 5, comment: "" });
                        router.refresh();
                      } catch (error) {
                        toast.error(toDisplayError(error));
                      }
                    }}
                  >
                    Submit rating
                  </Button>
                </div>
              )}
            </Card>

            <Card>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-accent">Open jobs</p>
              <div className="mt-5 space-y-4">
                {dashboard.data.jobs.slice(0, 5).map((job) => (
                  <div key={job.id} className="rounded-[24px] border border-slate-100 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-semibold text-ink">{job.title}</p>
                        <p className="text-sm text-slate">
                          {job.event.title} • {formatDate(job.event.eventDate)}
                        </p>
                      </div>
                      <p className="text-sm font-semibold text-ink">{formatCurrency(job.payRate)}/hr</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </DashboardShell>
    </main>
  );
}
