"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Bell,
  Bookmark,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  CreditCard,
  Heart,
  Lock,
  Mail,
  MapPin,
  Menu,
  MessageCircle,
  RotateCcw,
  Star,
  User,
  UserCircle,
  WalletCards,
  X
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { SiteHeader } from "@/components/layout/site-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { EmptyState } from "@/components/ui/empty-state";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { LoadingPanel } from "@/components/ui/loading-panel";
import { NotificationsList } from "@/components/ui/notifications-list";
import { PasswordField } from "@/components/ui/password-field";
import { PerformanceBar } from "@/components/ui/performance-bar";
import { Select } from "@/components/ui/select";
import { Stars } from "@/components/ui/stars";
import { Textarea } from "@/components/ui/textarea";
import { useQueryState } from "@/features/app/use-query-state";
import { useStaffBook } from "@/features/app/use-staffbook";
import { toDisplayError } from "@/lib/errors";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import {
  updateEmailSchema,
  updateMarketingPreferencesSchema,
  updateOperatorAvailabilitySchema,
  updateOperatorProfileSchema,
  updatePasswordSchema
} from "@/lib/validation/schemas";
import type { EnrichedConversationThread, EnrichedJob, StaffJobsBoardItem } from "@/types/domain";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAY_CIRCLE_ORDER = [
  { day: 1, label: "M", full: "Mon" },
  { day: 2, label: "T", full: "Tue" },
  { day: 3, label: "W", full: "Wed" },
  { day: 4, label: "T", full: "Thu" },
  { day: 5, label: "F", full: "Fri" },
  { day: 6, label: "S", full: "Sat" },
  { day: 0, label: "S", full: "Sun" }
];

const PROFILE_SECTIONS = [
  { id: "overview", label: "Overview", icon: UserCircle },
  { id: "applications", label: "Applications", icon: BriefcaseBusiness },
  { id: "saved", label: "Saved & liked", icon: Heart },
  { id: "rejected", label: "Rejected", icon: RotateCcw },
  { id: "earnings", label: "Earnings", icon: WalletCards },
  { id: "ratings", label: "Ratings & reviews", icon: Star },
  { id: "availability", label: "Availability", icon: CalendarDays },
  { id: "profile", label: "Profile", icon: User },
  { id: "messages", label: "Messages", icon: MessageCircle },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "payments", label: "Payments", icon: CreditCard },
  { id: "security", label: "Security", icon: Lock },
  { id: "marketing", label: "Marketing", icon: Mail }
] as const;

type ProfileSection = (typeof PROFILE_SECTIONS)[number]["id"];
type MessageTab = "company" | "event";

function getEstimatedApplicationPay(application: { job: { shiftStart: string; shiftEnd: string; payRate: number } }) {
  const hours = Math.max(
    (new Date(application.job.shiftEnd).getTime() - new Date(application.job.shiftStart).getTime()) / (1000 * 60 * 60),
    0
  );

  return hours * application.job.payRate;
}

function normalizeSection(value: string | null): ProfileSection {
  return PROFILE_SECTIONS.some((section) => section.id === value) ? (value as ProfileSection) : "overview";
}

function ProfilePhoto({ name, avatarUrl, className }: { name: string; avatarUrl?: string | null; className?: string }) {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt=""
        className={cn("h-16 w-16 rounded-full border-2 border-lime-300 object-cover", className)}
      />
    );
  }

  return (
    <span
      className={cn(
        "inline-flex h-16 w-16 items-center justify-center rounded-full border-2 border-lime-300 bg-black text-lg font-semibold text-lime-300",
        className
      )}
    >
      {initials}
    </span>
  );
}

function JobMiniCard({
  item,
  action
}: {
  item: StaffJobsBoardItem;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-ink">{item.job.title}</p>
          <p className="mt-1 text-sm text-slate">
            {item.job.organization.name} - {formatCurrency(item.job.payRate)}/hr
          </p>
          <p className="mt-2 text-xs text-slate">
            {item.job.event.location} - {formatDate(item.job.event.eventDate)}
          </p>
        </div>
        {action}
      </div>
      {item.matchReasons.length > 0 ? (
        <p className="mt-3 text-sm text-slate">{item.matchReasons.slice(0, 2).join(" - ")}</p>
      ) : null}
    </div>
  );
}

