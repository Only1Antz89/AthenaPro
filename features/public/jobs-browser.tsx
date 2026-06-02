"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Bell, Heart, Search, SlidersHorizontal, X } from "lucide-react";
import { toast } from "sonner";
import { PageContainer } from "@/components/layout/page-container";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useQueryState } from "@/features/app/use-query-state";
import { useStaffBook } from "@/features/app/use-staffbook";
import { MobileSocialJobFeed } from "@/features/staff/mobile-social-job-feed";
import { ENTITY_LABELS } from "@/lib/brand";
import { filterJobs } from "@/lib/domain/jobs-board";
import { toDisplayError } from "@/lib/errors";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import type { BrowseJobsFilters, EnrichedJob, StaffJobsBoardData } from "@/types/domain";

const SORT_OPTIONS: { value: NonNullable<BrowseJobsFilters["sort"]>; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "soonest", label: "Soonest" },
  { value: "pay", label: "Highest pay" },
  { value: "match", label: "Best match" },
  { value: "trending", label: "Trending" }
];

function sortPublicJobs(
  jobs: EnrichedJob[],
  sort: NonNullable<BrowseJobsFilters["sort"]>,
  boardByJobId: Map<string, StaffJobsBoardData["items"][number]>
) {
  return [...jobs].sort((left, right) => {
    if (sort === "soonest") {
      return new Date(left.shiftStart).getTime() - new Date(right.shiftStart).getTime();
    }

    if (sort === "pay") {
      return right.payRate - left.payRate;
    }

    if (sort === "match") {
      return (boardByJobId.get(right.id)?.matchScore ?? 0) - (boardByJobId.get(left.id)?.matchScore ?? 0);
    }

    if (sort === "trending") {
      return (boardByJobId.get(right.id)?.trendingScore ?? 0) - (boardByJobId.get(left.id)?.trendingScore ?? 0);
    }

    return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
  });
}

