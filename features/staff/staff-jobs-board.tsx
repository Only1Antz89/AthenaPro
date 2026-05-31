"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, Bell, Briefcase, Flame, Heart, Sparkles, Trash2 } from "lucide-react";
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
import { StatCard } from "@/components/ui/stat-card";
import { useQueryState } from "@/features/app/use-query-state";
import { useStaffBook } from "@/features/app/use-staffbook";
import { sortBoardItemsByNew } from "@/lib/domain/jobs-board";
import { formatApplicationStatus } from "@/lib/brand";
import { toDisplayError } from "@/lib/errors";
import { jobAlertSchema } from "@/lib/validation/schemas";
import { cn, formatCurrency, formatDate, formatRelativeTime } from "@/lib/utils";

function getApplicationVariant(status: string | undefined) {
  if (status === "accepted") {
    return "success" as const;
  }

  if (status === "rejected" || status === "withdrawn") {
    return "danger" as const;
  }

  return "warning" as const;
}

type BoardView = "trending" | "new" | "saved" | "applied";

export function StaffJobsBoard() {
  const { provider, session, loading } = useStaffBook();
  const board = useQueryState(() => provider.getStaffJobsBoard(), [provider, session?.userId]);
  const [view, setView] = useState<BoardView>("trending");
  const [alertForm, setAlertForm] = useState({
    name: "New matching roles",
    query: "",
    location: "",
    roleTypes: "",
    minimumPay: "",
    dateFrom: "",
    dateTo: "",
    emailOptIn: true
  });

  const items = useMemo(() => {
    if (!board.data) {
      return [];
    }

    if (view === "saved") {
      return sortBoardItemsByNew(board.data.items.filter((item) => item.isSaved));
    }

    if (view === "applied") {
      return sortBoardItemsByNew(board.data.items.filter((item) => item.hasApplied));
    }

    return view === "trending" ? board.data.items : sortBoardItemsByNew(board.data.items);
  }, [board.data, view]);

  if (loading || board.loading) {
    return (
      <main>
        <SiteHeader />
        <DashboardShell
          eyebrow="Field team workspace"
          title="Loading jobs board"
          description="Preparing new openings and current momentum."
        >
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
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
          description="This jobs board is available only to field-team accounts."
        >
          <EmptyState
            title="Sign in as field team"
            description="Review new openings and track what is trending."
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

  if (board.error || !board.data) {
    return (
      <main>
        <SiteHeader />
        <DashboardShell
          eyebrow="Field team workspace"
          title="Jobs board unavailable"
          description={board.error ?? "Unable to load the operator jobs board."}
        >
          <EmptyState title="Try again" description="The signed-in jobs board did not resolve cleanly." />
        </DashboardShell>
      </main>
    );
  }

  const appliedCount = board.data.items.filter((item) => item.hasApplied).length;
  const savedCount = board.data.items.filter((item) => item.isSaved).length;
  const highestTrend = board.data.items[0];

  return (
    <main>
      <SiteHeader />
      <DashboardShell
        eyebrow="Field team workspace"
        title="Jobs"
        description="Track what is moving now, switch between trending and newly posted roles, and keep your current applications in view."
      >
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Open jobs"
            value={board.data.items.length}
            hint="All currently open operator roles."
          />
          <StatCard
            label="Applied roles"
            value={appliedCount}
            hint="Your current applications still stay visible on the board."
          />
          <StatCard
            label="Saved roles"
            value={savedCount}
            hint="Roles you have marked for later review."
          />
          <StatCard
            label="Top momentum"
            value={highestTrend ? highestTrend.job.title : "None"}
            hint="Highest hybrid score from recent views, applications, and fit."
          />
        </div>

        <Card className="mt-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate">Board view</p>
              <h2 className="mt-3 text-2xl font-semibold text-ink">New or trending, one surface</h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate">
                Trending blends recent demand with your operator fit. New keeps the board in pure posted-order.
              </p>
            </div>
            <div className="inline-flex rounded-full border border-white/10 bg-white/[0.03] p-1">
              {[
                { id: "trending", label: "Trending", icon: Flame },
                { id: "new", label: "New", icon: Sparkles },
                { id: "saved", label: "Saved", icon: Heart },
                { id: "applied", label: "Applied", icon: Briefcase }
              ].map((option) => {
                const Icon = option.icon;
                const isActive = view === option.id;

                return (
                  <button
                    key={option.id}
                    type="button"
                      onClick={() => setView(option.id as BoardView)}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition",
                      isActive ? "bg-mist text-canvas" : "text-slate hover:text-ink"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>
        </Card>

        <Card className="mt-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate">Job alerts</p>
              <h2 className="mt-3 text-2xl font-semibold text-ink">Save searches and receive matching role alerts</h2>
              <p className="mt-3 text-sm leading-7 text-slate">
                Alerts reuse your job-board criteria and can send email when matching jobs appear.
              </p>
              <div className="mt-5 space-y-3">
                {board.data.alerts.length === 0 ? (
                  <p className="text-sm text-slate">No saved alerts yet.</p>
                ) : (
                  board.data.alerts.map((alert) => (
                    <div key={alert.id} className="flex flex-wrap items-center justify-between gap-3 rounded-[20px] border border-line/60 bg-surfaceRaised/50 px-4 py-3">
                      <div>
                        <p className="font-medium text-ink">{alert.name}</p>
                        <p className="text-sm text-slate">
                          {[alert.location, alert.roleTypes.join(", "), alert.minimumPay ? `${formatCurrency(alert.minimumPay)}/hr+` : ""]
                            .filter(Boolean)
                            .join(" • ") || "All open jobs"}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        className="gap-2"
                        onClick={async () => {
                          try {
                            await provider.deleteJobAlert(alert.id);
                            toast.success("Job alert deleted.");
                            await board.refresh();
                          } catch (error) {
                            toast.error(toDisplayError(error));
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>
            <form
              className="grid gap-4"
              onSubmit={async (event) => {
                event.preventDefault();
                try {
                  const payload = jobAlertSchema.parse({
                    ...alertForm,
                    roleTypes: alertForm.roleTypes.split(",").map((item) => item.trim()).filter(Boolean),
                    minimumPay: alertForm.minimumPay ? Number(alertForm.minimumPay) : null,
                    isActive: true
                  });
                  await provider.upsertJobAlert(payload);
                  toast.success("Job alert saved.");
                  setAlertForm({
                    name: "New matching roles",
                    query: "",
                    location: "",
                    roleTypes: "",
                    minimumPay: "",
                    dateFrom: "",
                    dateTo: "",
                    emailOptIn: true
                  });
                  await board.refresh();
                } catch (error) {
                  toast.error(toDisplayError(error));
                }
              }}
            >
              <Field label="Alert name">
                <Input value={alertForm.name} onChange={(event) => setAlertForm((current) => ({ ...current, name: event.target.value }))} />
              </Field>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Search terms">
                  <Input value={alertForm.query} onChange={(event) => setAlertForm((current) => ({ ...current, query: event.target.value }))} placeholder="VIP, host, scanner" />
                </Field>
                <Field label="Location">
                  <Input value={alertForm.location} onChange={(event) => setAlertForm((current) => ({ ...current, location: event.target.value }))} placeholder="London" />
                </Field>
                <Field label="Disciplines">
                  <Input value={alertForm.roleTypes} onChange={(event) => setAlertForm((current) => ({ ...current, roleTypes: event.target.value }))} placeholder="Host, Guest Services" />
                </Field>
                <Field label="Minimum rate">
                  <Input type="number" min={0} value={alertForm.minimumPay} onChange={(event) => setAlertForm((current) => ({ ...current, minimumPay: event.target.value }))} />
                </Field>
                <Field label="Date from">
                  <Input type="date" value={alertForm.dateFrom} onChange={(event) => setAlertForm((current) => ({ ...current, dateFrom: event.target.value }))} />
                </Field>
                <Field label="Date to">
                  <Input type="date" value={alertForm.dateTo} onChange={(event) => setAlertForm((current) => ({ ...current, dateTo: event.target.value }))} />
                </Field>
              </div>
              <label className="flex items-center gap-3 text-sm text-slate">
                <input
                  type="checkbox"
                  checked={alertForm.emailOptIn}
                  onChange={(event) => setAlertForm((current) => ({ ...current, emailOptIn: event.target.checked }))}
                />
                Email me when matching jobs are posted.
              </label>
              <Button type="submit" variant="accent" className="w-full gap-2 sm:w-auto">
                <Bell className="h-4 w-4" />
                Save alert
              </Button>
            </form>
          </div>
        </Card>

        <div className="mt-8 grid gap-4">
          {items.length === 0 ? (
            <Card>
              <EmptyState
                title="No open jobs right now"
                description="New jobs will appear here with fresh or trending signals."
              />
            </Card>
          ) : (
            items.map((item) => (
              <Card key={item.job.id} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_240px] lg:items-center">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-xl font-semibold text-ink sm:text-2xl">{item.job.title}</h2>
                    <Badge variant="accent">{item.job.roleType}</Badge>
                    <Badge variant="neutral">{item.job.event.location}</Badge>
                    {item.hasApplied ? (
                      <Badge variant={getApplicationVariant(item.applicationStatus)}>
                        {formatApplicationStatus(item.applicationStatus!)}
                      </Badge>
                    ) : null}
                    {item.isSaved ? <Badge variant="neutral">Saved</Badge> : null}
                  </div>

                  <p className="mt-2 text-sm leading-7 text-slate">
                    {item.job.event.title} on {formatDate(item.job.event.eventDate)}. Posted{" "}
                    {formatRelativeTime(item.job.createdAt)}.
                  </p>

                  <p className="mt-4 max-w-3xl text-sm leading-7 text-slate">{item.job.description}</p>

                  <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate">
                    <span>{formatCurrency(item.job.payRate)}/hr</span>
                    <span>{item.job.positionsNeeded} positions</span>
                    <span>{item.trendingSignals.views24h} views in 24h</span>
                    <span>{item.trendingSignals.applications24h} applications in 24h</span>
                    <span>{item.matchScore.toFixed(0)} fit score</span>
                  </div>

                  {item.matchReasons.length > 0 ? (
                    <p className="mt-4 text-sm text-slate">{item.matchReasons.slice(0, 2).join(" • ")}</p>
                  ) : (
                    <p className="mt-4 text-sm text-slate">
                      This role is visible on the board even if it does not currently pass the strongest fit filters.
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-3 lg:items-end">
                  <div className="w-full rounded-[24px] border border-white/10 bg-white/[0.03] px-4 py-4 text-sm text-slate lg:max-w-[240px]">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate">
                      {view === "trending" ? "Trending score" : "Freshness"}
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-ink">
                      {view === "trending" ? item.trendingScore.toFixed(0) : formatRelativeTime(item.job.createdAt)}
                    </p>
                    <p className="mt-3">
                      {item.trendingSignals.views72h} distinct views and {item.trendingSignals.applications72h} recent
                      applications in 72h.
                    </p>
                  </div>

                  <Link href={`/jobs/${item.job.id}`} className="w-full lg:max-w-[240px]">
                    <Button className="w-full justify-between gap-2">
                      View job <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button
                    type="button"
                    variant="secondary"
                    className="w-full justify-between gap-2 lg:max-w-[240px]"
                    onClick={async () => {
                      try {
                        if (item.isSaved) {
                          await provider.unsaveJob(item.job.id);
                          toast.success("Job removed from saved roles.");
                        } else {
                          await provider.saveJob(item.job.id);
                          toast.success("Job saved.");
                        }
                        await board.refresh();
                      } catch (error) {
                        toast.error(toDisplayError(error));
                      }
                    }}
                  >
                    {item.isSaved ? "Saved" : "Save job"} <Heart className={cn("h-4 w-4", item.isSaved ? "fill-current" : "")} />
                  </Button>
                  {item.applicationStatus === "pending" && item.applicationId ? (
                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full justify-center lg:max-w-[240px]"
                      onClick={async () => {
                        try {
                          await provider.withdrawApplication(item.applicationId!);
                          toast.success("Deployment request withdrawn.");
                          await board.refresh();
                        } catch (error) {
                          toast.error(toDisplayError(error));
                        }
                      }}
                    >
                      Withdraw request
                    </Button>
                  ) : null}
                </div>
              </Card>
            ))
          )}
        </div>
      </DashboardShell>
    </main>
  );
}
