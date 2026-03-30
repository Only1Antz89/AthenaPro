"use client";

import Link from "next/link";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { SiteHeader } from "@/components/layout/site-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingPanel } from "@/components/ui/loading-panel";
import { StatCard } from "@/components/ui/stat-card";
import { Stars } from "@/components/ui/stars";
import { useQueryState } from "@/features/app/use-query-state";
import { useStaffBook } from "@/features/app/use-staffbook";
import { formatCurrency, formatDate } from "@/lib/utils";

export function StaffDashboard() {
  const { provider, session, loading } = useStaffBook();
  const dashboard = useQueryState(() => provider.getStaffDashboard(), [provider, session?.userId]);

  if (loading || dashboard.loading) {
    return (
      <main>
        <SiteHeader />
        <DashboardShell eyebrow="Staff" title="Loading dashboard" description="Preparing profile, rating, and application detail.">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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
        <DashboardShell eyebrow="Staff" title="Sign in required" description="This dashboard is available only to staff accounts.">
          <EmptyState
            title="Sign in as staff"
            description="Create a staff account to browse jobs, apply, and see your ranking."
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
        <DashboardShell eyebrow="Staff" title="Dashboard unavailable" description={dashboard.error ?? "Unable to load staff dashboard."}>
          <EmptyState title="Try again" description="The dashboard data did not resolve cleanly." />
        </DashboardShell>
      </main>
    );
  }

  return (
    <main>
      <SiteHeader />
      <DashboardShell
        eyebrow="Staff dashboard"
        title={`Welcome back, ${dashboard.data.profile.fullName}`}
        description="Track your ranking, keep an eye on application outcomes, and discover fresh roles."
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Average rating" value={dashboard.data.ratingSummary.averageRating.toFixed(1)} hint="Visible as stars across the directory." />
          <StatCard label="Weighted rank" value={`#${dashboard.data.rank}`} hint="Ranking adjusts for review count and quality." />
          <StatCard label="Reviews" value={dashboard.data.ratingSummary.reviewCount} hint="Verified organiser ratings on completed events." />
          <StatCard label="Applications" value={dashboard.data.recentApplications.length} hint="Recent submissions and status changes." />
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="space-y-6">
            <Card>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-accent">Profile summary</p>
              <h2 className="mt-3 text-2xl font-semibold text-ink">{dashboard.data.profile.fullName}</h2>
              <p className="mt-3 text-sm text-slate">{dashboard.data.profile.bio}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {dashboard.data.profile.skills.map((skill) => (
                  <Badge key={skill} variant="neutral">
                    {skill}
                  </Badge>
                ))}
              </div>
              <p className="mt-4 text-sm text-slate">{dashboard.data.profile.availability}</p>
              <div className="mt-4">
                <Stars value={dashboard.data.ratingSummary.averageRating || 4.2} size="md" />
              </div>
            </Card>

            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-accent">Recent applications</p>
                  <h2 className="mt-3 text-2xl font-semibold text-ink">Status at a glance</h2>
                </div>
                <Link href="/jobs">
                  <Button variant="secondary">Find more jobs</Button>
                </Link>
              </div>
              <div className="mt-6 space-y-4">
                {dashboard.data.recentApplications.map((application) => (
                  <div key={application.id} className="rounded-[24px] border border-slate-100 p-4">
                    <div className="flex items-center justify-between gap-4">
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
                        {application.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-accent">Recommended jobs</p>
              <div className="mt-5 space-y-4">
                {dashboard.data.recommendedJobs.map((job) => (
                  <div key={job.id} className="rounded-[24px] border border-slate-100 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-semibold text-ink">{job.title}</p>
                        <p className="text-sm text-slate">
                          {job.event.location} • {formatDate(job.event.eventDate)}
                        </p>
                      </div>
                      <p className="text-sm font-semibold text-ink">{formatCurrency(job.payRate)}/hr</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-accent">Recent reviews</p>
              <div className="mt-5 space-y-4">
                {dashboard.data.reviews.map((review) => (
                  <div key={review.id} className="rounded-[24px] border border-slate-100 p-4">
                    <Stars value={review.rating} />
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
