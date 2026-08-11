"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Building2, ShieldCheck, Ticket, UserRound, Zap } from "lucide-react";
import { SiteHeader } from "@/components/layout/site-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PasswordChecklist, PasswordField } from "@/components/ui/password-field";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useStaffBook } from "@/features/app/use-staffbook";
import { BRAND } from "@/lib/brand";
import { toDisplayError } from "@/lib/errors";
import { PASSWORD_HINT } from "@/lib/validation/schemas";
import { organiserSignupSchema, staffSignupSchema } from "@/lib/validation/schemas";

const STAFF_DISCIPLINE_OPTIONS = [
  "Host",
  "Event Staff",
  "Guest Services",
  "VIP",
  "Ticket Scanning",
  "Access Control",
  "Accreditation",
  "Supervisor",
  "Runner",
  "Backstage Support",
  "Production Assistant",
  "Brand Activation"
] as const;

const AVAILABILITY_DAYS = [
  { key: "monday", label: "Monday", shortLabel: "Mon" },
  { key: "tuesday", label: "Tuesday", shortLabel: "Tue" },
  { key: "wednesday", label: "Wednesday", shortLabel: "Wed" },
  { key: "thursday", label: "Thursday", shortLabel: "Thu" },
  { key: "friday", label: "Friday", shortLabel: "Fri" },
  { key: "saturday", label: "Saturday", shortLabel: "Sat" },
  { key: "sunday", label: "Sunday", shortLabel: "Sun" }
] as const;

type AvailabilityDayKey = (typeof AVAILABILITY_DAYS)[number]["key"];

const DAY_OF_WEEK_INDEX: Record<AvailabilityDayKey, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6
};

type AvailabilityDayState = {
  key: AvailabilityDayKey;
  label: string;
  shortLabel: string;
  selected: boolean;
  startTime: string;
  endTime: string;
};

function createAvailabilityState(): AvailabilityDayState[] {
  return AVAILABILITY_DAYS.map((day) => ({
    ...day,
    selected: false,
    startTime: "",
    endTime: ""
  }));
}

function buildAvailabilitySummary(days: AvailabilityDayState[], useSharedHours: boolean, sharedStart: string, sharedEnd: string) {
  const selectedDays = days.filter((day) => day.selected);

  if (selectedDays.length === 0) {
    throw new Error("Select at least one day of availability.");
  }

  if (useSharedHours) {
    if (!sharedStart || !sharedEnd) {
      throw new Error("Add a time range for the selected days.");
    }

    return `${selectedDays.map((day) => day.shortLabel).join(", ")} • ${sharedStart}-${sharedEnd}`;
  }

  for (const day of selectedDays) {
    if (!day.startTime || !day.endTime) {
      throw new Error(`Add a start and end time for ${day.label}.`);
    }
  }

  return selectedDays.map((day) => `${day.shortLabel} ${day.startTime}-${day.endTime}`).join("; ");
}

function buildAvailabilityRules(days: AvailabilityDayState[], useSharedHours: boolean, sharedStart: string, sharedEnd: string) {
  return days.map((day) => {
    const startTime = useSharedHours ? sharedStart : day.startTime;
    const endTime = useSharedHours ? sharedEnd : day.endTime;

    return {
      dayOfWeek: DAY_OF_WEEK_INDEX[day.key],
      isAvailable: day.selected,
      isAllDay: false,
      startTime: day.selected ? startTime : "",
      endTime: day.selected ? endTime : ""
    };
  });
}

function requiredLabel(label: string) {
  return (
    <>
      {label} <span className="text-red-500">*</span>
    </>
  );
}

