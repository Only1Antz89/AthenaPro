"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  ArrowRight,
  Bell,
  BriefcaseBusiness,
  Building2,
  Heart,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Star,
  UsersRound
} from "lucide-react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/layout/site-header";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PasswordField } from "@/components/ui/password-field";
import { useStaffBook } from "@/features/app/use-staffbook";
import { BRAND } from "@/lib/brand";
import { toDisplayError } from "@/lib/errors";
import { formatCurrency, formatDate } from "@/lib/utils";
import { loginSchema } from "@/lib/validation/schemas";
import type { EnrichedJob } from "@/types/domain";

type AccessMode = "field-team" | "company";

type JobBoardPreviewItem = {
  id: string;
  title: string;
  location: string;
  rate: string;
  detail: string;
  tag: "Latest" | "Popular";
  href: string;
};

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1800&q=85";
const SUPPORT_IMAGE =
  "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1100&q=85";
const DETAIL_IMAGE =
  "https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=1100&q=85";

const JOB_BOARD_PREVIEW_ITEMS: JobBoardPreviewItem[] = [
  {
    id: "fallback-gate-scanner",
    title: "Gate scanner support",
    location: "London",
    rate: "GBP 18/hr",
    detail: "Open now",
    tag: "Latest",
    href: "/jobs"
  },
  {
    id: "fallback-crowd-flow",
    title: "Crowd flow steward",
    location: "Manchester",
    rate: "GBP 17/hr",
    detail: "High interest",
    tag: "Popular",
    href: "/jobs"
  },
  {
    id: "fallback-supervisor",
    title: "Event supervisor",
    location: "Birmingham",
    rate: "GBP 24/hr",
    detail: "Open now",
    tag: "Latest",
    href: "/jobs"
  }
];

const ACCESS_OPTIONS = {
  "field-team": {
    label: "Field Team",
    eyebrow: "Work events",
    headline: "Sign in to track roles, ratings, earnings, messages, and availability.",
    signupHref: "/auth/signup?type=field-team",
    signupLabel: "Create field-team account",
    icon: UsersRound
  },
  company: {
    label: "Company",
    eyebrow: "Hire teams",
    headline: "Sign in to post jobs, manage applicants, message staff, and track event delivery.",
    signupHref: "/auth/signup?type=company",
    signupLabel: "Create company account",
    icon: Building2
  }
} as const;

