"use client";

import { Check, Eye, EyeOff } from "lucide-react";
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
            "h-12 w-full min-w-0 max-w-full rounded-[18px] border border-line/70 bg-surfaceRaised/75 px-4 pr-12 text-sm text-ink outline-none transition placeholder:text-slate/70 focus:border-accent focus:ring-4 focus:ring-accent/10",
            className
          )}
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          className="absolute right-1 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full text-slate transition hover:text-ink"
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
    <div className="rounded-lg border border-lime-300/25 bg-lime-300/[0.04] p-4 shadow-[0_18px_60px_rgba(132,204,22,0.08)]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-lime-100">Password requirements</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {resolvedRequirements.map((requirement, index) => (
          <div
            key={PASSWORD_REQUIREMENTS[index].id}
            className={cn(
              "flex items-center gap-2 text-sm transition",
              requirement.met ? "font-medium text-lime-200" : "text-slate/75"
            )}
          >
            <span
              className={cn(
                "inline-flex h-5 w-5 items-center justify-center rounded-full border",
                requirement.met
                  ? "border-lime-300 bg-lime-300 text-[#08100a]"
                  : "border-line/80 text-slate/60"
              )}
            >
              {requirement.met ? <Check className="h-3.5 w-3.5" /> : null}
            </span>
            {requirement.label}
          </div>
        ))}
      </div>
    </div>
  );
}
