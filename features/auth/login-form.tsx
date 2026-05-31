"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  cloneElement,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type FormEvent,
  type ReactElement
} from "react";
import {
  ArrowRight,
  BriefcaseBusiness,
  CircleDollarSign,
  Lightbulb,
  Shield,
  Sparkles
} from "lucide-react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/layout/site-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PasswordField } from "@/components/ui/password-field";
import { useStaffBook } from "@/features/app/use-staffbook";
import { BRAND } from "@/lib/brand";
import { toDisplayError } from "@/lib/errors";
import { formatCurrency, formatDate } from "@/lib/utils";
import { loginSchema } from "@/lib/validation/schemas";
import type { EnrichedJob } from "@/types/domain";

type PrismFace = "field-team" | "assignments" | "request-access";

type FaceConfig = {
  id: PrismFace;
  title: string;
  shortTitle: string;
  marker: string;
  href: string;
  icon: ReactElement;
  cardIcon: ReactElement;
  description: string;
  detail: string;
  actionLabel: string;
  textClassName: string;
  borderClassName: string;
  prismFill: string;
  prismStroke: string;
  pageBackgroundStyle: CSSProperties;
  panelBackgroundStyle: CSSProperties;
};

const PRISM_FACES: PrismFace[] = ["assignments", "field-team", "request-access"];

type JobBoardPreviewItem = {
  id: string;
  title: string;
  location: string;
  rate: string;
  detail: string;
  tag: "Latest" | "Popular";
  href: string;
};

const JOB_BOARD_PREVIEW_ITEMS: JobBoardPreviewItem[] = [
  {
    id: "fallback-gate-scanner",
    title: "Gate scanner support",
    location: "London",
    rate: "£18/hr",
    detail: "Open now",
    tag: "Latest",
    href: "/jobs"
  },
  {
    id: "fallback-crowd-flow",
    title: "Crowd flow steward",
    location: "Manchester",
    rate: "£17/hr",
    detail: "High interest",
    tag: "Popular",
    href: "/jobs"
  },
  {
    id: "fallback-supervisor",
    title: "Event supervisor",
    location: "Birmingham",
    rate: "£24/hr",
    detail: "Open now",
    tag: "Latest",
    href: "/jobs"
  }
];

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

const FACE_CONFIG: Record<PrismFace, FaceConfig> = {
  "field-team": {
    id: "field-team",
    title: "Field Team",
    shortTitle: "Operators",
    marker: "Field team",
    href: "/staff",
    icon: <Lightbulb className="h-8 w-8 text-white" strokeWidth={2} />,
    cardIcon: <Shield className="h-5 w-5 text-ink" strokeWidth={2.2} />,
    description: "Manage profile, availability, and booked work.",
    detail: "Profile, availability, and confirmed jobs.",
    actionLabel: "Sign in for field team",
    textClassName: "text-[#d6e0ea]",
    borderClassName: "border-[#7a889d]/45",
    prismFill: "url(#athena-prism-left)",
    prismStroke: "rgba(193,205,219,0.78)",
    pageBackgroundStyle: {
      backgroundImage:
        'var(--auth-page-overlay), radial-gradient(circle at 16% 52%, rgba(122,136,157,0.22), transparent 0 28%), url("https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1800&q=80")',
      backgroundSize: "cover",
      backgroundPosition: "center"
    },
    panelBackgroundStyle: {
      backgroundImage:
        'var(--auth-panel-overlay), linear-gradient(135deg, rgba(122,136,157,0.18), rgba(8,10,12,0.12)), url("https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=1400&q=80")',
      backgroundSize: "cover",
      backgroundPosition: "center"
    }
  },
  assignments: {
    id: "assignments",
    title: "Job Board",
    shortTitle: "Jobs",
    marker: "Find work",
    href: "/jobs",
    icon: <BriefcaseBusiness className="h-8 w-8 text-white" strokeWidth={2} />,
    cardIcon: <BriefcaseBusiness className="h-5 w-5 text-ink" strokeWidth={2.2} />,
    description: "Find available work.",
    detail: "Latest and popular jobs.",
    actionLabel: "Open job board",
    textClassName: "text-[#eef2f5]",
    borderClassName: "border-accent/55",
    prismFill: "url(#athena-prism-top)",
    prismStroke: "rgba(221,246,255,0.84)",
    pageBackgroundStyle: {
      backgroundImage:
        'var(--auth-page-overlay), radial-gradient(circle at 84% 46%, rgba(192,198,207,0.16), transparent 0 28%), url("https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1800&q=80")',
      backgroundSize: "cover",
      backgroundPosition: "center"
    },
    panelBackgroundStyle: {
      backgroundImage:
        'var(--auth-panel-overlay), linear-gradient(225deg, rgba(192,198,207,0.14), rgba(8,10,12,0.12)), url("https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1400&q=80")',
      backgroundSize: "cover",
      backgroundPosition: "center"
    }
  },
  "request-access": {
    id: "request-access",
    title: "Request Access",
    shortTitle: "Access",
    marker: "Post jobs",
    href: "/auth/signup",
    icon: <CircleDollarSign className="h-8 w-8 text-white" strokeWidth={2} />,
    cardIcon: <Sparkles className="h-5 w-5 text-ink" strokeWidth={2.2} />,
    description: "Apply to post jobs.",
    detail: "Request access to post jobs and manage bookings.",
    actionLabel: "Request access",
    textClassName: "text-[#eef2f5]",
    borderClassName: "border-[#d4dae1]/35",
    prismFill: "url(#athena-prism-right)",
    prismStroke: "rgba(236,240,244,0.74)",
    pageBackgroundStyle: {
      backgroundImage:
        'var(--auth-page-overlay), radial-gradient(circle at 50% 84%, rgba(123,212,255,0.18), transparent 0 30%), url("https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1800&q=80")',
      backgroundSize: "cover",
      backgroundPosition: "center"
    },
    panelBackgroundStyle: {
      backgroundImage:
        'var(--auth-panel-overlay), linear-gradient(180deg, rgba(123,212,255,0.12), rgba(8,10,12,0.12)), url("https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=1400&q=80")',
      backgroundSize: "cover",
      backgroundPosition: "center"
    }
  }
};

