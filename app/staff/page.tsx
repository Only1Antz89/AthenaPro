import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Bell,
  BriefcaseBusiness,
  CalendarDays,
  Heart,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Star,
  Wallet,
  Zap
} from "lucide-react";
import { PageContainer } from "@/components/layout/page-container";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "How It Works",
  description:
    "How Athena Pro field-team members find roles, apply, track jobs, build ratings, message companies, and estimate earnings."
};

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1800&q=85";
const CROWD_IMAGE =
  "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=1800&q=85";
const FIELD_IMAGE =
  "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=1600&q=85";

const journeySteps = [
  {
    title: "Build your field-team profile",
    body: "Add your roles, location, languages, availability, driving status, and the event skills companies need to book quickly.",
    icon: ShieldCheck
  },
  {
    title: "Discover roles in the feed",
    body: "Browse live work like a social feed, follow companies, save roles, like posts, and skip what does not fit.",
    icon: Sparkles
  },
  {
    title: "Apply for the role",
    body: "Send a focused application, track pending, accepted, rejected, and withdrawn statuses from your profile hub.",
    icon: BriefcaseBusiness
  },
  {
    title: "Stay ready for event day",
    body: "Use messages, notifications, and pre-event updates to keep call times, briefing notes, and location details close.",
    icon: Bell
  },
  {
    title: "Grow your reputation",
    body: "Ratings, reviews, completed jobs, estimated earnings, and payment readiness stay visible after every shift.",
    icon: Star
  }
];

const hubItems = [
  { label: "Applications", copy: "Pending, confirmed, rejected, and withdrawn jobs.", icon: BriefcaseBusiness },
  { label: "Saved and liked", copy: "Roles you saved, loved, or want to recover.", icon: Heart },
  { label: "Ratings", copy: "Overall score, review count, category bars, and feedback.", icon: Star },
  { label: "Earnings", copy: "Estimated pay from accepted and completed shifts.", icon: Wallet },
  { label: "Availability", copy: "Weekly schedule, summary, and flexible working windows.", icon: CalendarDays },
  { label: "Messages", copy: "Company DMs and event communications in one place.", icon: MessageCircle }
];

const storyCompanies = ["NF", "SE", "LD", "PC", "AP"];

