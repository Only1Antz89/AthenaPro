import { z } from "zod";

export const PASSWORD_REQUIREMENTS = [
  {
    id: "min_length",
    label: "At least 8 characters",
    test: (value: string) => value.length >= 8
  },
  {
    id: "uppercase",
    label: "At least 1 capital letter",
    test: (value: string) => /[A-Z]/.test(value)
  },
  {
    id: "number",
    label: "At least 1 number",
    test: (value: string) => /\d/.test(value)
  },
  {
    id: "special",
    label: "At least 1 special character",
    test: (value: string) => /[^A-Za-z0-9]/.test(value)
  }
] as const;

export const PASSWORD_HINT =
  "Use at least 8 characters with 1 capital letter, 1 number, and 1 special character.";

export function evaluatePasswordRequirements(password: string) {
  return PASSWORD_REQUIREMENTS.map((requirement) => ({
    ...requirement,
    met: requirement.test(password)
  }));
}

export const strongPasswordSchema = z
  .string()
  .superRefine((value, context) => {
    for (const requirement of PASSWORD_REQUIREMENTS) {
      if (!requirement.test(value)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: PASSWORD_HINT
        });
        return;
      }
    }
  });