function RouteLabel({
  faceId,
  activeFaceId,
  className,
  align,
  onClick,
  onHoverStart,
  onHoverEnd
}: {
  faceId: PrismFace;
  activeFaceId: PrismFace;
  className: string;
  align: "left" | "right" | "center";
  onClick: () => void;
  onHoverStart: () => void;
  onHoverEnd: () => void;
}) {
  const face = FACE_CONFIG[faceId];
  const isActive = activeFaceId === faceId;

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={onHoverStart}
      onMouseLeave={onHoverEnd}
      onFocus={onHoverStart}
      onBlur={onHoverEnd}
      className={`absolute rounded-[26px] border px-5 py-4 text-left backdrop-blur-md transition-all duration-300 ${
        isActive
          ? "border-white/16 bg-black/56 opacity-100 shadow-[0_18px_50px_rgba(0,0,0,0.24)]"
          : "border-white/10 bg-black/34 opacity-85 hover:border-white/14 hover:bg-black/46"
      } ${className}`}
    >
      <p
        className={`font-display text-[1.7rem] font-semibold tracking-[-0.05em] ${face.textClassName} ${
          align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left"
        }`}
      >
        {face.title}
      </p>
      <p
        className={`mt-2 text-sm leading-7 text-slate ${
          align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left"
        }`}
      >
        {face.description}
      </p>
    </button>
  );
}

