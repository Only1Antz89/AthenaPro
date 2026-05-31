import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageContainer } from "@/components/layout/page-container";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { Button } from "@/components/ui/button";
import { BRAND, ENTITY_LABELS, PUBLIC_COPY } from "@/lib/brand";
import { HOME_METRICS, SERVICE_PILLARS } from "@/lib/site-content";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { LandingHighlights } from "@/types/domain";

const HOME_IMAGES = {
  hero:
    "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1600&q=80",
  support:
    "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1400&q=80",
  detail:
    "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1400&q=80"
} as const;

export function LandingPage({ data }: { data: LandingHighlights }) {
  return (
    <main className="overflow-x-hidden">
      <SiteHeader />

      <section className="theme-dark relative isolate min-h-[calc(100svh-80px)] overflow-hidden bg-hero-grid">
        <div className="absolute inset-0">
          <img
            src={HOME_IMAGES.hero}
            alt="Athena Pro team coordinating live event operations."
            className="h-full w-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(13,15,17,0.96)_0%,rgba(13,15,17,0.78)_44%,rgba(13,15,17,0.45)_100%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_18%,rgba(112,128,144,0.26),transparent_0_24%),linear-gradient(180deg,rgba(17,18,19,0.28),rgba(17,18,19,0.88))]" />
        </div>

        <PageContainer className="relative z-10 flex min-h-[calc(100svh-72px)] flex-col justify-between py-8 sm:min-h-[calc(100svh-80px)] sm:py-10 md:py-14">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,0.88fr)_minmax(320px,0.72fr)] lg:items-end">
            <div className="max-w-4xl animate-fade-up">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate">
                {PUBLIC_COPY.heroEyebrow}
              </p>
              <p className="mt-6 font-display text-4xl font-semibold tracking-[0.18em] text-mist sm:mt-8 sm:text-5xl md:text-7xl">
                {BRAND.name}
              </p>
              <h1 className="text-balance mt-5 max-w-3xl font-display text-4xl font-semibold leading-[0.94] tracking-[-0.08em] text-ink sm:text-5xl md:text-7xl">
                Calm command for live event systems and field execution.
              </h1>
              <p className="mt-5 max-w-xl text-sm leading-7 text-slate sm:text-base sm:leading-8 md:text-lg">
                {PUBLIC_COPY.heroSubheadline}
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:mt-9 sm:flex-row sm:flex-wrap sm:gap-4">
                <Link href="/contact">
                  <Button className="w-full gap-2 sm:w-auto">
                    {PUBLIC_COPY.heroPrimaryCta} <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/auth/login">
                  <Button variant="secondary" className="w-full sm:w-auto">
                    {PUBLIC_COPY.heroSecondaryCta}
                  </Button>
                </Link>
              </div>
            </div>

            <div className="scroll-reveal-scale grid gap-4 lg:justify-items-end">
              <div className="relative h-[300px] w-full overflow-hidden rounded-[30px] border border-line/60 bg-black/30 shadow-float sm:h-[360px] sm:rounded-[36px] lg:h-[420px] lg:max-w-[470px]">
                <img
                  src={HOME_IMAGES.support}
                  alt="Black event operations professionals in discussion."
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(17,18,19,0.04),rgba(17,18,19,0.72))]" />
                <div className="absolute inset-x-0 bottom-0 p-6">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-mist">
                    Operating tempo
                  </p>
                  <p className="mt-3 max-w-xs font-display text-3xl font-semibold tracking-[-0.05em] text-ink">
                    Decisions stay elegant even when ingress does not.
                  </p>
                </div>
              </div>
              <div className="flex w-full max-w-[470px] justify-start lg:justify-end">
                <div className="scroll-reveal-right max-w-[320px] border-t border-line/60 pt-4 text-sm leading-7 text-slate">
                  Athena Pro aligns gate logic, supervisor judgement, and commercial visibility in one quiet
                  operating layer.
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 grid gap-5 border-t border-line/60 pt-7 sm:mt-14 sm:grid-cols-2 lg:grid-cols-4">
            {HOME_METRICS.map((metric, index) => (
              <div
                key={metric.label}
                className="scroll-reveal section-frame pl-5"
                style={{ animationDelay: `${index * 80}ms` }}
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate">{metric.label}</p>
                <p className="mt-4 font-display text-4xl font-semibold tracking-[-0.05em] text-ink">
                  {metric.value}
                </p>
                <p className="mt-2 max-w-[18rem] text-sm leading-6 text-slate">{metric.detail}</p>
              </div>
            ))}
          </div>
        </PageContainer>
      </section>

      <section className="py-20 md:py-28">
        <PageContainer className="grid gap-8 lg:grid-cols-[minmax(0,0.7fr)_minmax(0,1fr)] lg:items-start lg:gap-10">
          <div className="scroll-reveal section-frame pl-4 sm:pl-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate">Core message</p>
            <h2 className="text-balance mt-4 max-w-xl font-display text-3xl font-semibold tracking-[-0.06em] text-ink sm:text-4xl md:text-5xl">
              Minimal interface. Full operational picture.
            </h2>
          </div>
          <div className="grid gap-8">
            <p className="scroll-reveal-right max-w-3xl text-base leading-8 text-slate sm:text-lg sm:leading-9">
              Athena Pro is built for organisers who want fewer handoffs, clearer signals, and a steadier event
              floor. We keep the visual language restrained because the operating reality is already complex
              enough.
            </p>
            <div className="scroll-reveal-scale relative overflow-hidden rounded-[36px] border border-line/60">
              <img
                src={HOME_IMAGES.detail}
                alt="Black professionals reviewing event delivery plans."
                className="h-[280px] w-full object-cover sm:h-[360px] md:h-[420px]"
              />
              <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(17,18,19,0.15),rgba(17,18,19,0.75))]" />
              <div className="absolute bottom-0 right-0 max-w-md p-6 md:p-8">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-mist">Delivery frame</p>
                <p className="mt-3 text-base leading-7 text-ink">
                  Track jobs, teams, and company context without adding noise.
                </p>
              </div>
            </div>
          </div>
        </PageContainer>
      </section>

      <section className="pb-20 md:pb-28">
        <PageContainer className="grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.72fr)] lg:gap-10">
          <div className="grid gap-10">
            {SERVICE_PILLARS.map((pillar, index) => (
              <div
                key={pillar.key}
                className="scroll-reveal border-t border-line/60 pt-7 first:border-t-0 first:pt-0"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <h3 className="font-display text-3xl font-semibold tracking-[-0.05em] text-ink md:text-4xl">
                    {pillar.title}
                  </h3>
                  <span className="text-xs uppercase tracking-[0.18em] text-slate">{pillar.ratio}</span>
                </div>
                <p className="mt-4 max-w-2xl text-base leading-8 text-slate">{pillar.summary}</p>
              </div>
            ))}
          </div>

          <div className="scroll-reveal-scale space-y-6">
            <div className="panel-shell rounded-[32px] p-7">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate">Selected talent</p>
              <div className="mt-6 space-y-5">
                {data.topStaff.slice(0, 3).map((staff) => (
                  <div key={staff.staffId} className="border-t border-line/60 pt-5 first:border-t-0 first:pt-0">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold text-ink">{staff.profile.fullName}</p>
                      <span className="text-xs uppercase tracking-[0.16em] text-slate">
                        {staff.averageRating.toFixed(1)}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate">
                      {staff.profile.skills.slice(0, 3).join(" • ")}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="panel-shell rounded-[32px] p-7">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate">
                {ENTITY_LABELS.liveJobs}
              </p>
              <div className="mt-6 space-y-4">
                {data.featuredJobs.slice(0, 3).map((job) => (
                  <Link href={`/jobs/${job.id}`} key={job.id} className="block border-t border-line/60 pt-4 first:border-t-0 first:pt-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold text-ink">{job.title}</p>
                        <p className="mt-1 text-sm leading-6 text-slate">
                          {job.event.location} • {formatDate(job.event.eventDate)}
                        </p>
                      </div>
                      <span className="text-sm text-slate">{formatCurrency(job.payRate)}/hr</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </PageContainer>
      </section>

      <section className="pb-20 md:pb-24">
        <PageContainer>
          <div className="theme-dark scroll-reveal-scale rounded-[40px] border border-line/60 bg-[linear-gradient(135deg,rgba(24,27,31,0.86),rgba(32,37,43,0.9))] p-8 md:p-12">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate">Final CTA</p>
            <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
              <div>
                <h2 className="text-balance max-w-3xl font-display text-3xl font-semibold tracking-[-0.06em] text-ink sm:text-4xl md:text-5xl">
                  Stylish operations are usually the ones nobody notices.
                </h2>
                <p className="mt-4 max-w-2xl text-base leading-8 text-slate">
                  Athena Pro keeps the front-of-house experience measured, informed, and commercially aware from
                  first scan to final report.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link href="/contact">
                  <Button className="w-full sm:w-auto">Contact Athena Pro</Button>
                </Link>
                <Link href="/about">
                  <Button variant="secondary" className="w-full sm:w-auto">
                    About the model
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </PageContainer>
      </section>

      <SiteFooter />
    </main>
  );
}
