"use client";

import { Eye, EyeOff } from "lucide-react";
import { useMemo, useState } from "react";
import { PASSWORD_REQUIREMENTS, evaluatePasswordRequirements } from "@/lib/validation/password";
import { cn } from "@/lib/utils";

type PasswordFieldProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> & {
  showChecklist?: boolean;
};

export function PasswordField({
  className,
  value,
  showChecklist = false,
  ...props
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const passwordValue = typeof value === "string" ? value : "";
  const requirements = useMemo(
    () => (showChecklist ? evaluatePasswordRequirements(passwordValue) : []),
    [passwordValue, showChecklist]
  );

  return (
    <div className="space-y-3">
      <div className="relative">
        <input
          {...props}
          type={visible ? "text" : "password"}
          value={value}
          className={cn(
            "h-12 w-full rounded-[18px] border border-line/70 bg-surfaceRaised/75 px-4 pr-12 text-sm text-ink outline-none transition placeholder:text-slate/70 focus:border-accent focus:ring-4 focus:ring-accent/10",
            className
          )}
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          className="absolute right-3 top-1/2 inline-flex -translate-y-1/2 items-center justify-center rounded-full p-1 text-slate transition hover:text-ink"
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {showChecklist ? <PasswordChecklist value={passwordValue} requirements={requirements} /> : null}
    </div>
  );
}

export function PasswordChecklist({
  value,
  requirements = evaluatePasswordRequirements(value)
}: {
  value: string;
  requirements?: Array<(ReturnType<typeof evaluatePasswordRequirements>)[number]>;
}) {
  const resolvedRequirements = requirements ?? evaluatePasswordRequirements(value);

  return (
    <div className="rounded-[18px] border border-line/70 bg-surfaceRaised/70 p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate">Password requirements</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {resolvedRequirements.map((requirement, index) => (
          <p
            key={PASSWORD_REQUIREMENTS[index].id}
            className={cn(
              "text-xs transition",
              requirement.met ? "text-accent" : "text-slate/80"
            )}
          >
            {requirement.met ? "✓" : "•"} {requirement.label}
          </p>
        ))}
      </div>
    </div>
  );
}