export function LoginForm({ redirectTo }: { redirectTo?: string }) {
  const router = useRouter();
  const { provider, refreshSession } = useStaffBook();
  const [selectedFace, setSelectedFace] = useState<PrismFace>("assignments");
  const [hoveredFace, setHoveredFace] = useState<PrismFace | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [previewJobs, setPreviewJobs] = useState<JobBoardPreviewItem[]>([...JOB_BOARD_PREVIEW_ITEMS]);

  const activeFaceId = hoveredFace ?? selectedFace;
  const activeFace = useMemo(() => FACE_CONFIG[activeFaceId], [activeFaceId]);
  const selectedConfig = useMemo(() => FACE_CONFIG[selectedFace], [selectedFace]);
  const loginEnabled = selectedFace === "field-team";

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
        // The static preview keeps the entry page useful when the public jobs API is unavailable.
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
    <main className="overflow-x-hidden">
      <SiteHeader />

      <section className="relative min-h-[calc(100svh-72px)] overflow-hidden px-4 pb-12 pt-8 sm:min-h-[calc(100svh-80px)] sm:px-6 sm:pb-16 sm:pt-10 md:px-8 md:pb-24 md:pt-12">
        <div className="absolute inset-0 opacity-60" style={{ backgroundImage: "var(--auth-grid-background)" }} />
        <div className="absolute inset-0" style={{ backgroundImage: "var(--auth-login-wash)" }} />

        {PRISM_FACES.map((face) => (
          <div
            key={face}
            className={`absolute inset-0 transition-opacity duration-700 ease-out ${
              activeFaceId === face ? "opacity-100" : "opacity-0"
            }`}
            style={FACE_CONFIG[face].pageBackgroundStyle}
          />
        ))}

        <div className="relative mx-auto max-w-[1500px]">
          <div className="mx-auto max-w-3xl text-center">
            <p className="font-display text-4xl font-semibold tracking-[0.18em] text-mist sm:text-5xl md:text-7xl">
              {BRAND.name}
            </p>
            <h1 className="text-balance mx-auto mt-5 max-w-4xl font-display text-4xl font-semibold leading-[0.94] tracking-[-0.08em] text-ink sm:text-5xl md:text-7xl">
              Choose your route.
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-slate sm:text-base sm:leading-8 md:text-lg">
              Request access, field team, or job board.
            </p>
          </div>

          <div className="mx-auto mt-8 max-w-2xl lg:hidden">
            <Card className="overflow-hidden p-0">
              <div className="relative h-[220px]">
                <div className="absolute inset-0" style={selectedConfig.panelBackgroundStyle} />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,12,14,0.18),rgba(10,12,14,0.72)_55%,rgba(10,12,14,0.92))]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_38%,rgba(255,255,255,0.08),transparent_0_24%)]" />
                <div className="relative flex h-full flex-col justify-between p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate">
                        Entry route
                      </p>
                      <p className="mt-2 text-sm text-slate">{selectedConfig.marker}</p>
                    </div>
                    <div className={`rounded-[18px] border bg-black/30 p-3 ${selectedConfig.borderClassName}`}>
                      {cloneElement(selectedConfig.cardIcon)}
                    </div>
                  </div>
                  <div>
                    <h2 className="font-display text-3xl font-semibold tracking-[-0.06em] text-ink">
                      {selectedConfig.title}
                    </h2>
                    <p className="mt-3 max-w-md text-sm leading-7 text-slate">{selectedConfig.description}</p>
                  </div>
                </div>
              </div>
              <div className="p-4 sm:p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate">
                  Select your route
                </p>
                <div className="mt-4 grid gap-3">
                  {PRISM_FACES.map((faceId) => {
                    const face = FACE_CONFIG[faceId];
                    const isActive = selectedFace === faceId;

                    return (
                      <button
                        key={faceId}
                        type="button"
                        onClick={() => setSelectedFace(faceId)}
                        className={`rounded-[22px] border px-4 py-4 text-left transition ${
                          isActive
                            ? "border-white/16 bg-black/56 shadow-[0_18px_50px_rgba(0,0,0,0.24)]"
                            : "border-white/10 bg-black/28 hover:border-white/14 hover:bg-black/40"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className={`font-display text-2xl font-semibold tracking-[-0.05em] ${face.textClassName}`}>
                            {face.title}
                          </p>
                          <div className={`rounded-[16px] border bg-white/[0.06] p-2.5 ${face.borderClassName}`}>
                            {cloneElement(face.cardIcon)}
                          </div>
                        </div>
                        <p className="mt-3 text-sm leading-7 text-slate">{face.description}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </Card>
          </div>

          <div className="mt-8 grid items-stretch gap-6 lg:mt-14 lg:grid-cols-2 lg:gap-8">
            <Card className="relative hidden overflow-hidden rounded-[40px] p-0 lg:block lg:min-h-[720px] xl:min-h-[780px]">
              {PRISM_FACES.map((face) => (
                <div
                  key={`${face}-panel`}
                  className={`absolute inset-0 transition-opacity duration-700 ease-out ${
                    activeFaceId === face ? "opacity-100" : "opacity-0"
                  }`}
                  style={FACE_CONFIG[face].panelBackgroundStyle}
                />
              ))}
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,12,14,0.3),rgba(10,12,14,0.62)_42%,rgba(10,12,14,0.88))]" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_52%,rgba(255,255,255,0.05),transparent_0_22%),radial-gradient(circle_at_50%_78%,rgba(123,212,255,0.08),transparent_0_26%)]" />

              <div className="relative flex h-full flex-col justify-between p-6 md:p-8">
                <div className="relative flex-1">
                  <RouteLabel
                    faceId="assignments"
                    activeFaceId={activeFaceId}
                    className="left-1/2 top-2 z-20 w-[300px] -translate-x-1/2"
                    align="center"
                    onClick={() => setSelectedFace("assignments")}
                    onHoverStart={() => setHoveredFace("assignments")}
                    onHoverEnd={() => setHoveredFace(null)}
                  />
                  <RouteLabel
                    faceId="field-team"
                    activeFaceId={activeFaceId}
                    className="bottom-8 left-0 z-20 w-[250px] md:left-2"
                    align="left"
                    onClick={() => setSelectedFace("field-team")}
                    onHoverStart={() => setHoveredFace("field-team")}
                    onHoverEnd={() => setHoveredFace(null)}
                  />
                  <RouteLabel
                    faceId="request-access"
                    activeFaceId={activeFaceId}
                    className="bottom-8 right-0 z-20 w-[250px] md:right-2"
                    align="right"
                    onClick={() => setSelectedFace("request-access")}
                    onHoverStart={() => setHoveredFace("request-access")}
                    onHoverEnd={() => setHoveredFace(null)}
                  />

                  <div className="absolute inset-x-0 top-[16%] bottom-[8%] flex items-center justify-center">
                    <div className="relative h-[540px] w-[540px] md:h-[660px] md:w-[660px]">
                      <div className="absolute inset-[16%] rounded-full bg-black/28 blur-3xl" />
                      <svg viewBox="0 0 640 640" className="h-full w-full drop-shadow-[0_40px_90px_rgba(0,0,0,0.34)]">
                        <defs>
                          <linearGradient id="athena-prism-top" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#b8ebff" />
                            <stop offset="100%" stopColor="#7bd4ff" />
                          </linearGradient>
                          <linearGradient id="athena-prism-left" x1="0%" y1="100%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#657487" />
                            <stop offset="100%" stopColor="#95a2b3" />
                          </linearGradient>
                          <linearGradient id="athena-prism-right" x1="100%" y1="100%" x2="0%" y2="0%">
                            <stop offset="0%" stopColor="#c5ccd5" />
                            <stop offset="100%" stopColor="#e0e5ea" />
                          </linearGradient>
                          <filter id="athena-prism-shadow" x="-20%" y="-20%" width="140%" height="160%">
                            <feDropShadow dx="0" dy="24" stdDeviation="28" floodOpacity="0.22" floodColor="#020304" />
                          </filter>
                          <filter id="athena-prism-core" x="-20%" y="-20%" width="140%" height="140%">
                            <feDropShadow dx="0" dy="12" stdDeviation="18" floodOpacity="0.16" floodColor="#020304" />
                          </filter>
                        </defs>

                        <g filter="url(#athena-prism-shadow)">
                          <g
                            className="origin-center cursor-pointer transition-all duration-300"
                            style={{
                              transform:
                                activeFaceId === "assignments"
                                  ? "translate3d(0,-16px,0) scale(1.03)"
                                  : "translate3d(0,-12px,0) scale(1)"
                            }}
                            onClick={() => setSelectedFace("assignments")}
                            onMouseEnter={() => setHoveredFace("assignments")}
                            onMouseLeave={() => setHoveredFace(null)}
                          >
                            <polygon
                              points="216.1,260 320,80 423.9,260 320,320"
                              fill={FACE_CONFIG.assignments.prismFill}
                              stroke={FACE_CONFIG.assignments.prismStroke}
                              strokeWidth="16"
                              strokeLinejoin="round"
                            />
                            <foreignObject x="304" y="160" width="32" height="32" className="pointer-events-none">
                              {FACE_CONFIG.assignments.icon}
                            </foreignObject>
                          </g>

                          <g
                            className="origin-center cursor-pointer transition-all duration-300"
                            style={{
                              transform:
                                activeFaceId === "field-team"
                                  ? "translate3d(-16px,10px,0) scale(1.03)"
                                  : "translate3d(-12px,8px,0) scale(1)"
                            }}
                            onClick={() => setSelectedFace("field-team")}
                            onMouseEnter={() => setHoveredFace("field-team")}
                            onMouseLeave={() => setHoveredFace(null)}
                          >
                            <polygon
                              points="320,440 112.2,440 216.1,260 320,320"
                              fill={FACE_CONFIG["field-team"].prismFill}
                              stroke={FACE_CONFIG["field-team"].prismStroke}
                              strokeWidth="16"
                              strokeLinejoin="round"
                            />
                            <foreignObject x="188" y="342" width="32" height="32" className="pointer-events-none">
                              {FACE_CONFIG["field-team"].icon}
                            </foreignObject>
                          </g>

                          <g
                            className="origin-center cursor-pointer transition-all duration-300"
                            style={{
                              transform:
                                activeFaceId === "request-access"
                                  ? "translate3d(16px,10px,0) scale(1.03)"
                                  : "translate3d(12px,8px,0) scale(1)"
                            }}
                            onClick={() => setSelectedFace("request-access")}
                            onMouseEnter={() => setHoveredFace("request-access")}
                            onMouseLeave={() => setHoveredFace(null)}
                          >
                            <polygon
                              points="320,440 320,320 423.9,260 527.8,440"
                              fill={FACE_CONFIG["request-access"].prismFill}
                              stroke={FACE_CONFIG["request-access"].prismStroke}
                              strokeWidth="16"
                              strokeLinejoin="round"
                            />
                            <foreignObject x="418" y="342" width="32" height="32" className="pointer-events-none">
                              {FACE_CONFIG["request-access"].icon}
                            </foreignObject>
                          </g>
                        </g>

                        <circle
                          cx="320"
                          cy="320"
                          r="84"
                          fill="rgba(243,246,250,0.98)"
                          filter="url(#athena-prism-core)"
                          className="pointer-events-none"
                        />
                        <text
                          x="320"
                          y="314"
                          textAnchor="middle"
                          className="pointer-events-none fill-[#111315] font-display text-lg font-semibold tracking-[-0.05em]"
                        >
                          <tspan x="320" dy="-2">
                            {activeFace.shortTitle}
                          </tspan>
                          <tspan
                            x="320"
                            dy="24"
                            className="fill-[#616a75] text-[13px] font-semibold uppercase tracking-[0.22em]"
                          >
                            Athena Pro
                          </tspan>
                        </text>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="flex flex-col justify-center rounded-[32px] p-5 sm:p-8 md:rounded-[40px] md:p-12 lg:min-h-[720px] xl:min-h-[780px]">
              <div className="max-w-[480px]">
                <div className="flex items-center gap-3">
                  <div className={`rounded-[18px] border bg-white/[0.06] p-3 ${selectedConfig.borderClassName}`}>
                    {cloneElement(selectedConfig.cardIcon)}
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate">
                      {selectedConfig.marker}
                    </p>
                    <h2 className="text-balance mt-2 font-display text-3xl font-semibold tracking-[-0.06em] text-ink sm:text-4xl md:text-5xl">
                      {selectedConfig.title}
                    </h2>
                  </div>
                </div>

                <p className="mt-5 text-sm leading-7 text-slate sm:text-base sm:leading-8 md:text-lg">
                  {selectedConfig.detail}
                </p>

                {loginEnabled ? (
                  <form className="mt-8 space-y-5 sm:mt-10" onSubmit={handleLogin}>
                    <Field label="Email address">
                      <Input
                        type="email"
                        placeholder="operator@example.com"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                      />
                    </Field>
                    <Field label="Password">
                      <PasswordField
                        placeholder="••••••••"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                      />
                    </Field>
                    <div className="flex justify-end">
                      <Link href="/auth/forgot-password" className="text-sm text-mist transition hover:text-ink">
                        Forgot password?
                      </Link>
                    </div>
                    <Button type="submit" className="mt-3 w-full" disabled={submitting}>
                      {submitting ? "Opening workspace..." : selectedConfig.actionLabel}
                    </Button>
                    <p className="text-center text-sm text-slate">
                      Not a member?{" "}
                      <Link href="/auth/signup" className="font-semibold text-mist transition hover:text-ink">
                        Sign up here
                      </Link>
                    </p>
                  </form>
                ) : selectedFace === "assignments" ? (
                  <div className="mt-8 space-y-5 sm:mt-10">
                    <div className="grid gap-3">
                      {previewJobs.map((job) => (
                        <Link
                          key={job.id}
                          href={job.href}
                          className="group rounded-[22px] border border-line/60 bg-black/20 p-4 transition hover:border-white/18 hover:bg-black/32"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate">
                                {job.tag}
                              </p>
                              <p className="mt-2 font-display text-2xl font-semibold tracking-[-0.05em] text-ink">
                                {job.title}
                              </p>
                              <p className="mt-1 text-sm text-slate">
                                {job.location} • {job.detail}
                              </p>
                            </div>
                            <span className="shrink-0 rounded-full border border-line/60 bg-white/[0.06] px-3 py-1.5 text-sm text-mist">
                              {job.rate}
                            </span>
                          </div>
                        </Link>
                      ))}
                    </div>
                    <Link href="/jobs" className="block">
                      <Button className="w-full justify-between gap-2">
                        Open job board <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="mt-10 flex flex-col gap-3">
                    <Link href="/auth/signup" className="block">
                      <Button className="w-full justify-between gap-2">
                        Request access <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Link href="/services" className="block">
                      <Button variant="secondary" className="w-full">
                        View services
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </Card>
          </div>

        </div>
      </section>
    </main>
  );
}
