import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, Building2, Star, Users } from "lucide-react";
import { PageContainer } from "@/components/layout/page-container";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Stars } from "@/components/ui/stars";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { LandingHighlights } from "@/types/domain";

export function LandingPage({ data }: { data: LandingHighlights }) {
  return (
    <main>
      <SiteHeader />
      <section className="bg-hero-grid pb-20 pt-14">
        <PageContainer>
          <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="max-w-3xl">
              <Badge variant="accent">Production-minded demo foundation</Badge>
              <h1 className="mt-6 font-display text-5xl font-semibold leading-tight text-ink md:text-7xl">
                Book event staff, track quality, and surface the people who keep delivering.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate">
                StaffBook Demo gives organisers a credible hiring workflow and gives staff a ranked,
                review-backed profile that improves with every successful shift.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link href="/auth/signup">
                  <Button className="gap-2">
                    Start as organiser <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/jobs">
                  <Button variant="secondary">Browse live jobs</Button>
                </Link>
              </div>
              <div className="mt-12 grid gap-4 sm:grid-cols-4">
                {[
                  { label: "Open roles", value: data.stats.activeJobs, icon: BriefcaseBusiness },
                  { label: "Organisers", value: data.stats.organisers, icon: Building2 },
                  { label: "Staff", value: data.stats.staff, icon: Users },
                  { label: "Placements", value: data.stats.placements, icon: Star }
                ].map((stat) => (
                  <Card key={stat.label} className="rounded-[24px] p-4">
                    <stat.icon className="h-5 w-5 text-accent" />
                    <p className="mt-4 font-display text-3xl font-semibold">{stat.value}</p>
                    <p className="text-sm text-slate">{stat.label}</p>
                  </Card>
                ))}
              </div>
            </div>
            <Card className="overflow-hidden bg-ink p-0 text-white">
              <div className="border-b border-white/10 p-6">
                <p className="text-sm uppercase tracking-[0.24em] text-white/60">What organisers see</p>
                <h2 className="mt-3 font-display text-3xl font-semibold">
                  One place for events, jobs, applicants, and ratings
                </h2>
              </div>
              <div className="space-y-4 p-6">
                {[
                  "Create event pipelines with required roles and shift detail",
                  "Accept or reject applicants without losing auditability",
                  "Rate completed staff and let weighted rankings do the credibility work"
                ].map((line) => (
                  <div key={line} className="rounded-3xl bg-white/5 p-4 text-sm text-white/80">
                    {line}
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </PageContainer>
      </section>

      <section className="py-18">
        <PageContainer className="grid gap-8 lg:grid-cols-2">
          <Card>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-accent">Top-rated staff</p>
            <div className="mt-6 space-y-4">
              {data.topStaff.map((staff) => (
                <div key={staff.staffId} className="flex items-center justify-between rounded-[24px] border border-slate-100 p-4">
                  <div className="flex items-center gap-4">
                    <Avatar name={staff.profile.fullName} />
                    <div>
                      <div className="flex items-center gap-3">
                        <p className="font-semibold text-ink">{staff.profile.fullName}</p>
                        {staff.topBadge ? <Badge variant="accent">{staff.topBadge}</Badge> : null}
                      </div>
                      <p className="text-sm text-slate">{staff.profile.skills.slice(0, 3).join(" • ")}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Stars value={staff.averageRating || 4.2} />
                    <p className="mt-1 text-xs text-slate">{staff.reviewCount} reviews</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-accent">Live jobs</p>
                <h2 className="mt-3 font-display text-3xl font-semibold text-ink">
                  Roles that are ready to fill
                </h2>
              </div>
              <Link href="/jobs" className="text-sm font-semibold text-accent">
                View all
              </Link>
            </div>
            <div className="mt-6 space-y-4">
              {data.featuredJobs.map((job) => (
                <Link href={`/jobs/${job.id}`} key={job.id}>
                  <div className="rounded-[24px] border border-slate-100 p-4 transition hover:border-accent/30 hover:bg-slate-50">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold text-ink">{job.title}</p>
                        <p className="mt-1 text-sm text-slate">
                          {job.event.title} • {job.event.location}
                        </p>
                      </div>
                      <Badge variant="neutral">{job.roleType}</Badge>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate">
                      <span>{formatDate(job.event.eventDate)}</span>
                      <span>{formatCurrency(job.payRate)}/hr</span>
                      <span>{job.positionsNeeded} positions</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </Card>
        </PageContainer>
      </section>

      <SiteFooter />
    </main>
  );
}
