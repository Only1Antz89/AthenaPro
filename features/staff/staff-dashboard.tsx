"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { SiteHeader } from "@/components/layout/site-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Field } from "@/components/ui/field";
import { LoadingPanel } from "@/components/ui/loading-panel";
import { NotificationsList } from "@/components/ui/notifications-list";
import { PerformanceBar } from "@/components/ui/performance-bar";
import { Select } from "@/components/ui/select";
import { StarInput } from "@/components/ui/star-input";
import { StatCard } from "@/components/ui/stat-card";
import { Stars } from "@/components/ui/stars";
import { Textarea } from "@/components/ui/textarea";
import { useQueryState } from "@/features/app/use-query-state";
import { useStaffBook } from "@/features/app/use-staffbook";
import { formatApplicationStatus } from "@/lib/brand";
import { toDisplayError } from "@/lib/errors";
import { CLIENT_FEEDBACK_REASON_OPTIONS, clientFeedbackSchema } from "@/lib/validation/schemas";
import { formatCurrency, formatDate } from "@/lib/utils";

export function StaffDashboard() {
  const { provider, session, loading } = useStaffBook();
  const dashboard = useQueryState(() => provider.getStaffDashboard(), [provider, session?.userId]);
  const [feedbackTargetId, setFeedbackTargetId] = useState("");
  const [sentiment, setSentiment] = useState<"up" | "down">("up");
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [note, setNote] = useState("");

  if (loading || dashboard.loading) {
    return (
      <main>
        <SiteHeader />
        <DashboardShell
          eyebrow="Field team workspace"
          title="Loading profile"
          description="Preparing your profile and job visibility."
        >
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <LoadingPanel key={index} />
            ))}
          </div>
        </DashboardShell>
      </main>
    );
  }

  if (!session || session.role !== "staff") {
    return (
      <main>
        <SiteHeader />
        <DashboardShell
          eyebrow="Field team workspace"
          title="Sign in required"
          description="This workspace is available only to field-team accounts."
        >
          <EmptyState
            title="Sign in as field team"
            description="Create a field-team profile to review jobs, submit requests, and track standing."
            action={
              <Link href="/auth/login">
                <Button>Platform access</Button>
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
        <DashboardShell
          eyebrow="Field team workspace"
          title="Profile unavailable"
          description={dashboard.error ?? "Unable to load the field-team workspace."}
        >
          <EmptyState title="Try again" description="The dashboard data did not resolve cleanly." />
        </DashboardShell>
      </main>
    );
  }

  const feedbackTarget =
    dashboard.data.clientFeedbackQueue.find((item) => item.id === feedbackTargetId) ??
    dashboard.data.clientFeedbackQueue[0] ??
    null;
  const feedbackReasons = CLIENT_FEEDBACK_REASON_OPTIONS[sentiment];

  return (
    <main>
      <SiteHeader />
      <DashboardShell
        eyebrow="Field team workspace"
        title={`Welcome back, ${dashboard.data.profile.fullName}`}
        description="Track standing, applications, reviews, and live job matches."
      >
        <div className="-mx-4 mb-6 overflow-x-auto px-4 pb-2 md:hidden">
          <div className="flex min-w-max gap-2">
            {[
              { href: "/dashboard/staff/jobs", label: "Jobs" },
              { href: "/dashboard/staff/profile", label: "Profile" },
              { href: "/dashboard/staff/profile", label: "Messages" }
            ].map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="inline-flex min-h-11 items-center rounded-full border border-white/10 bg-white/[0.04] px-4 text-sm font-medium text-white/78"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Overall score"
            value={dashboard.data.performanceSummary.overallRating.toFixed(1)}
            hint="Bayesian-weighted performance across completed reviews."
          />
          <StatCard
            label="Rating band"
            value={`${dashboard.data.performanceSummary.ratingBand}★`}
            hint="Used for event-tier matching eligibility."
          />
          <StatCard
            label="Standing"
            value={`#${dashboard.data.rank}`}
            hint="Standing adjusts for review depth and consistency."
          />
          <StatCard
            label="Review notes"
            value={dashboard.data.performanceSummary.reviewCount}
            hint="Verified company feedback from completed work."
          />
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="space-y-6">
            <Card>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate">
                    Profile summary
                  </p>
                  <h2 className="mt-3 text-2xl font-semibold text-ink">{dashboard.data.profile.fullName}</h2>
                </div>
                <Link href="/dashboard/staff/profile">
                  <Button variant="secondary" className="min-h-12 w-full sm:w-auto">
                    Manage profile
                  </Button>
                </Link>
              </div>
              <p className="mt-3 text-sm text-slate">
                {dashboard.data.operatorProfile?.details ?? dashboard.data.profile.bio}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {dashboard.data.profile.skills.map((skill) => (
                  <Badge key={skill} variant="neutral">
                    {skill}
                  </Badge>
                ))}
              </div>
              <p className="mt-4 text-sm text-slate">
                {dashboard.data.operatorProfile?.baseLocation ?? dashboard.data.profile.location} •{" "}
                {dashboard.data.operatorProfile?.availabilitySummary ?? dashboard.data.profile.availability}
              </p>
              <div className="mt-4">
                <Stars value={dashboard.data.performanceSummary.overallRating || 0} size="md" />
              </div>
              <div className="mt-6 space-y-4">
                <PerformanceBar
                  label="Reliability"
                  value={dashboard.data.performanceSummary.categoryRatings.reliability}
                />
                <PerformanceBar
                  label="Professionalism"
                  value={dashboard.data.performanceSummary.categoryRatings.professionalism}
                />
                <PerformanceBar
                  label="Communication"
                  value={dashboard.data.performanceSummary.categoryRatings.communication}
                />
                <PerformanceBar
                  label="Customer service"
                  value={dashboard.data.performanceSummary.categoryRatings.customerService}
                />
                <PerformanceBar
                  label="Pressure handling"
                  value={dashboard.data.performanceSummary.categoryRatings.pressureHandling}
                />
              </div>
            </Card>

            <Card>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate">
                    Recent requests
                  </p>
                  <h2 className="mt-3 text-2xl font-semibold text-ink">Deployment status at a glance</h2>
                </div>
                <Link href="/dashboard/staff/jobs">
                  <Button variant="secondary" className="min-h-12 w-full sm:w-auto">
                    Open jobs board
                  </Button>
                </Link>
              </div>
              <div className="mt-6 space-y-4">
                {dashboard.data.recentApplications.map((application) => (
                  <div key={application.id} className="rounded-[20px] border border-white/10 bg-white/[0.03] px-4 py-4 sm:rounded-[24px]">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                      <div>
                        <p className="font-semibold text-ink">{application.job.title}</p>
                        <p className="text-sm text-slate">
                          {application.event.title} • {application.organization.name}
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
                        {formatApplicationStatus(application.status)}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <NotificationsList notifications={dashboard.data.notifications} title="Inbox" />
          </div>

          <div className="space-y-6">
            <Card>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate">
                Suggested jobs
              </p>
              <div className="mt-5 space-y-4">
                {dashboard.data.recommendedJobs.map((suggestion) => (
                  <div key={suggestion.job.id} className="rounded-[20px] border border-white/10 bg-white/[0.03] px-4 py-4 sm:rounded-[24px]">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                      <div>
                        <p className="font-semibold text-ink">{suggestion.job.title}</p>
                        <p className="text-sm text-slate">
                          {suggestion.job.event.location} • {formatDate(suggestion.job.event.eventDate)}
                        </p>
                      </div>
                      <p className="text-sm font-semibold text-ink">
                        {formatCurrency(suggestion.job.payRate)}/hr
                      </p>
                    </div>
                    <p className="mt-3 text-xs uppercase tracking-[0.16em] text-slate">
                      Match score {suggestion.score.toFixed(0)}
                    </p>
                    <p className="mt-2 text-sm text-slate">{suggestion.reasons.join(" • ")}</p>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate">
                Company feedback
              </p>
              {feedbackTarget ? (
                <div className="mt-5 space-y-4">
                  <Field label="Completed job">
                    <Select value={feedbackTargetId} onChange={(event) => setFeedbackTargetId(event.target.value)}>
                      <option value="">Choose a job</option>
                      {dashboard.data.clientFeedbackQueue.map((application) => (
                        <option key={application.id} value={application.id}>
                          {application.organization.name} • {application.job.title}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Thumb">
                    <div className="flex gap-3">
                      <Button
                        type="button"
                        variant={sentiment === "up" ? "accent" : "secondary"}
                        onClick={() => {
                          setSentiment("up");
                          setSelectedReasons([]);
                        }}
                      >
                        Thumbs up
                      </Button>
                      <Button
                        type="button"
                        variant={sentiment === "down" ? "accent" : "secondary"}
                        onClick={() => {
                          setSentiment("down");
                          setSelectedReasons([]);
                        }}
                      >
                        Thumbs down
                      </Button>
                    </div>
                  </Field>
                  <Field label="Why">
                    <div className="flex flex-wrap gap-2">
                      {feedbackReasons.map((reason) => {
                        const selected = selectedReasons.includes(reason);

                        return (
                          <Button
                            key={reason}
                            type="button"
                            variant={selected ? "accent" : "secondary"}
                            onClick={() =>
                              setSelectedReasons((current) =>
                                selected
                                  ? current.filter((item) => item !== reason)
                                  : current.length >= 5
                                    ? current
                                    : [...current, reason]
                              )
                            }
                          >
                            {reason.replace(/_/g, " ")}
                          </Button>
                        );
                      })}
                    </div>
                  </Field>
                  <Field label="Optional note">
                    <Textarea value={note} onChange={(event) => setNote(event.target.value)} />
                  </Field>
                  <Button
                    variant="accent"
                    className="min-h-12 w-full sm:w-auto"
                    onClick={async () => {
                      try {
                        const payload = clientFeedbackSchema.parse({
                          assignmentId: feedbackTarget.id,
                          jobId: feedbackTarget.job.id,
                          clientId: feedbackTarget.organization.id,
                          sentiment,
                          reasons: selectedReasons,
                          note
                        });
                        await provider.submitClientFeedback(payload);
                        toast.success("Company feedback submitted.");
                        setFeedbackTargetId("");
                        setSelectedReasons([]);
                        setNote("");
                        await dashboard.refresh();
                      } catch (error) {
                        toast.error(toDisplayError(error));
                      }
                    }}
                  >
                    Submit feedback
                  </Button>
                </div>
              ) : (
                <div className="mt-5">
                  <EmptyState
                    title="No company feedback due"
                    description="Completed jobs waiting for feedback will appear here."
                  />
                </div>
              )}
            </Card>

            <Card>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate">
                Recent reviews
              </p>
              <div className="mt-5 space-y-4">
                {dashboard.data.reviews.map((review) => (
                  <div key={review.id} className="rounded-[24px] border border-white/10 bg-white/[0.03] px-4 py-4">
                    <Stars value={review.overallScore} />
                    <p className="mt-3 text-sm text-slate">{review.comment}</p>
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