export default function StaffPage() {
  return (
    <main className="theme-dark min-h-screen overflow-x-hidden bg-black">
      <SiteHeader />

      <section className="relative isolate overflow-hidden border-b border-white/10">
        <div className="absolute inset-0">
          <Image src={HERO_IMAGE} alt="Festival crowd under neon stage lights." fill priority sizes="100vw" className="object-cover opacity-40" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.94),rgba(5,8,10,0.78),rgba(0,0,0,0.95))]" />
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black to-transparent" />
        </div>

        <PageContainer className="relative z-10 grid gap-10 py-14 md:py-20 lg:grid-cols-[minmax(0,0.94fr)_minmax(360px,0.76fr)] lg:items-center">
          <div className="min-w-0 max-w-3xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-lime-300">Live roles. Real events. Your profile hub.</p>
            <h1 className="mt-5 text-balance font-display text-5xl font-semibold tracking-[-0.07em] text-white sm:text-6xl md:text-7xl">
              How Athena Pro works for field team.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-white/72 sm:text-lg">
              Discover event roles in a social feed, apply in seconds, track every application, and keep ratings,
              earnings estimates, availability, messages, payments, and security inside your profile button.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link href="/auth/login" className="block w-full sm:w-auto">
                <Button variant="accent" className="w-full gap-2 bg-lime-300 px-6 py-3.5 text-black hover:bg-lime-200 sm:w-auto">
                  Platform access <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/jobs" className="block w-full sm:w-auto">
                <Button variant="secondary" className="w-full border-white/15 bg-white/5 px-6 py-3.5 text-white hover:bg-white/10 sm:w-auto">
                  Find roles
                </Button>
              </Link>
            </div>
          </div>

          <div className="min-w-0 rounded-[32px] border border-white/10 bg-black/70 p-4 shadow-[0_30px_90px_rgba(0,0,0,0.55)] backdrop-blur-xl sm:p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-lime-300">Today in your feed</p>
                <p className="mt-1 text-2xl font-semibold text-white">Crowd Control Lead</p>
              </div>
              <span className="rounded-full border border-lime-300 px-3 py-1 text-sm font-semibold text-lime-300">Live</span>
            </div>

            <div className="mt-5 flex gap-3 overflow-hidden">
              {storyCompanies.map((company) => (
                <div key={company} className="shrink-0 text-center">
                  <div className="grid h-16 w-16 place-items-center rounded-full bg-[conic-gradient(from_120deg,#bef264,#ffffff,#7aa33a,#bef264)] p-[3px]">
                    <span className="grid h-full w-full place-items-center rounded-full bg-black text-lg font-bold text-lime-300">{company}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="relative mt-5 overflow-hidden rounded-[26px] border border-white/10">
              <Image src={CROWD_IMAGE} alt="Open air festival stage packed with a crowd." width={760} height={520} className="h-[360px] w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/18 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <p className="text-sm font-semibold text-lime-300">Neon Fields</p>
                <h2 className="mt-1 text-4xl font-semibold tracking-[-0.05em] text-white">Apply for role</h2>
                <div className="mt-4 grid grid-cols-3 gap-2 text-xs text-white/78">
                  <span className="rounded-2xl border border-white/10 bg-black/45 px-3 py-2">London</span>
                  <span className="rounded-2xl border border-white/10 bg-black/45 px-3 py-2">16:00-02:00</span>
                  <span className="rounded-2xl border border-white/10 bg-black/45 px-3 py-2">GBP 16.50/hr</span>
                </div>
              </div>
            </div>

            <div className="mt-5 flex items-end justify-between gap-4 text-sm">
              <div className="text-white/55">
                <Zap className="mb-1 h-5 w-5" />
                Swipe left to pass
              </div>
              <div className="text-center text-lime-300">
                <Heart className="mx-auto mb-1 h-8 w-8" />
                Double tap to like
              </div>
              <div className="text-right text-lime-300">
                <ArrowRight className="mb-1 ml-auto h-5 w-5" />
                Swipe right to save
              </div>
            </div>
          </div>
        </PageContainer>
      </section>

      <section className="py-16 md:py-24">
        <PageContainer>
          <div className="grid gap-8 lg:grid-cols-[minmax(260px,0.42fr)_1fr]">
            <div className="lg:sticky lg:top-28 lg:h-fit">
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-lime-300">The route</p>
              <h2 className="mt-4 max-w-md text-balance font-display text-4xl font-semibold tracking-[-0.06em] text-white md:text-5xl">
                From sign up to paid event work.
              </h2>
              <p className="mt-4 max-w-md text-base leading-8 text-white/65">
                The platform keeps discovery fast, but the profile hub keeps the serious operational tools close.
              </p>
            </div>

            <div className="grid gap-4">
              {journeySteps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <article key={step.title} className="grid gap-5 rounded-[28px] border border-white/10 bg-white/[0.04] p-5 sm:grid-cols-[auto_1fr] sm:p-6">
                    <div className="flex items-center gap-4 sm:block">
                      <span className="grid h-14 w-14 place-items-center rounded-2xl border border-lime-300/40 bg-lime-300/10 text-lime-300">
                        <Icon className="h-6 w-6" />
                      </span>
                      <span className="text-sm font-bold uppercase tracking-[0.18em] text-white/40">0{index + 1}</span>
                    </div>
                    <div>
                      <h3 className="text-2xl font-semibold tracking-[-0.04em] text-white">{step.title}</h3>
                      <p className="mt-3 max-w-3xl text-sm leading-7 text-white/65 sm:text-base">{step.body}</p>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </PageContainer>
      </section>

      <section className="border-y border-white/10 bg-white/[0.03] py-16 md:py-24">
        <PageContainer className="grid gap-10 lg:grid-cols-[minmax(0,0.84fr)_minmax(320px,0.72fr)] lg:items-center">
          <div className="relative min-h-[420px] overflow-hidden rounded-[34px] border border-white/10">
            <Image src={FIELD_IMAGE} alt="Festival stage lights and event crowd." fill sizes="(min-width: 1024px) 52vw, 100vw" className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-lime-300">Company stories</p>
              <h2 className="mt-3 max-w-lg text-4xl font-semibold tracking-[-0.06em] text-white md:text-5xl">
                Follow companies and see their next roles first.
              </h2>
            </div>
          </div>

          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-lime-300">Profile button</p>
            <h2 className="mt-4 text-balance font-display text-4xl font-semibold tracking-[-0.06em] text-white md:text-5xl">
              Nothing from the old dashboard gets left behind.
            </h2>
            <p className="mt-4 text-base leading-8 text-white/65">
              Jobs feel mobile-first on the surface. Your profile hub keeps the deeper account, tracking, and
              reputation tools organised into smart menus.
            </p>
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              {hubItems.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="rounded-[24px] border border-white/10 bg-black/42 p-4">
                    <Icon className="h-5 w-5 text-lime-300" />
                    <h3 className="mt-3 font-semibold text-white">{item.label}</h3>
                    <p className="mt-2 text-sm leading-6 text-white/58">{item.copy}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </PageContainer>
      </section>

      <section className="py-16 md:py-24">
        <PageContainer>
          <div className="rounded-[34px] border border-lime-300/25 bg-[linear-gradient(135deg,rgba(190,242,100,0.16),rgba(190,242,100,0.06),rgba(255,255,255,0.03))] p-6 sm:p-8 md:p-10">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-lime-300">Ready when you are</p>
                <h2 className="mt-4 max-w-3xl text-balance font-display text-4xl font-semibold tracking-[-0.06em] text-white md:text-5xl">
                  Open Platform Access, choose Field Team, and create the profile that unlocks event roles.
                </h2>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link href="/auth/login" className="block w-full sm:w-auto">
                  <Button variant="accent" className="w-full gap-2 bg-lime-300 px-6 py-3.5 text-black hover:bg-lime-200 sm:w-auto">
                    Platform access <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/services" className="block w-full sm:w-auto">
                  <Button variant="secondary" className="w-full border-white/15 bg-black/35 px-6 py-3.5 text-white hover:bg-black/50 sm:w-auto">
                    For companies
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