export function JobsBrowser({ initialJobs }: { initialJobs: EnrichedJob[] }) {
  const { provider, session } = useStaffBook();
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [roleTypes, setRoleTypes] = useState<string[]>([]);
  const [minimumPay, setMinimumPay] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sort, setSort] = useState<NonNullable<BrowseJobsFilters["sort"]>>("newest");
  const [savedOnly, setSavedOnly] = useState(false);
  const board = useQueryState<StaffJobsBoardData | null>(
    () => (session?.role === "staff" ? provider.getStaffJobsBoard() : Promise.resolve(null)),
    [provider, session?.role, session?.userId]
  );

  const roleOptions = useMemo(
    () => [...new Set(initialJobs.map((job) => job.roleType))].sort((left, right) => left.localeCompare(right)),
    [initialJobs]
  );
  const boardByJobId = useMemo(
    () => new Map((board.data?.items ?? []).map((item) => [item.job.id, item] as const)),
    [board.data?.items]
  );

  const jobs = useMemo(
    () => {
      const filtered = filterJobs(initialJobs, {
        query,
        location,
        roleTypes,
        minimumPay: minimumPay ? Number(minimumPay) : undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined
      }).filter((job) => !savedOnly || boardByJobId.get(job.id)?.isSaved);

      return sortPublicJobs(filtered, sort, boardByJobId);
    },
    [boardByJobId, dateFrom, dateTo, initialJobs, location, minimumPay, query, roleTypes, savedOnly, sort]
  );
  const isStaff = session?.role === "staff";
  const hasActiveFilters = Boolean(
    query || location || roleTypes.length || minimumPay || dateFrom || dateTo || savedOnly || sort !== "newest"
  );
  const resetFilters = () => {
    setQuery("");
    setLocation("");
    setRoleTypes([]);
    setMinimumPay("");
    setDateFrom("");
    setDateTo("");
    setSavedOnly(false);
    setSort("newest");
  };
  const mobileFeedItems = useMemo(() => {
    const visibleJobIds = new Set(jobs.map((job) => job.id));
    return (board.data?.items ?? []).filter((item) => visibleJobIds.has(item.job.id));
  }, [board.data?.items, jobs]);

  return (
    <main className="theme-dark min-h-screen bg-black">
      <SiteHeader />
      <section className="py-10 sm:py-12 md:py-16">
        <PageContainer>
          <div className={cn("section-frame max-w-3xl pl-4 sm:pl-6", isStaff && board.data ? "hidden md:block" : "")}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-lime-300">
              {ENTITY_LABELS.liveJobs}
            </p>
            <h1 className="text-balance mt-4 font-display text-4xl font-semibold tracking-[-0.05em] text-ink sm:text-5xl">
              Find roles that fit your energy.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate sm:text-lg sm:leading-8">
              Browse paid live-event roles by location, discipline, and rate.
            </p>
          </div>

          {isStaff && board.data ? (
            <div className="mt-8">
              <MobileSocialJobFeed board={board.data} items={mobileFeedItems} onRefresh={board.refresh} />
            </div>
          ) : null}

          <Card className={cn("mt-7 rounded-[20px] border-white/10 bg-white/[0.04] p-4 md:hidden", isStaff && board.data ? "hidden" : "")}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-lime-300">Search roles</p>
                <p className="mt-1 text-sm text-white/64">{jobs.length} roles showing</p>
              </div>
              <SlidersHorizontal className="h-5 w-5 text-white/64" />
            </div>
            <div className="mt-4 grid grid-cols-1 gap-3">
              <Field label="Search">
                <div className="relative w-full min-w-0 max-w-full">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate" />
                  <Input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Role, venue, company"
                    className="pl-10"
                  />
                </div>
              </Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Location">
                  <Input value={location} onChange={(event) => setLocation(event.target.value)} placeholder="London" />
                </Field>
                <Field label="Sort">
                  <Select value={sort} onChange={(event) => setSort(event.target.value as typeof sort)}>
                    {SORT_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Date from">
                  <Input value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} type="date" />
                </Field>
                <Field label="Min rate">
                  <Input value={minimumPay} onChange={(event) => setMinimumPay(event.target.value)} type="number" min={0} placeholder="15" />
                </Field>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate">Disciplines</p>
                <div className="-mx-1 mt-3 flex gap-2 overflow-x-auto px-1 pb-1">
                  {roleOptions.map((role) => {
                    const selected = roleTypes.includes(role);

                    return (
                      <button
                        key={role}
                        type="button"
                        onClick={() =>
                          setRoleTypes((current) =>
                            current.includes(role) ? current.filter((item) => item !== role) : [...current, role]
                          )
                        }
                        className={cn(
                          "min-h-11 shrink-0 rounded-full border px-4 text-sm transition",
                          selected
                            ? "border-lime-300 bg-lime-300 text-black"
                            : "border-white/10 bg-white/[0.03] text-white/72"
                        )}
                      >
                        {role}
                      </button>
                    );
                  })}
                </div>
              </div>
              {hasActiveFilters ? (
                <Button type="button" variant="secondary" className="min-h-12 w-full gap-2 border-white/10 bg-white/[0.03] text-white" onClick={resetFilters}>
                  <X className="h-4 w-4" />
                  Reset filters
                </Button>
              ) : null}
            </div>
          </Card>

          <Card className="mt-10 hidden md:block">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Field label="Search">
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Ingress, scanner support, supervisor"
                />
              </Field>
              <Field label="Location">
                <Input value={location} onChange={(event) => setLocation(event.target.value)} placeholder="London, Manchester" />
              </Field>
              <Field label="Date from">
                <Input value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} type="date" />
              </Field>
              <Field label="Date to">
                <Input value={dateTo} onChange={(event) => setDateTo(event.target.value)} type="date" />
              </Field>
              <Field label="Minimum rate">
                <Input value={minimumPay} onChange={(event) => setMinimumPay(event.target.value)} type="number" min={0} placeholder="15" />
              </Field>
              <Field label="Sort">
                <Select value={sort} onChange={(event) => setSort(event.target.value as typeof sort)}>
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <div className="sm:col-span-2 lg:col-span-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate">Disciplines</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {roleOptions.map((role) => {
                    const selected = roleTypes.includes(role);

                    return (
                      <button
                        key={role}
                        type="button"
                        onClick={() =>
                          setRoleTypes((current) =>
                            current.includes(role) ? current.filter((item) => item !== role) : [...current, role]
                          )
                        }
                        className={cn(
                          "rounded-full border px-3 py-2 text-sm transition",
                          selected
                            ? "border-mist bg-mist text-canvas"
                            : "border-line/70 text-slate hover:border-mist/60 hover:text-ink"
                        )}
                      >
                        {role}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => setSavedOnly((current) => !current)}
                    disabled={!isStaff}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm transition disabled:cursor-not-allowed disabled:opacity-50",
                      savedOnly
                        ? "border-mist bg-mist text-canvas"
                        : "border-line/70 text-slate hover:border-mist/60 hover:text-ink"
                    )}
                  >
                    <Heart className="h-4 w-4" />
                    Saved only
                  </button>
                </div>
              </div>
            </div>
          </Card>

          <div className={cn("mt-8 grid gap-4", isStaff && board.data ? "hidden md:grid" : "")}>
            {jobs.length === 0 ? (
              <Card>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-ink">No jobs match these filters</h2>
                    <p className="mt-2 text-sm text-slate">
                      Clear a discipline, widen the date range, or lower the minimum rate to see more roles.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={resetFilters}
                  >
                    Reset filters
                  </Button>
                </div>
              </Card>
            ) : (
              jobs.map((job) => {
                const boardItem = boardByJobId.get(job.id);

                return (
                  <Card key={job.id} className="grid gap-5 rounded-[22px] border-white/10 bg-white/[0.04] p-5 lg:grid-cols-[1fr_auto] lg:items-center lg:rounded-[28px]">
                    <div>
                      <div className="mb-4 grid grid-cols-3 gap-2 rounded-[16px] border border-white/10 bg-black/20 p-3 text-sm text-white/72 md:hidden">
                        <span>{formatCurrency(job.payRate)}/hr</span>
                        <span>{formatDate(job.event.eventDate)}</span>
                        <span>{job.event.location}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                        <h2 className="w-full text-xl font-semibold text-ink sm:w-auto sm:text-2xl">{job.title}</h2>
                        <Badge variant="accent">{job.roleType}</Badge>
                        <Badge variant="neutral">{job.event.location}</Badge>
                        {boardItem?.applicationStatus ? <Badge variant="warning">{boardItem.applicationStatus}</Badge> : null}
                        {boardItem?.isSaved ? <Badge variant="neutral">Saved</Badge> : null}
                      </div>
                      <p className="mt-3 text-sm leading-6 text-slate sm:text-base">{job.description}</p>
                      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate">
                        <span>{job.organization.name}</span>
                        <span>{job.event.title}</span>
                        <span>{formatDate(job.event.eventDate)}</span>
                        <span>{formatCurrency(job.payRate)}/hr</span>
                        <span>{job.positionsNeeded} positions</span>
                        {boardItem ? <span>{boardItem.matchScore.toFixed(0)} match</span> : null}
                      </div>
                    </div>
                    <div className="flex flex-col items-stretch gap-3 lg:items-end">
                      <p className="text-sm text-slate">{job.applicationCount} applications</p>
                      {isStaff ? (
                        <Button
                          type="button"
                          variant="secondary"
                          className="min-h-12 w-full gap-2 lg:w-auto"
                          onClick={async () => {
                            try {
                              if (boardItem?.isSaved) {
                                await provider.unsaveJob(job.id);
                                toast.success("Job removed from saved roles.");
                              } else {
                                await provider.saveJob(job.id);
                                toast.success("Job saved.");
                              }
                              await board.refresh();
                            } catch (error) {
                              toast.error(toDisplayError(error));
                            }
                          }}
                        >
                          <Heart className="h-4 w-4" />
                          {boardItem?.isSaved ? "Saved" : "Save"}
                        </Button>
                      ) : null}
                      <Link href={`/jobs/${job.id}`}>
                        <Button className="min-h-12 w-full gap-2 lg:w-auto">
                          <Bell className="h-4 w-4" />
                          View job
                        </Button>
                      </Link>
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        </PageContainer>
      </section>
      <SiteFooter />
    </main>
  );
}
