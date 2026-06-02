"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { SiteHeader } from "@/components/layout/site-header";
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
import { Textarea } from "@/components/ui/textarea";
import { useQueryState } from "@/features/app/use-query-state";
import { useStaffBook } from "@/features/app/use-staffbook";
import { toDisplayError } from "@/lib/errors";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  updateEmailSchema,
  updateMarketingPreferencesSchema,
  updateOperatorAvailabilitySchema,
  updateOperatorProfileSchema,
  updatePasswordSchema
} from "@/lib/validation/schemas";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const PROFILE_SECTIONS = [
  "Overview",
  "Applications",
  "Saved & liked",
  "Earnings",
  "Ratings & reviews",
  "Availability",
  "Profile",
  "Messages",
  "Notifications",
  "Payments",
  "Security",
  "Marketing"
] as const;

type ProfileSection = (typeof PROFILE_SECTIONS)[number];

function getEstimatedApplicationPay(application: { job: { shiftStart: string; shiftEnd: string; payRate: number } }) {
  const hours = Math.max(
    (new Date(application.job.shiftEnd).getTime() - new Date(application.job.shiftStart).getTime()) / (1000 * 60 * 60),
    0
  );

  return hours * application.job.payRate;
}

export function OperatorProfileWorkspace() {
  const { provider, session, loading } = useStaffBook();
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
  const [activeSection, setActiveSection] = useState<ProfileSection>("Overview");

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
      avatarUrl: workspace.data.operatorProfile.avatarUrl ?? "",
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

  return (
    <main>
      <SiteHeader />
      <DashboardShell
        eyebrow="Operator profile"
        title={workspace.data.profile.fullName}
        description="Update your profile, control your weekly availability, review your category performance, and manage security and payout readiness."
      >
        <div className="-mx-4 mb-6 overflow-x-auto px-4 pb-2">
          <div className="flex min-w-max gap-2">
            {PROFILE_SECTIONS.map((section) => (
              <button
                key={section}
                type="button"
                onClick={() => setActiveSection(section)}
                className={`min-h-11 rounded-full px-4 py-2 text-sm font-medium transition ${
                  activeSection === section
                    ? "bg-lime-300 text-canvas"
                    : "border border-white/10 bg-white/[0.03] text-slate hover:text-ink"
                }`}
              >
                {section}
              </button>
            ))}
          </div>
        </div>

        {activeSection === "Overview" ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Card className="rounded-lg border-lime-300/20">
              <p className="text-sm text-slate">Overall score</p>
              <p className="mt-2 text-3xl font-semibold text-ink">
                {workspace.data.performanceSummary.overallRating.toFixed(1)}
              </p>
              <p className="mt-2 text-xs text-slate">Rating band {workspace.data.performanceSummary.ratingBand}★</p>
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
              <p className="mt-2 text-3xl font-semibold text-ink">
                £
                {workspace.data.recentApplications
                  .filter((application) => application.status === "accepted")
                  .reduce((sum, application) => sum + getEstimatedApplicationPay(application), 0)
                  .toFixed(0)}
              </p>
              <p className="mt-2 text-xs text-slate">Estimated from accepted jobs, not confirmed payout.</p>
            </Card>
          </div>
        ) : null}

        {activeSection === "Applications" ? (
          <Card className="mt-6 rounded-lg">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate">Applications</p>
            <div className="mt-5 space-y-3">
              {workspace.data.recentApplications.map((application) => (
                <div key={application.id} className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-ink">{application.job.title}</p>
                      <p className="text-sm text-slate">
                        {application.organization.name} • {application.event.location} • {formatDate(application.event.eventDate)}
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

        {activeSection === "Saved & liked" ? (
          <Card className="mt-6 rounded-lg">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate">Saved and liked jobs</p>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {[...workspace.data.savedJobs, ...workspace.data.likedJobs].map((item) => (
                <div key={`${item.job.id}-${item.isSaved}-${item.isLiked}`} className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                  <p className="font-semibold text-ink">{item.job.title}</p>
                  <p className="mt-1 text-sm text-slate">
                    {item.job.organization.name} • {formatCurrency(item.job.payRate)}/hr
                  </p>
                </div>
              ))}
              {workspace.data.savedJobs.length + workspace.data.likedJobs.length === 0 ? (
                <p className="text-sm text-slate">Saved and liked jobs will appear here.</p>
              ) : null}
            </div>
          </Card>
        ) : null}

        {activeSection === "Earnings" ? (
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

        {activeSection === "Messages" ? (
          <Card className="mt-6 rounded-lg">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate">Messages</p>
            <div className="mt-5 space-y-3">
              {workspace.data.conversations.length === 0 ? (
                <p className="text-sm text-slate">Company messages and event communications will appear here.</p>
              ) : (
                workspace.data.conversations.map((thread) => (
                  <div key={thread.id} className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold text-ink">{thread.subject}</p>
                      {thread.unreadCount ? <span className="rounded-full bg-cyan-300 px-2 py-1 text-xs text-canvas">{thread.unreadCount}</span> : null}
                    </div>
                    <p className="mt-1 text-sm text-slate">{thread.organization.name}</p>
                    <p className="mt-3 text-sm text-slate">{thread.messages.at(-1)?.body ?? "No messages yet."}</p>
                  </div>
                ))
              )}
            </div>
          </Card>
        ) : null}

        {(["Profile", "Availability", "Ratings & reviews", "Marketing", "Security", "Payments", "Notifications"] as ProfileSection[]).includes(activeSection) ? (
        <div className="mt-6 grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-6">
            {activeSection === "Profile" ? <Card>
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
            </Card> : null}

            {activeSection === "Availability" ? <Card>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate">Availability</p>
                  <h2 className="mt-3 text-2xl font-semibold text-ink">Weekly schedule</h2>
                </div>
                <Button type="button" variant={sameHours ? "accent" : "secondary"} className="min-h-12 w-full sm:w-auto" onClick={() => setSameHours((current) => !current)}>
                  {sameHours ? "Same hours on" : "Same hours off"}
                </Button>
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
                {availabilityRules.map((rule, index) => (
                  <div key={rule.dayOfWeek} className="grid gap-3 rounded-[22px] border border-white/10 bg-white/[0.03] px-4 py-4 md:grid-cols-[90px_110px_1fr_1fr] md:items-center">
                    <div className="font-medium text-ink">{DAY_LABELS[rule.dayOfWeek]}</div>
                    <Button
                      type="button"
                      variant={rule.isAvailable ? "accent" : "secondary"}
                      className="min-h-12"
                      onClick={() =>
                        setAvailabilityRules((current) =>
                          current.map((item, itemIndex) =>
                            itemIndex === index ? { ...item, isAvailable: !item.isAvailable } : item
                          )
                        )
                      }
                    >
                      {rule.isAvailable ? "Available" : "Off"}
                    </Button>
                    <Button
                      type="button"
                      variant={rule.isAllDay ? "accent" : "secondary"}
                      className="min-h-12"
                      onClick={() =>
                        setAvailabilityRules((current) =>
                          current.map((item, itemIndex) =>
                            itemIndex === index ? { ...item, isAllDay: !item.isAllDay } : item
                          )
                        )
                      }
                    >
                      All day / anytime
                    </Button>
                    <div className="grid gap-3 md:grid-cols-2">
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
                ))}
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
            </Card> : null}
          </div>

          <div className="space-y-6">
            {activeSection === "Ratings & reviews" ? <Card>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate">Performance</p>
              <div className="mt-5 space-y-4">
                <PerformanceBar label="Reliability" value={workspace.data.performanceSummary.categoryRatings.reliability} />
                <PerformanceBar label="Professionalism" value={workspace.data.performanceSummary.categoryRatings.professionalism} />
                <PerformanceBar label="Communication" value={workspace.data.performanceSummary.categoryRatings.communication} />
                <PerformanceBar label="Customer service" value={workspace.data.performanceSummary.categoryRatings.customerService} />
                <PerformanceBar label="Pressure handling" value={workspace.data.performanceSummary.categoryRatings.pressureHandling} />
              </div>
              <p className="mt-5 text-sm text-slate">
                Overall {workspace.data.performanceSummary.overallRating.toFixed(1)} • band {workspace.data.performanceSummary.ratingBand}★
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
            </Card> : null}

            {activeSection === "Marketing" ? <Card>
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
            </Card> : null}

            {activeSection === "Security" ? <Card>
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
            </Card> : null}

            {activeSection === "Payments" ? <Card>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate">Payments</p>
              <h2 className="mt-3 text-2xl font-semibold text-ink">Stripe foundation</h2>
              <p className="mt-3 text-sm text-slate">
                Provider: {workspace.data.paymentProfile.provider} • status {workspace.data.paymentProfile.onboardingStatus.replace(/_/g, " ")}
              </p>
              <p className="mt-2 text-sm text-slate">
                Details submitted: {workspace.data.paymentProfile.detailsSubmitted ? "Yes" : "No"} • payouts enabled: {workspace.data.paymentProfile.payoutsEnabled ? "Yes" : "No"}
              </p>
              <p className="mt-4 text-sm text-slate">
                Raw bank or card details are not stored in this phase. This section is the payout-readiness foundation for Stripe-backed onboarding.
              </p>
            </Card> : null}

            {activeSection === "Notifications" ? <NotificationsList notifications={workspace.data.notifications} title="Inbox" /> : null}
          </div>
        </div>
        ) : null}
      </DashboardShell>
    </main>
  );
}
