"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
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
  const { provider, refreshSession } = useStaffBook();
  const [role, setRole] = useState<"organiser" | "staff">("organiser");
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

  function toggleAllAvailabilityDays(checked: boolean) {
    setAvailabilityDays((current) =>
      current.map((day) => ({
        ...day,
        selected: checked
      }))
    );
  }

  return (
    <main>
      <SiteHeader />
      <section className="flex min-h-[calc(100svh-72px)] items-center justify-center px-4 py-8 sm:min-h-[calc(100svh-80px)] sm:px-6 sm:py-12">
        <Card className="w-full max-w-5xl">
          <h1 className="text-balance font-display text-3xl font-semibold tracking-[-0.05em] text-ink sm:text-4xl">
            Request access to {BRAND.name}
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate">
            Company accounts post jobs. Field-team accounts find and manage work.
          </p>
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
            <div className="grid items-start gap-5 lg:grid-cols-2">
              <Field label="Access type">
                <Select value={role} onChange={(event) => setRole(event.target.value as "organiser" | "staff")}>
                  <option value="organiser">Company</option>
                  <option value="staff">Field Team</option>
                </Select>
              </Field>
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

            {role === "organiser" ? (
              <Field label={requiredLabel("Company name")}>
                <Input value={form.companyName} onChange={(event) => update("companyName", event.target.value)} />
              </Field>
            ) : (
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
                  <Field
                    label={requiredLabel("Disciplines")}
                    hint="Select every field discipline you want surfaced in matching."
                  >
                    <div className="grid gap-3 rounded-[18px] border border-white/[0.08] bg-white/[0.02] p-4 sm:grid-cols-2 lg:grid-cols-3">
                      {STAFF_DISCIPLINE_OPTIONS.map((discipline) => (
                        <label key={discipline} className="flex items-center gap-3 text-sm text-slate">
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
                  <Field
                    label={requiredLabel("Availability")}
                    hint="Choose your working days, then set shared hours or day-specific hours."
                  >
                    <div className="space-y-4 rounded-[18px] border border-white/[0.08] bg-white/[0.02] p-4">
                      <label className="flex items-center gap-3 text-sm text-slate">
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
                            className={`flex items-center gap-3 rounded-[16px] border px-3 py-3 text-sm transition ${
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

                      <label className="flex items-center gap-3 text-sm text-slate">
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
            )}

            <label className="flex items-start gap-3 rounded-[18px] border border-white/[0.08] bg-white/[0.02] px-4 py-4">
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

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Creating access..." : role === "organiser" ? "Request access" : "Create field-team profile"}
            </Button>
          </form>
        </Card>
      </section>
    </main>
  );
}