function buildJobBoardPreviewItems(jobs: EnrichedJob[]): JobBoardPreviewItem[] {
  const latest = [...jobs].sort(
    (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
  );
  const popular = [...jobs].sort((left, right) => {
    if (right.applicationCount !== left.applicationCount) {
      return right.applicationCount - left.applicationCount;
    }

    return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
  });

  const mixed = [
    ...latest.slice(0, 2).map((job) => ({ job, tag: "Latest" as const })),
    ...popular.slice(0, 2).map((job) => ({ job, tag: "Popular" as const }))
  ];

  const uniqueItems = new Map<string, JobBoardPreviewItem>();

  for (const item of mixed) {
    if (uniqueItems.has(item.job.id)) {
      continue;
    }

    uniqueItems.set(item.job.id, {
      id: item.job.id,
      title: item.job.title,
      location: item.job.event.location,
      rate: `${formatCurrency(item.job.payRate)}/hr`,
      detail: formatDate(item.job.event.eventDate),
      tag: item.tag,
      href: `/jobs/${item.job.id}`
    });
  }

  return Array.from(uniqueItems.values()).slice(0, 3);
}

export function LoginForm({ redirectTo }: { redirectTo?: string }) {
  const router = useRouter();
  const { provider, refreshSession } = useStaffBook();
  const [accessMode, setAccessMode] = useState<AccessMode>("field-team");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [previewJobs, setPreviewJobs] = useState<JobBoardPreviewItem[]>([...JOB_BOARD_PREVIEW_ITEMS]);
  const activeAccess = useMemo(() => ACCESS_OPTIONS[accessMode], [accessMode]);
  const ActiveIcon = activeAccess.icon;

  useEffect(() => {
    let cancelled = false;

    async function loadPreviewJobs() {
      try {
        const response = await fetch("/api/jobs", { cache: "no-store" });

        if (!response.ok) {
          return;
        }

        const jobs = (await response.json()) as EnrichedJob[];
        const items = buildJobBoardPreviewItems(jobs);

        if (!cancelled && items.length > 0) {
          setPreviewJobs(items);
        }
      } catch {
        // Keep static previews available when the public jobs API is unavailable.
      }
    }

    void loadPreviewJobs();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setSubmitting(true);
      const payload = loginSchema.parse({ email, password });
      const session = await provider.signIn(payload);
      await refreshSession();

      const adminResponse = await fetch("/api/admin/session", {
        method: "GET",
        credentials: "include",
        cache: "no-store"
      });

      if (redirectTo?.startsWith("/admin")) {
        if (adminResponse.ok) {
          toast.success("Admin access granted.");
          router.push(redirectTo);
          return;
        }

        toast.error("This account is signed in, but it is not provisioned for admin access.");
        router.push(session.role === "organiser" ? "/dashboard/organiser" : "/dashboard/staff");
        return;
      }

      toast.success("Access granted.");

      if (adminResponse.ok) {
        router.push("/admin");
        return;
      }

      router.push(session.role === "organiser" ? "/dashboard/organiser" : "/dashboard/staff");
    } catch (error) {
      toast.error(toDisplayError(error));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="theme-dark min-h-screen overflow-x-hidden bg-black">
      <SiteHeader />

      <section className="relative isolate min-h-[calc(100svh-72px)] overflow-hidden border-b border-white/10">
        <div className="absolute inset-0">
          <img src={HERO_IMAGE} alt="Festival crowd under neon lights." className="h-full w-full object-cover opacity-42" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.95),rgba(5,8,10,0.82)_48%,rgba(0,0,0,0.96))]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(217,255,47,0.18),transparent_0_26%),radial-gradient(circle_at_82%_18%,rgba(255,91,127,0.18),transparent_0_24%),radial-gradient(circle_at_70%_84%,rgba(37,244,238,0.13),transparent_0_28%)]" />
        </div>

        <div className="relative z-10 mx-auto grid min-h-[calc(100svh-72px)] max-w-[1500px] gap-8 px-4 py-8 sm:px-6 sm:py-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(420px,0.82fr)] lg:items-stretch lg:px-8">
          <div className="grid overflow-hidden rounded-[34px] border border-white/10 bg-black/52 shadow-[0_28px_100px_rgba(0,0,0,0.5)] backdrop-blur-xl lg:grid-rows-[1fr_auto]">
            <div className="relative min-h-[420px] p-6 sm:p-8 lg:min-h-0">
              <div className="absolute inset-0">
                <img src={SUPPORT_IMAGE} alt="Festival crowd and event lights." className="h-full w-full object-cover opacity-78" />
                <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.82),rgba(0,0,0,0.24)_62%,rgba(0,0,0,0.66))]" />
              </div>
              <div className="relative max-w-xl">
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-lime-300">
                  Live events. Real people.
                </p>
                <h1 className="mt-5 text-balance font-display text-5xl font-semibold leading-[0.95] tracking-[-0.06em] text-white sm:text-6xl">
                  Choose your route into <span className="text-lime-300">Athena Pro.</span>
                </h1>
                <p className="mt-5 max-w-md text-base leading-8 text-white/74">
                  Field team can apply for roles and manage work. Companies can hire, brief, and message teams.
                </p>
              </div>

              <div className="absolute bottom-6 left-6 right-6 grid gap-3 sm:grid-cols-3">
                {[
                  { icon: Heart, label: "Save roles" },
                  { icon: Star, label: "Build ratings" },
                  { icon: MessageCircle, label: "Stay in touch" }
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className="rounded-[22px] border border-white/10 bg-black/52 p-4 backdrop-blur">
                      <Icon className="h-5 w-5 text-cyan-300" />
                      <p className="mt-3 text-sm font-semibold text-white">{item.label}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid border-t border-white/10 bg-black/58 sm:grid-cols-3">
              <div className="border-b border-white/10 p-5 sm:border-b-0 sm:border-r">
                <ShieldCheck className="h-7 w-7 text-lime-300" />
                <p className="mt-3 text-sm font-semibold text-white">Apply for roles in seconds</p>
                <p className="mt-1 text-sm text-white/54">Quick applications and saved jobs.</p>
              </div>
              <div className="border-b border-white/10 p-5 sm:border-b-0 sm:border-r">
                <Bell className="h-7 w-7 text-rose-300" />
                <p className="mt-3 text-sm font-semibold text-white">Updates before and after</p>
                <p className="mt-1 text-sm text-white/54">Messages and event notifications.</p>
              </div>
              <div className="p-5">
                <Sparkles className="h-7 w-7 text-cyan-300" />
                <p className="mt-3 text-sm font-semibold text-white">Profile hub included</p>
                <p className="mt-1 text-sm text-white/54">Ratings, earnings, and availability.</p>
              </div>
            </div>
          </div>

          <div className="rounded-[34px] border border-white/10 bg-[#090d10]/88 p-5 shadow-[0_28px_100px_rgba(0,0,0,0.48)] backdrop-blur-2xl sm:p-7 lg:p-8">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-lime-300">Platform Access</p>
              <h2 className="mt-3 text-balance font-display text-4xl font-semibold tracking-[-0.06em] text-white sm:text-5xl">
                {activeAccess.label} sign in
              </h2>
              <p className="mt-3 text-sm leading-7 text-white/64 sm:text-base">{activeAccess.headline}</p>
            </div>

            <div className="mt-7 grid grid-cols-2 gap-2 rounded-[22px] border border-white/10 bg-white/[0.04] p-1.5">
              {(Object.keys(ACCESS_OPTIONS) as AccessMode[]).map((mode) => {
                const option = ACCESS_OPTIONS[mode];
                const Icon = option.icon;
                const isActive = mode === accessMode;

                return (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setAccessMode(mode)}
                    className={`flex min-h-[76px] items-center gap-3 rounded-[18px] px-4 py-3 text-left transition ${
                      isActive
                        ? "bg-lime-300 text-black shadow-[0_0_28px_rgba(217,255,47,0.22)]"
                        : "text-white/70 hover:bg-white/[0.06] hover:text-white"
                    }`}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    <span>
                      <span className="block text-sm font-semibold">{option.label}</span>
                      <span className={`mt-0.5 block text-xs ${isActive ? "text-black/62" : "text-white/44"}`}>
                        {option.eyebrow}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>

            <form className="mt-7 space-y-5" onSubmit={handleLogin}>
              <Field label="Email address">
                <Input
                  type="email"
                  placeholder={accessMode === "field-team" ? "operator@example.com" : "company@example.com"}
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </Field>
              <Field label="Password">
                <PasswordField
                  placeholder="Enter your password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </Field>
              <div className="flex justify-end">
                <Link href="/auth/forgot-password" className="text-sm text-white/58 transition hover:text-white">
                  Forgot password?
                </Link>
              </div>
              <Button type="submit" className="w-full gap-2 bg-lime-300 py-3.5 text-black hover:bg-lime-200" disabled={submitting}>
                {submitting ? "Opening workspace..." : `Sign in as ${activeAccess.label.toLowerCase()}`}
                <ActiveIcon className="h-4 w-4" />
              </Button>
              <p className="text-center text-sm text-white/58">
                New here?{" "}
                <Link href={activeAccess.signupHref} className="font-semibold text-cyan-300 transition hover:text-cyan-200">
                  {activeAccess.signupLabel}
                </Link>
              </p>
            </form>

            <div className="mt-8 rounded-[26px] border border-white/10 bg-white/[0.04] p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/42">Live job preview</p>
                  <p className="mt-1 text-lg font-semibold text-white">Find roles before signing in</p>
                </div>
                <Link href="/jobs" className="shrink-0 text-sm font-semibold text-lime-300 hover:text-lime-200">
                  Open board
                </Link>
              </div>
              <div className="mt-4 grid gap-3">
                {previewJobs.map((job) => (
                  <Link
                    key={job.id}
                    href={job.href}
                    className="group rounded-[20px] border border-white/10 bg-black/35 p-4 transition hover:border-lime-300/40 hover:bg-black/52"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-300">{job.tag}</p>
                        <p className="mt-2 font-semibold text-white">{job.title}</p>
                        <p className="mt-1 text-sm text-white/54">
                          {job.location} - {job.detail}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-sm text-lime-300">
                        {job.rate}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            <div className="mt-5 overflow-hidden rounded-[24px] border border-white/10">
              <img src={DETAIL_IMAGE} alt="Festival stage lights at night." className="h-32 w-full object-cover opacity-82" />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