export function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { provider, refreshSession } = useStaffBook();
  const [role, setRole] = useState<"organiser" | "staff">(
    searchParams.get("type") === "field-team" ? "staff" : "organiser"
  );
  const [selectedDisciplines, setSelectedDisciplines] = useState<string[]>([]);
  const [availabilityDays, setAvailabilityDays] = useState<AvailabilityDayState[]>(() => createAvailabilityState());
  const [useSharedHours, setUseSharedHours] = useState(true);
  const [sharedStartTime, setSharedStartTime] = useState("");
  const [sharedEndTime, setSharedEndTime] = useState("");
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    companyName: "",
    phone: "",
    location: "",
    drives: "" as "" | "yes" | "no",
    skills: "",
    bio: "",
    availability: "",
    newsletterConsent: false
  });
  const [submitting, setSubmitting] = useState(false);

  const update = (key: keyof typeof form, value: string) =>
    setForm((current) => ({ ...current, [key]: value }));

  function toggleDiscipline(discipline: string, checked: boolean) {
    setSelectedDisciplines((current) =>
      checked ? [...current, discipline] : current.filter((entry) => entry !== discipline)
    );
  }

  function updateAvailabilityDay(dayKey: AvailabilityDayKey, patch: Partial<AvailabilityDayState>) {
    setAvailabilityDays((current) =>
      current.map((day) => (day.key === dayKey ? { ...day, ...patch } : day))
    );
  }

  const allAvailabilityDaysSelected = availabilityDays.every((day) => day.selected);

  useEffect(() => {
    setRole(searchParams.get("type") === "field-team" ? "staff" : "organiser");
  }, [searchParams]);

  function toggleAllAvailabilityDays(checked: boolean) {
    setAvailabilityDays((current) =>
      current.map((day) => ({
        ...day,
        selected: checked
      }))
    );
  }

  return (
    <main className={role === "staff" ? "theme-dark min-h-screen bg-black" : ""}>
      <SiteHeader />
      <section
        className={
          role === "staff"
            ? "min-h-[calc(100svh-72px)] bg-[radial-gradient(circle_at_15%_12%,rgba(190,242,100,0.18),transparent_0_22%),linear-gradient(180deg,#050607,#0b1017)] px-4 py-6 sm:min-h-[calc(100svh-80px)] sm:px-6 sm:py-10"
            : "flex min-h-[calc(100svh-72px)] items-center justify-center px-4 py-8 sm:min-h-[calc(100svh-80px)] sm:px-6 sm:py-12"
        }
      >
        <Card className={role === "staff" ? "mx-auto w-full max-w-7xl overflow-hidden rounded-[24px] border-white/12 bg-[#071018]/95 p-0 shadow-[0_34px_120px_rgba(0,0,0,0.55)] sm:rounded-[28px] lg:grid lg:grid-cols-[1.05fr_1fr]" : "w-full max-w-5xl"}>
            {role === "staff" ? (
              <div className="relative hidden min-h-[760px] overflow-hidden border-r border-white/12 lg:block">
                <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.78),rgba(0,0,0,0.24)),url('https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1500&q=80')] bg-cover bg-center" />
                <div className="relative z-10 flex h-full flex-col justify-between p-12">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-lime-300">Live events. Real people.</p>
                    <h1 className="mt-6 max-w-md text-6xl font-semibold leading-[0.95] text-white">
                      Your next role <span className="text-lime-300">starts here.</span>
                    </h1>
                    <p className="mt-6 max-w-md text-lg leading-8 text-white/72">
                      Join ATHENA PRO and get matched to paid event roles that fit your skills and availability.
                    </p>
                    <div className="mt-10 space-y-7">
                      {[
                        { Icon: Ticket, title: "Paid roles at top events", detail: "Festivals, stadiums, and more." },
                        { Icon: UserRound, title: "Build your reputation", detail: "Get rated. Get recommended." },
                        { Icon: Zap, title: "Fast and flexible", detail: "Work when it works for you." }
                      ].map(({ Icon, title, detail }) => (
                        <div key={title} className="flex gap-5">
                          <Icon className="mt-1 h-9 w-9 text-lime-300" />
                          <div>
                            <p className="font-semibold text-white">{title}</p>
                            <p className="mt-1 text-sm text-white/62">{detail}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-0 overflow-hidden rounded-lg border border-white/12">
                    <Image src="https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=700&q=80" alt="Festival scanner wristband" width={700} height={320} sizes="33vw" className="h-40 w-full object-cover" />
                    <Image src="https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=700&q=80" alt="Live stage at night" width={700} height={320} sizes="33vw" className="h-40 w-full object-cover" />
                    <Image src="https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=700&q=80" alt="Supervisor at a live event" width={700} height={320} sizes="33vw" className="h-40 w-full object-cover" />
                  </div>
                  <div className="mt-8 flex items-center gap-4 border-t border-white/12 pt-8">
                    <ShieldCheck className="h-10 w-10 text-lime-300" />
                    <p className="max-w-[12rem] text-sm text-white/62">Trusted by leading event organisers across the UK.</p>
                    <p className="ml-auto text-sm font-semibold uppercase tracking-[0.14em] text-white/45">Creamfields</p>
                    <p className="text-sm font-semibold uppercase tracking-[0.14em] text-white/45">BST</p>
                  </div>
                </div>
              </div>
            ) : null}
            <div className={role === "staff" ? "p-4 sm:p-8 lg:p-12" : ""}>
          {role === "staff" ? (
            <div className="mb-6 overflow-hidden rounded-[18px] border border-white/12 lg:hidden">
              <div className="min-h-[180px] bg-[linear-gradient(180deg,rgba(0,0,0,0.08),rgba(0,0,0,0.78)),url('https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1100&q=80')] bg-cover bg-center p-5">
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-lime-300">Live events. Real people.</p>
                <h2 className="mt-12 max-w-xs text-3xl font-semibold leading-tight text-white">
                  Your next role <span className="text-lime-300">starts here.</span>
                </h2>
              </div>
            </div>
          ) : null}
          <h1 className="text-balance font-display text-3xl font-semibold tracking-[-0.03em] text-ink sm:text-4xl">
            {role === "organiser" ? `Company access to ${BRAND.name}` : "Field-team sign up"}
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate">
            {role === "organiser"
              ? "Company accounts post jobs, manage applications, message field team, and track event delivery."
              : <>Create your profile to <span className="text-lime-300">apply for roles</span> and start working events.</>}
          </p>
          {role === "staff" ? (
            <div className="mt-5 grid grid-cols-5 gap-2 text-center text-[10px] font-semibold uppercase tracking-[0.12em] text-white/58 lg:hidden">
              {["Account", "Profile", "Skills", "Time", "Go"].map((step, index) => (
                <span key={step} className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-2">
                  {index + 1}. {step}
                </span>
              ))}
            </div>
          ) : null}
          <div className="mt-6 grid overflow-hidden rounded-lg border border-white/10 sm:grid-cols-2">
            <Link href="/auth/signup?type=field-team">
              <Button type="button" variant="secondary" className={`min-h-12 w-full rounded-none border-0 py-4 ${role === "staff" ? "bg-white/[0.03] text-white ring-0 shadow-[inset_0_-2px_0_#bef264]" : ""}`}>
                <UserRound className="mr-2 h-4 w-4" />
                Field-team account
              </Button>
            </Link>
            <Link href="/auth/signup?type=company">
              <Button type="button" variant="secondary" className={`min-h-12 w-full rounded-none border-0 py-4 ${role === "organiser" ? "bg-white/[0.03] text-white ring-0 shadow-[inset_0_-2px_0_#fb7185]" : ""}`}>
                <Building2 className="mr-2 h-4 w-4" />
                Company account
              </Button>
            </Link>
            </div>
          <form
            className="mt-6 space-y-4 sm:mt-8"
            onSubmit={async (event) => {
              event.preventDefault();
              try {
                setSubmitting(true);
                if (role === "organiser") {
                  const payload = organiserSignupSchema.parse({
                    role,
                    fullName: form.fullName,
                    email: form.email,
                    password: form.password,
                    confirmPassword: form.confirmPassword,
                    companyName: form.companyName,
                    newsletterConsent: form.newsletterConsent
                  });
                  await provider.signUpOrganiser(payload);
                  await refreshSession();
                  toast.success("Company workspace created.");
                  router.push("/dashboard/organiser");
                } else {
                  if (selectedDisciplines.length === 0) {
                    throw new Error("Select at least one discipline.");
                  }

                  const availability = buildAvailabilitySummary(
                    availabilityDays,
                    useSharedHours,
                    sharedStartTime,
                    sharedEndTime
                  );
                  const availabilityRules = buildAvailabilityRules(
                    availabilityDays,
                    useSharedHours,
                    sharedStartTime,
                    sharedEndTime
                  );
                  const payload = staffSignupSchema.parse({
                    role,
                    fullName: form.fullName,
                    email: form.email,
                    password: form.password,
                    confirmPassword: form.confirmPassword,
                    phone: form.phone,
                    location: form.location,
                    canDrive:
                      form.drives === "yes"
                        ? true
                        : form.drives === "no"
                          ? false
                          : (() => {
                              throw new Error("Select whether you drive.");
                            })(),
                    skills: selectedDisciplines.join(", "),
                    bio: form.bio,
                    availability,
                    availabilityRules,
                    newsletterConsent: form.newsletterConsent
                  });
                  await provider.signUpStaff(payload);
                  await refreshSession();
                  toast.success("Field-team profile created.");
                  router.push("/dashboard/staff");
                }
              } catch (error) {
                toast.error(toDisplayError(error));
              } finally {
                setSubmitting(false);
              }
            }}
          >
            <div className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4 sm:p-5">
              <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-lime-300">1. Account</p>
            <div className="grid items-start gap-5 lg:grid-cols-2">
              <Field label={requiredLabel("Full name")}>
                <Input value={form.fullName} onChange={(event) => update("fullName", event.target.value)} />
              </Field>
              <Field label={requiredLabel("Email")}>
                <Input type="email" value={form.email} onChange={(event) => update("email", event.target.value)} />
              </Field>
              <div className="space-y-4">
                <Field label={requiredLabel("Password")}>
                  <PasswordField
                    value={form.password}
                    onChange={(event) => update("password", event.target.value)}
                  />
                </Field>
                <Field label={requiredLabel("Confirm password")}>
                  <PasswordField
                    value={form.confirmPassword}
                    onChange={(event) => update("confirmPassword", event.target.value)}
                  />
                </Field>
                <PasswordChecklist value={form.password} />
                <p className="text-xs text-slate/85">{PASSWORD_HINT}</p>
              </div>
            </div>
            </div>

            {role === "organiser" ? (
              <Field label={requiredLabel("Company name")}>
                <Input value={form.companyName} onChange={(event) => update("companyName", event.target.value)} />
              </Field>
            ) : (
              <div className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4 sm:p-5">
                <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-lime-300">2. Profile</p>
              <div className="grid gap-5 md:grid-cols-2">
                <Field label={requiredLabel("Phone number")}>
                  <Input value={form.phone} onChange={(event) => update("phone", event.target.value)} />
                </Field>
                <Field label={requiredLabel("Location")}>
                  <Input
                    value={form.location}
                    onChange={(event) => update("location", event.target.value)}
                    placeholder="London, Manchester"
                  />
                </Field>
                <Field label={requiredLabel("Do you drive?")}>
                  <Select value={form.drives} onChange={(event) => update("drives", event.target.value)}>
                    <option value="">Select one</option>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </Select>
                </Field>
                <Field
                  label={requiredLabel("Profile summary")}
                  hint="A concise note that helps companies understand your live-event fit."
                >
                  <Textarea value={form.bio} onChange={(event) => update("bio", event.target.value)} />
                </Field>
                <div className="md:col-span-2">
                  <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-lime-300">3. Disciplines</p>
                  <Field
                    label={requiredLabel("Disciplines")}
                    hint="Select every field discipline you want surfaced in matching."
                  >
                    <div className="grid gap-3 rounded-[18px] border border-white/[0.08] bg-black/20 p-4 sm:grid-cols-2 lg:grid-cols-3">
                      {STAFF_DISCIPLINE_OPTIONS.map((discipline) => (
                        <label key={discipline} className="flex min-h-11 items-center gap-3 text-sm text-slate">
                          <Checkbox
                            checked={selectedDisciplines.includes(discipline)}
                            onChange={(event) => toggleDiscipline(discipline, event.target.checked)}
                          />
                          <span>{discipline}</span>
                        </label>
                      ))}
                    </div>
                  </Field>
                </div>
                <div className="md:col-span-2">
                  <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-lime-300">4. Availability</p>
                  <Field
                    label={requiredLabel("Availability")}
                    hint="Choose your working days, then set shared hours or day-specific hours."
                  >
                    <div className="space-y-4 rounded-[18px] border border-white/[0.08] bg-black/20 p-4">
                      <label className="flex min-h-11 items-center gap-3 text-sm text-slate">
                        <Checkbox
                          checked={allAvailabilityDaysSelected}
                          onChange={(event) => toggleAllAvailabilityDays(event.target.checked)}
                        />
                        <span>Select all days</span>
                      </label>

                      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
                        {availabilityDays.map((day) => (
                          <label
                            key={day.key}
                            className={`flex min-h-12 items-center gap-3 rounded-[16px] border px-3 py-3 text-sm transition ${
                              day.selected
                                ? "border-white/16 bg-white/[0.05] text-ink"
                                : "border-white/[0.08] bg-transparent text-slate"
                            }`}
                          >
                            <Checkbox
                              checked={day.selected}
                              onChange={(event) =>
                                updateAvailabilityDay(day.key, {
                                  selected: event.target.checked
                                })
                              }
                            />
                            <span>{day.label}</span>
                          </label>
                        ))}
                      </div>

                      <label className="flex min-h-11 items-center gap-3 text-sm text-slate">
                        <Checkbox
                          checked={useSharedHours}
                          onChange={(event) => setUseSharedHours(event.target.checked)}
                        />
                        <span>Use one time range for all selected days</span>
                      </label>

                      {useSharedHours ? (
                        <div className="grid gap-4 md:grid-cols-2">
                          <Field label="Start time">
                            <Input
                              type="time"
                              value={sharedStartTime}
                              onChange={(event) => setSharedStartTime(event.target.value)}
                            />
                          </Field>
                          <Field label="End time">
                            <Input
                              type="time"
                              value={sharedEndTime}
                              onChange={(event) => setSharedEndTime(event.target.value)}
                            />
                          </Field>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {availabilityDays
                            .filter((day) => day.selected)
                            .map((day) => (
                              <div
                                key={day.key}
                                className="grid gap-4 rounded-[16px] border border-white/[0.08] bg-white/[0.02] px-4 py-4 md:grid-cols-[minmax(0,140px)_1fr_1fr]"
                              >
                                <div className="flex items-center text-sm font-medium text-ink">{day.label}</div>
                                <Field label="Start time">
                                  <Input
                                    type="time"
                                    value={day.startTime}
                                    onChange={(event) =>
                                      updateAvailabilityDay(day.key, { startTime: event.target.value })
                                    }
                                  />
                                </Field>
                                <Field label="End time">
                                  <Input
                                    type="time"
                                    value={day.endTime}
                                    onChange={(event) =>
                                      updateAvailabilityDay(day.key, { endTime: event.target.value })
                                    }
                                  />
                                </Field>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  </Field>
                </div>
              </div>
              </div>
            )}

            <label className="flex min-h-12 items-start gap-3 rounded-[18px] border border-white/[0.08] bg-white/[0.03] px-4 py-4">
              <Checkbox
                checked={form.newsletterConsent}
                onChange={(event) =>
                  setForm((current) => ({ ...current, newsletterConsent: event.target.checked }))
                }
              />
              <span className="text-sm leading-6 text-slate">
                I want Athena Pro newsletters and job updates.
              </span>
            </label>

            <Button
              type="submit"
              className={role === "staff" ? "min-h-12 w-full bg-lime-300 text-black hover:bg-lime-200" : "min-h-12 w-full"}
              disabled={submitting}
            >
              {submitting ? "Creating access..." : role === "organiser" ? "Request access" : "Create field-team profile"}
            </Button>
          </form>
          </div>
        </Card>
      </section>
    </main>
  );
}