function StaffBottomNav({ activeSection }: { activeSection: ProfileSection }) {
  const items = [
    { href: "/jobs", label: "Feed", icon: Bookmark, active: false },
    { href: "/dashboard/staff/jobs", label: "Saved", icon: Heart, active: false },
    { href: "/dashboard/staff/profile?section=applications", label: "Applications", icon: BriefcaseBusiness, active: activeSection === "applications" },
    { href: "/dashboard/staff/profile?section=messages", label: "Messages", icon: MessageCircle, active: activeSection === "messages" },
    { href: "/dashboard/staff/profile", label: "Profile", icon: UserCircle, active: activeSection !== "messages" && activeSection !== "applications" }
  ];

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-black/88 px-6 pb-[max(env(safe-area-inset-bottom),14px)] pt-3 text-white backdrop-blur md:hidden">
      <div className="mx-auto grid max-w-md grid-cols-5 text-center text-xs text-white/58">
        {items.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn("flex flex-col items-center gap-1", item.active ? "text-lime-300" : "")}
            >
              <Icon className="h-6 w-6" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function MessageWorkspace({
  threads,
  jobs,
  onSend
}: {
  threads: EnrichedConversationThread[];
  jobs: EnrichedJob[];
  onSend: (input: { organizationId: string; jobId?: string; body: string }) => Promise<void>;
}) {
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<MessageTab>(searchParams.get("tab") === "event" ? "event" : "company");
  const [selectedThreadId, setSelectedThreadId] = useState(searchParams.get("thread") ?? "");
  const [targetKey, setTargetKey] = useState("");
  const [messageBody, setMessageBody] = useState("");
  const [sending, setSending] = useState(false);
  const companyThreads = threads.filter((thread) => !thread.jobId && !thread.eventId);
  const eventThreads = threads.filter((thread) => thread.jobId || thread.eventId);
  const currentThreads = tab === "company" ? companyThreads : eventThreads;
  const selectedThread =
    currentThreads.find((thread) => thread.id === selectedThreadId) ?? currentThreads[0] ?? null;
  const companyTargets = useMemo(() => {
    const byId = new Map<string, { key: string; label: string; organizationId: string }>();

    for (const job of jobs) {
      byId.set(job.organization.id, {
        key: job.organization.id,
        label: job.organization.name,
        organizationId: job.organization.id
      });
    }

    for (const thread of threads) {
      byId.set(thread.organizationId, {
        key: thread.organizationId,
        label: thread.organization.name,
        organizationId: thread.organizationId
      });
    }

    return Array.from(byId.values());
  }, [jobs, threads]);
  const eventTargets = useMemo(() => {
    const byId = new Map<string, { key: string; label: string; organizationId: string; jobId: string }>();

    for (const job of jobs) {
      byId.set(job.id, {
        key: job.id,
        label: `${job.title} - ${job.organization.name}`,
        organizationId: job.organization.id,
        jobId: job.id
      });
    }

    return Array.from(byId.values());
  }, [jobs]);
  const targets = tab === "company" ? companyTargets : eventTargets;

  useEffect(() => {
    if (selectedThread) {
      setSelectedThreadId(selectedThread.id);
    } else {
      setSelectedThreadId("");
    }
  }, [selectedThread?.id]);

  useEffect(() => {
    setTargetKey(targets[0]?.key ?? "");
  }, [tab, targets]);

  async function submitMessage(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const body = messageBody.trim();

    if (!body) {
      toast.message("Enter a message first.");
      return;
    }

    const selectedTarget = targets.find((target) => target.key === targetKey) as
      | { organizationId: string; jobId?: string }
      | undefined;
    const payload: { organizationId: string; jobId?: string; body: string } | null = selectedThread
      ? { organizationId: selectedThread.organizationId, jobId: tab === "event" ? selectedThread.jobId : undefined, body }
      : selectedTarget
        ? {
            organizationId: selectedTarget.organizationId,
            jobId: selectedTarget.jobId,
            body
          }
        : null;

    if (!payload) {
      toast.message("Choose a company or event first.");
      return;
    }

    try {
      setSending(true);
      await onSend(payload);
      setMessageBody("");
    } finally {
      setSending(false);
    }
  }

  return (
    <Card className="mt-6 rounded-lg">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate">Messages</p>
          <h2 className="mt-3 text-2xl font-semibold text-ink">Company and event conversations</h2>
        </div>
        <div className="inline-flex rounded-full border border-white/10 bg-white/[0.03] p-1">
          {[
            { id: "company", label: "Company" },
            { id: "event", label: "Event" }
          ].map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setTab(option.id as MessageTab)}
              className={cn(
                "min-h-10 rounded-full px-4 text-sm font-semibold transition",
                tab === option.id ? "bg-lime-300 text-canvas" : "text-slate hover:text-ink"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[320px_1fr]">
        <div className="space-y-3">
          {currentThreads.length === 0 ? (
            <p className="rounded-lg border border-white/10 bg-white/[0.03] p-4 text-sm text-slate">
              No {tab} conversations yet. Choose a {tab === "company" ? "company" : "job"} and send a first message.
            </p>
          ) : (
            currentThreads.map((thread) => (
              <button
                key={thread.id}
                type="button"
                onClick={() => setSelectedThreadId(thread.id)}
                className={cn(
                  "block w-full rounded-lg border px-4 py-3 text-left transition",
                  selectedThread?.id === thread.id
                    ? "border-lime-300 bg-lime-300/10"
                    : "border-white/10 bg-white/[0.03] hover:border-white/20"
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="truncate font-semibold text-ink">{thread.subject}</p>
                  {thread.unreadCount ? (
                    <span className="rounded-full bg-cyan-300 px-2 py-1 text-xs text-canvas">{thread.unreadCount}</span>
                  ) : null}
                </div>
                <p className="mt-1 truncate text-sm text-slate">{thread.organization.name}</p>
                <p className="mt-2 line-clamp-2 text-sm text-slate">{thread.messages.at(-1)?.body ?? "No messages yet."}</p>
              </button>
            ))
          )}
        </div>

        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
          {selectedThread ? (
            <>
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/10 pb-4">
                <div>
                  <p className="font-semibold text-ink">{selectedThread.subject}</p>
                  <p className="mt-1 text-sm text-slate">{selectedThread.organization.name}</p>
                </div>
                {selectedThread.job ? <Badge variant="accent">{selectedThread.job.roleType}</Badge> : null}
              </div>
              <div className="mt-4 max-h-[360px] space-y-3 overflow-y-auto pr-1">
                {selectedThread.messages.length === 0 ? (
                  <p className="text-sm text-slate">No messages yet.</p>
                ) : (
                  selectedThread.messages.map((message) => (
                    <div key={message.id} className="rounded-lg border border-white/10 bg-black/20 px-4 py-3">
                      <p className="text-sm leading-6 text-ink">{message.body}</p>
                      <p className="mt-2 text-xs text-slate">{formatDate(message.createdAt)}</p>
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            <div>
              <p className="font-semibold text-ink">Start a {tab} message</p>
              <p className="mt-2 text-sm text-slate">Pick a target and send a message to open a thread.</p>
              <div className="mt-4">
                <Select value={targetKey} onChange={(event) => setTargetKey(event.target.value)}>
                  {targets.map((target) => (
                    <option key={target.key} value={target.key}>
                      {target.label}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          )}

          <form className="mt-5 space-y-3" onSubmit={submitMessage}>
            {!selectedThread && targets.length === 0 ? (
              <p className="text-sm text-slate">Save or apply to jobs first so message targets are available.</p>
            ) : null}
            <Textarea
              value={messageBody}
              onChange={(event) => setMessageBody(event.target.value)}
              placeholder={selectedThread ? "Reply to this thread" : "Write your first message"}
            />
            <Button type="submit" variant="accent" className="min-h-12 w-full sm:w-auto" disabled={sending}>
              {sending ? "Sending..." : selectedThread ? "Send reply" : "Start thread"}
            </Button>
          </form>
        </div>
      </div>
    </Card>
  );
}

export function OperatorProfileWorkspace() {
  const { provider, session, loading } = useStaffBook();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const workspace = useQueryState(() => provider.getOperatorWorkspace(), [provider, session?.userId]);
  const [profileForm, setProfileForm] = useState({
    fullName: "",
    phone: "",
    details: "",
    headline: "",
    baseLocation: "",
    preferredRoles: "",
    languages: "",
    dateOfBirth: "",
    avatarUrl: "",
    skills: ""
  });
  const [availabilitySummary, setAvailabilitySummary] = useState("");
  const [availabilityRules, setAvailabilityRules] = useState<
    Array<{
      id?: string;
      dayOfWeek: number;
      isAvailable: boolean;
      isAllDay: boolean;
      startTime?: string;
      endTime?: string;
    }>
  >([]);
  const [sameHours, setSameHours] = useState(true);
  const [sharedStartTime, setSharedStartTime] = useState("09:00");
  const [sharedEndTime, setSharedEndTime] = useState("18:00");
  const [email, setEmail] = useState("");
  const [marketingConsent, setMarketingConsent] = useState({
    newsletterConsent: false,
    offersConsent: false,
    productUpdatesConsent: false
  });
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [activeSection, setActiveSection] = useState<ProfileSection>(normalizeSection(searchParams.get("section")));
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    setActiveSection(normalizeSection(searchParams.get("section")));
  }, [searchParams]);

  useEffect(() => {
    if (!workspace.data) {
      return;
    }

    setProfileForm({
      fullName: workspace.data.profile.fullName,
      phone: workspace.data.profile.phone ?? "",
      details: workspace.data.operatorProfile.details ?? workspace.data.profile.bio ?? "",
      headline: workspace.data.operatorProfile.headline ?? "",
      baseLocation: workspace.data.operatorProfile.baseLocation ?? workspace.data.profile.location ?? "",
      preferredRoles: workspace.data.operatorProfile.preferredRoles.join(", "),
      languages: workspace.data.operatorProfile.languages.join(", "),
      dateOfBirth: workspace.data.operatorProfile.dateOfBirth ?? "",
      avatarUrl: workspace.data.operatorProfile.avatarUrl ?? workspace.data.profile.avatarUrl ?? "",
      skills: workspace.data.profile.skills.join(", ")
    });
    setAvailabilitySummary(
      workspace.data.operatorProfile.availabilitySummary ?? workspace.data.profile.availability ?? ""
    );
    setAvailabilityRules(
      workspace.data.availabilityRules.map((rule) => ({
        id: rule.id,
        dayOfWeek: rule.dayOfWeek,
        isAvailable: rule.isAvailable,
        isAllDay: rule.isAllDay,
        startTime: rule.startTime,
        endTime: rule.endTime
      }))
    );
    setEmail(workspace.data.profile.email);
    setMarketingConsent({
      newsletterConsent: workspace.data.marketingPreference.newsletterOptIn,
      offersConsent: workspace.data.marketingPreference.offersOptIn,
      productUpdatesConsent: workspace.data.marketingPreference.productUpdatesOptIn
    });
  }, [workspace.data]);

  function goToSection(section: ProfileSection) {
    const nextParams = new URLSearchParams(searchParams.toString());

    if (section === "overview") {
      nextParams.delete("section");
    } else {
      nextParams.set("section", section);
    }

    setActiveSection(section);
    setDrawerOpen(false);
    router.push(`${pathname}${nextParams.toString() ? `?${nextParams.toString()}` : ""}`);
  }

  if (loading || workspace.loading) {
    return (
      <main>
        <SiteHeader />
        <DashboardShell
          eyebrow="Operator profile"
          title="Loading workspace"
          description="Preparing profile, availability, performance, and payment settings."
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

  if (!session || session.role !== "staff") {
    return (
      <main>
        <SiteHeader />
        <DashboardShell
          eyebrow="Operator profile"
          title="Sign in required"
          description="This workspace is available only to operator accounts."
        >
          <EmptyState title="Operator account required" description="Sign in as field team to manage your profile." />
        </DashboardShell>
      </main>
    );
  }

  if (workspace.error || !workspace.data) {
    return (
      <main>
        <SiteHeader />
        <DashboardShell
          eyebrow="Operator profile"
          title="Workspace unavailable"
          description={workspace.error ?? "Unable to load the operator workspace."}
        >
          <EmptyState title="Try again" description="The operator workspace data did not resolve cleanly." />
        </DashboardShell>
      </main>
    );
  }

  const activeSectionMeta = PROFILE_SECTIONS.find((section) => section.id === activeSection) ?? PROFILE_SECTIONS[0];
  const ActiveSectionIcon = activeSectionMeta.icon;
  const profileAvatar = workspace.data.operatorProfile.avatarUrl ?? workspace.data.profile.avatarUrl;
  const profileLocation = workspace.data.operatorProfile.baseLocation ?? workspace.data.profile.location ?? "Location pending";
  const roles = (workspace.data.operatorProfile.preferredRoles ?? []).length
    ? workspace.data.operatorProfile.preferredRoles ?? []
    : workspace.data.profile.preferredRoles ?? [];
  const dismissedCount = workspace.data.dismissedJobs.length;
  const acceptedEarnings = workspace.data.recentApplications
    .filter((application) => application.status === "accepted")
    .reduce((sum, application) => sum + getEstimatedApplicationPay(application), 0);
  const messagingJobs = Array.from(
    new Map(
      [
        ...workspace.data.recommendedJobs.map((item) => item.job),
        ...workspace.data.savedJobs.map((item) => item.job),
        ...workspace.data.likedJobs.map((item) => item.job),
        ...workspace.data.dismissedJobs.map((item) => item.job),
        ...workspace.data.recentApplications.map(
          (application) =>
            ({
              ...application.job,
              event: application.event,
              organization: application.organization,
              applicationCount: 0
            }) satisfies EnrichedJob
        )
      ].map((job) => [job.id, job] as const)
    ).values()
  );

  return (
    <main className="pb-24 md:pb-0">
      <SiteHeader />
      <DashboardShell
        eyebrow="Operator profile"
        title={workspace.data.profile.fullName}
        description="Update your profile, control weekly availability, review performance, and manage messages."
        hideIntroOnMobile
      >
        <div className="relative">
          <Card className="overflow-hidden rounded-lg border-white/10 bg-black/50 p-0">
            <div className="h-24 bg-[linear-gradient(135deg,rgba(190,242,100,0.28),rgba(34,211,238,0.16),rgba(5,7,10,0.94))]" />
            <div className="px-5 pb-5">
              <div className="-mt-10 flex flex-wrap items-end justify-between gap-4">
                <button
                  type="button"
                  onClick={() => setDrawerOpen(true)}
                  className="group relative rounded-full"
                  aria-label="Open profile menu"
                >
                  <ProfilePhoto name={workspace.data.profile.fullName} avatarUrl={profileAvatar} className="h-20 w-20" />
                  <span className="absolute -bottom-1 -right-1 inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-black text-lime-300 shadow-lg">
                    <Menu className="h-4 w-4" />
                  </span>
                </button>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="secondary" className="gap-2" onClick={() => goToSection("messages")}>
                    <MessageCircle className="h-4 w-4" />
                    Messages
                  </Button>
                  <Button type="button" variant="accent" className="gap-2" onClick={() => goToSection("availability")}>
                    <CalendarDays className="h-4 w-4" />
                    Availability
                  </Button>
                </div>
              </div>
              <div className="mt-4">
                <h1 className="font-display text-3xl font-semibold tracking-[-0.04em] text-ink">
                  {workspace.data.profile.fullName}
                </h1>
                <p className="mt-2 text-sm text-slate">{workspace.data.operatorProfile.headline || workspace.data.operatorProfile.details}</p>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate">
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-4 w-4 text-lime-300" />
                    {profileLocation}
                  </span>
                  <Stars value={workspace.data.performanceSummary.overallRating || 0} size="md" />
                  <span className="rounded-full border border-lime-300/30 bg-lime-300/10 px-3 py-1 text-lime-100">
                    {workspace.data.performanceSummary.ratingBand} star band
                  </span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {roles.slice(0, 5).map((role) => (
                    <Badge key={role} variant="neutral">
                      {role}
                    </Badge>
                  ))}
                </div>
                <div className="mt-5 grid grid-cols-3 gap-2 text-center sm:max-w-lg">
                  <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-3">
                    <p className="text-lg font-semibold text-ink">{workspace.data.performanceSummary.reviewCount}</p>
                    <p className="text-xs text-slate">Reviews</p>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-3">
                    <p className="text-lg font-semibold text-ink">{workspace.data.recentApplications.length}</p>
                    <p className="text-xs text-slate">Applications</p>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-3">
                    <p className="text-lg font-semibold text-ink">{workspace.data.dismissedJobs.length}</p>
                    <p className="text-xs text-slate">Rejected</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {drawerOpen ? (
            <div className="fixed inset-0 z-50 bg-black/58 backdrop-blur-sm" onClick={() => setDrawerOpen(false)}>
              <aside
                className="h-full w-[min(88vw,360px)] border-r border-white/10 bg-black px-5 py-5 text-white shadow-2xl"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="flex items-center justify-between gap-4">
                  <ProfilePhoto name={workspace.data.profile.fullName} avatarUrl={profileAvatar} />
                  <button
                    type="button"
                    onClick={() => setDrawerOpen(false)}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-white/70"
                    aria-label="Close profile menu"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="mt-4">
                  <p className="text-lg font-semibold">{workspace.data.profile.fullName}</p>
                  <p className="text-sm text-white/56">{workspace.data.profile.email}</p>
                </div>
                <nav className="mt-6 space-y-1">
                  {PROFILE_SECTIONS.map((section) => {
                    const Icon = section.icon;
                    const isActive = activeSection === section.id;

                    return (
                      <button
                        key={section.id}
                        type="button"
                        onClick={() => goToSection(section.id)}
                        className={cn(
                          "flex min-h-12 w-full items-center gap-4 rounded-lg px-3 text-left text-base transition",
                          isActive ? "bg-lime-300 text-black" : "text-white/82 hover:bg-white/10 hover:text-white"
                        )}
                      >
                        <Icon className="h-5 w-5" />
                        <span className="flex-1">{section.label}</span>
                        {section.id === "rejected" && dismissedCount ? (
                          <span className={cn("rounded-full px-2 py-0.5 text-xs", isActive ? "bg-black/10" : "bg-white/10")}>
                            {dismissedCount}
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </nav>
                <Link href="/dashboard/staff/jobs" className="mt-6 flex min-h-12 items-center gap-3 rounded-lg border border-white/10 px-3 text-white/80">
                  <ChevronLeft className="h-4 w-4" />
                  Back to jobs
                </Link>
              </aside>
            </div>
          ) : null}
        </div>

        <div className="mt-6 flex items-center gap-3 md:hidden">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="inline-flex min-h-12 flex-1 items-center gap-3 rounded-lg border border-white/10 bg-white/[0.04] px-4 text-left text-sm font-semibold text-ink"
          >
            <ActiveSectionIcon className="h-5 w-5 text-lime-300" />
            {activeSectionMeta.label}
          </button>
        </div>

        {activeSection === "overview" ? (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Card className="rounded-lg border-lime-300/20">
              <p className="text-sm text-slate">Overall score</p>
              <p className="mt-2 text-3xl font-semibold text-ink">
                {workspace.data.performanceSummary.overallRating.toFixed(1)}
              </p>
              <p className="mt-2 text-xs text-slate">Rating band {workspace.data.performanceSummary.ratingBand} star</p>
            </Card>
            <Card className="rounded-lg border-cyan-300/20">
              <p className="text-sm text-slate">Applications tracked</p>
              <p className="mt-2 text-3xl font-semibold text-ink">{workspace.data.recentApplications.length}</p>
              <p className="mt-2 text-xs text-slate">Recent role applications and statuses.</p>
            </Card>
            <Card className="rounded-lg border-rose-300/20">
              <p className="text-sm text-slate">Saved and liked</p>
              <p className="mt-2 text-3xl font-semibold text-ink">
                {workspace.data.savedJobs.length + workspace.data.likedJobs.length}
              </p>
              <p className="mt-2 text-xs text-slate">Jobs kept for later review.</p>
            </Card>
            <Card className="rounded-lg border-yellow-300/20">
              <p className="text-sm text-slate">Estimated earnings</p>
              <p className="mt-2 text-3xl font-semibold text-ink">£{acceptedEarnings.toFixed(0)}</p>
              <p className="mt-2 text-xs text-slate">Estimated from accepted jobs, not confirmed payout.</p>
            </Card>
          </div>
        ) : null}

        {activeSection === "applications" ? (
          <Card className="mt-6 rounded-lg">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate">Applications</p>
            <div className="mt-5 space-y-3">
              {workspace.data.recentApplications.map((application) => (
                <div key={application.id} className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-ink">{application.job.title}</p>
                      <p className="text-sm text-slate">
                        {application.organization.name} - {application.event.location} - {formatDate(application.event.eventDate)}
                      </p>
                    </div>
                    <span className="rounded-full bg-lime-300/15 px-3 py-1 text-sm text-lime-200">
                      {application.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ) : null}

        {activeSection === "saved" ? (
          <Card className="mt-6 rounded-lg">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate">Saved and liked jobs</p>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {[...workspace.data.savedJobs, ...workspace.data.likedJobs].map((item) => (
                <JobMiniCard key={`${item.job.id}-${item.isSaved}-${item.isLiked}`} item={item} />
              ))}
              {workspace.data.savedJobs.length + workspace.data.likedJobs.length === 0 ? (
                <p className="text-sm text-slate">Saved and liked jobs will appear here.</p>
              ) : null}
            </div>
          </Card>
        ) : null}

        {activeSection === "rejected" ? (
          <Card className="mt-6 rounded-lg">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate">Rejected</p>
            <h2 className="mt-3 text-2xl font-semibold text-ink">Jobs swiped away</h2>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {workspace.data.dismissedJobs.map((item) => (
                <JobMiniCard
                  key={item.job.id}
                  item={item}
                  action={
                    <Button
                      type="button"
                      variant="secondary"
                      className="min-h-11 gap-2"
                      onClick={async () => {
                        try {
                          await provider.restoreDismissedJob(item.job.id);
                          toast.success("Job restored to your feed.");
                          await workspace.refresh();
                        } catch (error) {
                          toast.error(toDisplayError(error));
                        }
                      }}
                    >
                      <RotateCcw className="h-4 w-4" />
                      Restore
                    </Button>
                  }
                />
              ))}
              {workspace.data.dismissedJobs.length === 0 ? (
                <p className="text-sm text-slate">Jobs you reject from the feed will appear here.</p>
              ) : null}
            </div>
          </Card>
        ) : null}

        {activeSection === "earnings" ? (
          <Card className="mt-6 rounded-lg">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate">Estimated earnings</p>
            <h2 className="mt-3 text-2xl font-semibold text-ink">Accepted work estimate</h2>
            <p className="mt-2 text-sm text-slate">These figures use accepted job hours and rates. They are not confirmed payout records.</p>
            <div className="mt-5 space-y-3">
              {workspace.data.recentApplications
                .filter((application) => application.status === "accepted")
                .map((application) => (
                  <div key={application.id} className="flex items-center justify-between gap-4 rounded-lg border border-white/10 bg-white/[0.03] p-4">
                    <div>
                      <p className="font-semibold text-ink">{application.job.title}</p>
                      <p className="text-sm text-slate">{application.organization.name}</p>
                    </div>
                    <p className="font-semibold text-lime-200">{formatCurrency(getEstimatedApplicationPay(application))}</p>
                  </div>
                ))}
            </div>
          </Card>
        ) : null}

        {activeSection === "messages" ? (
          <MessageWorkspace
            threads={workspace.data.conversations}
            jobs={messagingJobs}
            onSend={async (input) => {
              try {
                await provider.sendConversationMessage(input);
                toast.success("Message sent.");
                await workspace.refresh();
              } catch (error) {
                toast.error(toDisplayError(error));
              }
            }}
          />
        ) : null}

        {activeSection === "profile" ? (
          <Card className="mt-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate">Profile</p>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <Field label="Name">
                <Input value={profileForm.fullName} onChange={(event) => setProfileForm((current) => ({ ...current, fullName: event.target.value }))} />
              </Field>
              <Field label="Phone">
                <Input value={profileForm.phone} onChange={(event) => setProfileForm((current) => ({ ...current, phone: event.target.value }))} />
              </Field>
              <Field label="Headline">
                <Input value={profileForm.headline} onChange={(event) => setProfileForm((current) => ({ ...current, headline: event.target.value }))} />
              </Field>
              <Field label="Base location">
                <Input value={profileForm.baseLocation} onChange={(event) => setProfileForm((current) => ({ ...current, baseLocation: event.target.value }))} />
              </Field>
              <Field label="Preferred roles">
                <Input value={profileForm.preferredRoles} onChange={(event) => setProfileForm((current) => ({ ...current, preferredRoles: event.target.value }))} />
              </Field>
              <Field label="Languages">
                <Input value={profileForm.languages} onChange={(event) => setProfileForm((current) => ({ ...current, languages: event.target.value }))} />
              </Field>
              <Field label="Date of birth">
                <Input type="date" value={profileForm.dateOfBirth} onChange={(event) => setProfileForm((current) => ({ ...current, dateOfBirth: event.target.value }))} />
              </Field>
              <Field label="Picture URL">
                <Input value={profileForm.avatarUrl} onChange={(event) => setProfileForm((current) => ({ ...current, avatarUrl: event.target.value }))} />
              </Field>
              <Field label="Skills" hint="Comma-separated">
                <Input value={profileForm.skills} onChange={(event) => setProfileForm((current) => ({ ...current, skills: event.target.value }))} />
              </Field>
            </div>
            <div className="mt-4">
              <Field label="Details">
                <Textarea value={profileForm.details} onChange={(event) => setProfileForm((current) => ({ ...current, details: event.target.value }))} />
              </Field>
            </div>
            <Button
              className="mt-5 min-h-12 w-full sm:w-auto"
              onClick={async () => {
                try {
                  const payload = updateOperatorProfileSchema.parse({
                    ...profileForm,
                    preferredRoles: profileForm.preferredRoles.split(",").map((item) => item.trim()).filter(Boolean),
                    languages: profileForm.languages.split(",").map((item) => item.trim()).filter(Boolean),
                    skills: profileForm.skills.split(",").map((item) => item.trim()).filter(Boolean)
                  });
                  await provider.updateOperatorProfile(payload);
                  toast.success("Profile updated.");
                  await workspace.refresh();
                } catch (error) {
                  toast.error(toDisplayError(error));
                }
              }}
            >
              Save profile
            </Button>
          </Card>
        ) : null}

        {activeSection === "availability" ? (
          <Card className="mt-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate">Availability</p>
                <h2 className="mt-3 text-2xl font-semibold text-ink">Weekly schedule</h2>
              </div>
              <Button type="button" variant={sameHours ? "accent" : "secondary"} className="min-h-12 w-full sm:w-auto" onClick={() => setSameHours((current) => !current)}>
                {sameHours ? "Same hours on" : "Same hours off"}
              </Button>
            </div>
            <div className="mt-5">
              <div className="flex flex-wrap gap-3">
                {DAY_CIRCLE_ORDER.map((day) => {
                  const rule = availabilityRules.find((item) => item.dayOfWeek === day.day);
                  const isSunday = day.day === 0;
                  const isActive = Boolean(rule?.isAvailable);

                  return (
                    <button
                      key={day.day}
                      type="button"
                      aria-label={`${day.full} availability`}
                      onClick={() =>
                        setAvailabilityRules((current) =>
                          current.map((item) =>
                            item.dayOfWeek === day.day ? { ...item, isAvailable: !item.isAvailable } : item
                          )
                        )
                      }
                      className={cn(
                        "flex h-12 w-12 items-center justify-center rounded-full border text-base font-bold transition sm:h-14 sm:w-14",
                        isActive && isSunday
                          ? "border-black bg-black text-white ring-2 ring-white/20"
                          : isActive
                            ? "border-lime-300 bg-lime-300 text-black"
                            : "border-white/18 bg-white/[0.03] text-slate hover:text-ink"
                      )}
                    >
                      {day.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <Field label="Summary">
                <Input value={availabilitySummary} onChange={(event) => setAvailabilitySummary(event.target.value)} />
              </Field>
              <Field label="Shared start">
                <Input type="time" value={sharedStartTime} onChange={(event) => setSharedStartTime(event.target.value)} />
              </Field>
              <Field label="Shared end">
                <Input type="time" value={sharedEndTime} onChange={(event) => setSharedEndTime(event.target.value)} />
              </Field>
            </div>
            <div className="mt-5 space-y-3">
              {DAY_CIRCLE_ORDER.map((day) => {
                const index = availabilityRules.findIndex((item) => item.dayOfWeek === day.day);
                const rule = availabilityRules[index];

                if (!rule) {
                  return null;
                }

                return (
                  <div key={rule.dayOfWeek} className="grid gap-3 rounded-lg border border-white/10 bg-white/[0.03] px-4 py-4 md:grid-cols-[88px_150px_1fr] md:items-center">
                    <div className="font-medium text-ink">{DAY_LABELS[rule.dayOfWeek]}</div>
                    <button
                      type="button"
                      onClick={() =>
                        setAvailabilityRules((current) =>
                          current.map((item, itemIndex) =>
                            itemIndex === index ? { ...item, isAllDay: !item.isAllDay } : item
                          )
                        )
                      }
                      disabled={!rule.isAvailable}
                      className={cn(
                        "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border px-3 text-sm font-semibold",
                        rule.isAllDay && rule.isAvailable
                          ? "border-lime-300 bg-lime-300 text-black"
                          : "border-white/10 bg-white/[0.03] text-slate",
                        !rule.isAvailable ? "opacity-50" : ""
                      )}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      All day
                    </button>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Input
                        type="time"
                        value={sameHours ? sharedStartTime : rule.startTime ?? ""}
                        disabled={rule.isAllDay || !rule.isAvailable}
                        onChange={(event) => {
                          const value = event.target.value;
                          if (sameHours) {
                            setSharedStartTime(value);
                            setAvailabilityRules((current) =>
                              current.map((item) =>
                                item.isAvailable ? { ...item, startTime: value } : item
                              )
                            );
                            return;
                          }

                          setAvailabilityRules((current) =>
                            current.map((item, itemIndex) =>
                              itemIndex === index ? { ...item, startTime: value } : item
                            )
                          );
                        }}
                      />
                      <Input
                        type="time"
                        value={sameHours ? sharedEndTime : rule.endTime ?? ""}
                        disabled={rule.isAllDay || !rule.isAvailable}
                        onChange={(event) => {
                          const value = event.target.value;
                          if (sameHours) {
                            setSharedEndTime(value);
                            setAvailabilityRules((current) =>
                              current.map((item) =>
                                item.isAvailable ? { ...item, endTime: value } : item
                              )
                            );
                            return;
                          }

                          setAvailabilityRules((current) =>
                            current.map((item, itemIndex) =>
                              itemIndex === index ? { ...item, endTime: value } : item
                            )
                          );
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <Button
              className="mt-5 min-h-12 w-full sm:w-auto"
              onClick={async () => {
                try {
                  const payload = updateOperatorAvailabilitySchema.parse({
                    availabilitySummary,
                    rules: availabilityRules.map((rule) => ({
                      ...rule,
                      startTime: rule.isAllDay ? "" : rule.startTime ?? sharedStartTime,
                      endTime: rule.isAllDay ? "" : rule.endTime ?? sharedEndTime
                    }))
                  });
                  await provider.updateOperatorAvailability(payload);
                  toast.success("Availability updated.");
                  await workspace.refresh();
                } catch (error) {
                  toast.error(toDisplayError(error));
                }
              }}
            >
              Save availability
            </Button>
          </Card>
        ) : null}

        {activeSection === "ratings" ? (
          <Card className="mt-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate">Performance</p>
            <div className="mt-5 space-y-4">
              <PerformanceBar label="Reliability" value={workspace.data.performanceSummary.categoryRatings.reliability} />
              <PerformanceBar label="Professionalism" value={workspace.data.performanceSummary.categoryRatings.professionalism} />
              <PerformanceBar label="Communication" value={workspace.data.performanceSummary.categoryRatings.communication} />
              <PerformanceBar label="Customer service" value={workspace.data.performanceSummary.categoryRatings.customerService} />
              <PerformanceBar label="Pressure handling" value={workspace.data.performanceSummary.categoryRatings.pressureHandling} />
            </div>
            <p className="mt-5 text-sm text-slate">
              Overall {workspace.data.performanceSummary.overallRating.toFixed(1)} - band {workspace.data.performanceSummary.ratingBand} star
            </p>
            {workspace.data.performanceSummary.promotionDue ? (
              <p className="mt-2 text-sm text-emerald-300">
                Promotion is within reach. A high-rated next job should move you up.
              </p>
            ) : null}
            {workspace.data.performanceSummary.demotionRisk ? (
              <p className="mt-2 text-sm text-amber-300">
                Recent reviews have put you near a lower band threshold.
              </p>
            ) : null}
          </Card>
        ) : null}

        {activeSection === "marketing" ? (
          <Card className="mt-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate">Email preferences</p>
            <div className="mt-5 space-y-4">
              <div className="flex items-start gap-3">
                <Checkbox
                  checked={marketingConsent.newsletterConsent}
                  onChange={(event) =>
                    setMarketingConsent((current) => ({ ...current, newsletterConsent: event.target.checked }))
                  }
                />
                <div className="space-y-2">
                  <p className="font-medium text-ink">News and newsletters</p>
                  <p className="text-sm text-slate">Athena bulletins, service news, and editorial updates.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Checkbox
                  checked={marketingConsent.offersConsent}
                  onChange={(event) =>
                    setMarketingConsent((current) => ({ ...current, offersConsent: event.target.checked }))
                  }
                />
                <div className="space-y-2">
                  <p className="font-medium text-ink">Offers and promotions</p>
                  <p className="text-sm text-slate">Campaign-led offers and commercial promotions.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Checkbox
                  checked={marketingConsent.productUpdatesConsent}
                  onChange={(event) =>
                    setMarketingConsent((current) => ({
                      ...current,
                      productUpdatesConsent: event.target.checked
                    }))
                  }
                />
                <div className="space-y-2">
                  <p className="font-medium text-ink">Platform updates</p>
                  <p className="text-sm text-slate">
                    Non-essential feature releases and product improvement announcements.
                  </p>
                </div>
              </div>
            </div>
            <Button
              className="mt-5 min-h-12 w-full sm:w-auto"
              variant="secondary"
              onClick={async () => {
                try {
                  const payload = updateMarketingPreferencesSchema.parse(marketingConsent);
                  await provider.updateMarketingPreferences(payload);
                  toast.success("Email preferences updated.");
                  await workspace.refresh();
                } catch (error) {
                  toast.error(toDisplayError(error));
                }
              }}
            >
              Save email preferences
            </Button>
          </Card>
        ) : null}

        {activeSection === "security" ? (
          <Card className="mt-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate">Security</p>
            <div className="mt-5 space-y-4">
              <Field label="Email">
                <Input value={email} onChange={(event) => setEmail(event.target.value)} />
              </Field>
              <Button
                className="min-h-12 w-full sm:w-auto"
                onClick={async () => {
                  try {
                    const payload = updateEmailSchema.parse({ email });
                    await provider.updateEmail(payload);
                    toast.success("Email updated.");
                  } catch (error) {
                    toast.error(toDisplayError(error));
                  }
                }}
              >
                Change email
              </Button>
              <Field label="New password">
                <PasswordField value={password} onChange={(event) => setPassword(event.target.value)} showChecklist />
              </Field>
              <Field label="Confirm password">
                <PasswordField
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                />
              </Field>
              <Button
                variant="secondary"
                className="min-h-12 w-full sm:w-auto"
                onClick={async () => {
                  try {
                    const payload = updatePasswordSchema.parse({ password, confirmPassword });
                    await provider.updatePassword(payload);
                    setPassword("");
                    setConfirmPassword("");
                    toast.success("Password updated.");
                  } catch (error) {
                    toast.error(toDisplayError(error));
                  }
                }}
              >
                Change password
              </Button>
            </div>
          </Card>
        ) : null}

        {activeSection === "payments" ? (
          <Card className="mt-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate">Payments</p>
            <h2 className="mt-3 text-2xl font-semibold text-ink">Stripe foundation</h2>
            <p className="mt-3 text-sm text-slate">
              Provider: {workspace.data.paymentProfile.provider} - status {workspace.data.paymentProfile.onboardingStatus.replace(/_/g, " ")}
            </p>
            <p className="mt-2 text-sm text-slate">
              Details submitted: {workspace.data.paymentProfile.detailsSubmitted ? "Yes" : "No"} - payouts enabled: {workspace.data.paymentProfile.payoutsEnabled ? "Yes" : "No"}
            </p>
            <p className="mt-4 text-sm text-slate">
              Raw bank or card details are not stored in this phase. This section is the payout-readiness foundation for Stripe-backed onboarding.
            </p>
          </Card>
        ) : null}

        {activeSection === "notifications" ? (
          <div className="mt-6">
            <NotificationsList notifications={workspace.data.notifications} title="Inbox" />
          </div>
        ) : null}

        <StaffBottomNav activeSection={activeSection} />
      </DashboardShell>
    </main>
  );
}
