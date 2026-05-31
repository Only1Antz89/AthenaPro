import { z } from "zod";
import { PASSWORD_HINT, strongPasswordSchema } from "@/lib/validation/password";

const SERVICE_TIERS = ["festival", "mixed", "formal", "high_end"] as const;
const UP_FEEDBACK_REASONS = [
  "clear_brief",
  "respectful_team",
  "well_organised",
  "fair_pay",
  "would_work_again"
] as const;
const DOWN_FEEDBACK_REASONS = [
  "unclear_brief",
  "disrespectful_treatment",
  "poor_organisation",
  "payment_issues",
  "unsafe_or_overwhelming"
] as const;
const JOB_BOARD_SORTS = ["newest", "soonest", "pay", "match", "trending"] as const;

export const organiserSignupSchema = z
  .object({
    role: z.literal("organiser"),
    fullName: z.string().min(2),
    email: z.string().email(),
    password: strongPasswordSchema,
    confirmPassword: z.string().min(1),
    companyName: z.string().min(2),
    newsletterConsent: z.boolean().default(false)
  })
  .superRefine((value, context) => {
    if (value.password !== value.confirmPassword) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirmPassword"],
        message: "Passwords must match."
      });
    }
  });

export const staffSignupSchema = z
  .object({
    role: z.literal("staff"),
    fullName: z.string().min(2),
    email: z.string().email(),
    password: strongPasswordSchema,
    confirmPassword: z.string().min(1),
    phone: z.string().min(7),
    location: z.string().min(2),
    canDrive: z.boolean(),
    skills: z.string().min(2),
    bio: z.string().min(10),
    availability: z.string().min(2),
    availabilityRules: z
      .array(
        z.object({
          dayOfWeek: z.coerce.number().int().min(0).max(6),
          isAvailable: z.boolean(),
          isAllDay: z.boolean(),
          startTime: z.string().regex(/^\d{2}:\d{2}$/).optional().or(z.literal("")),
          endTime: z.string().regex(/^\d{2}:\d{2}$/).optional().or(z.literal(""))
        })
      )
      .length(7)
      .optional(),
    newsletterConsent: z.boolean().default(false)
  })
  .superRefine((value, context) => {
    if (value.password !== value.confirmPassword) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirmPassword"],
        message: "Passwords must match."
      });
    }
  });

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export const createEventSchema = z.object({
  title: z.string().min(2),
  description: z.string().min(10),
  location: z.string().min(2),
  eventDate: z.string().min(2),
  eventType: z.string().min(2),
  requiredRoles: z.string().min(2),
  serviceTier: z.enum(SERVICE_TIERS).default("mixed")
});

export const createJobSchema = z.object({
  eventId: z.string().min(2),
  title: z.string().min(2),
  description: z.string().min(10),
  roleType: z.string().min(2),
  shiftStart: z.string().min(2),
  shiftEnd: z.string().min(2),
  payRate: z.coerce.number().min(1),
  positionsNeeded: z.coerce.number().int().min(1),
  minimumAge: z.coerce.number().int().min(16).max(100).optional().nullable()
});

export const jobApplicationSchema = z.object({
  jobId: z.string().min(2),
  coverNote: z.string().min(10)
});

export const jobAlertSchema = z
  .object({
    id: z.string().min(1).optional(),
    name: z.string().min(2).max(80),
    query: z.string().max(120).optional().or(z.literal("")),
    location: z.string().max(120).optional().or(z.literal("")),
    roleTypes: z.array(z.string().min(2)).max(12).default([]),
    minimumPay: z.coerce.number().min(0).optional().nullable(),
    dateFrom: z.string().optional().or(z.literal("")),
    dateTo: z.string().optional().or(z.literal("")),
    isActive: z.boolean().default(true),
    emailOptIn: z.boolean().default(true)
  })
  .superRefine((value, context) => {
    if (value.dateFrom && value.dateTo && value.dateFrom > value.dateTo) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["dateTo"],
        message: "End date must be after the start date."
      });
    }
  });

export const browseJobsFiltersSchema = z.object({
  query: z.string().optional(),
  location: z.string().optional(),
  roleType: z.string().optional(),
  roleTypes: z.array(z.string()).optional(),
  minimumPay: z.coerce.number().min(0).optional(),
  date: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  savedOnly: z.boolean().optional(),
  sort: z.enum(JOB_BOARD_SORTS).optional()
});

export const operatorReviewSchema = z.object({
  eventId: z.string().min(2),
  staffId: z.string().min(2),
  jobId: z.string().min(2),
  reliabilityScore: z.coerce.number().int().min(1).max(5),
  professionalismScore: z.coerce.number().int().min(1).max(5),
  communicationScore: z.coerce.number().int().min(1).max(5),
  customerServiceScore: z.coerce.number().int().min(1).max(5),
  pressureHandlingScore: z.coerce.number().int().min(1).max(5),
  comment: z.string().min(4)
});

export const staffRatingSchema = operatorReviewSchema;

export const operatorAvailabilityRuleSchema = z.object({
  id: z.string().min(1).optional(),
  dayOfWeek: z.coerce.number().int().min(0).max(6),
  isAvailable: z.boolean(),
  isAllDay: z.boolean(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/).optional().or(z.literal("")),
  endTime: z.string().regex(/^\d{2}:\d{2}$/).optional().or(z.literal(""))
});

export const updateOperatorAvailabilitySchema = z.object({
  availabilitySummary: z.string().min(2),
  rules: z.array(operatorAvailabilityRuleSchema).length(7)
});

export const updateOperatorProfileSchema = z.object({
  fullName: z.string().min(2),
  phone: z.string().min(7),
  details: z.string().min(10),
  headline: z.string().max(120).optional().or(z.literal("")),
  baseLocation: z.string().min(2),
  preferredRoles: z.array(z.string().min(2)).min(1),
  languages: z.array(z.string().min(2)).min(1),
  dateOfBirth: z.string().min(4),
  avatarUrl: z.string().url().optional().or(z.literal("")),
  skills: z.array(z.string().min(2)).min(1)
});

export const updateEmailSchema = z.object({
  email: z.string().email()
});

export const updateMarketingPreferencesSchema = z.object({
  newsletterConsent: z.boolean(),
  offersConsent: z.boolean(),
  productUpdatesConsent: z.boolean()
});

export const updatePasswordSchema = z
  .object({
    password: strongPasswordSchema,
    confirmPassword: z.string().min(1)
  })
  .superRefine((value, context) => {
    if (value.password !== value.confirmPassword) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirmPassword"],
        message: "Passwords must match."
      });
    }
  });

export const passwordResetRequestSchema = z.object({
  email: z.string().email()
});

export const passwordResetCompleteSchema = z.object({
  password: strongPasswordSchema,
  confirmPassword: z.string().min(1)
}).superRefine((value, context) => {
  if (value.password !== value.confirmPassword) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["confirmPassword"],
      message: "Passwords must match."
    });
  }
});

export const clientFeedbackSchema = z
  .object({
    assignmentId: z.string().min(2),
    jobId: z.string().min(2),
    clientId: z.string().min(2),
    sentiment: z.enum(["up", "down"]),
    reasons: z.array(z.string().min(2)).min(1).max(5),
    note: z.string().max(500).optional().or(z.literal(""))
  })
  .superRefine((value, context) => {
    const allowedReasons =
      value.sentiment === "up" ? new Set(UP_FEEDBACK_REASONS) : new Set(DOWN_FEEDBACK_REASONS);

    for (const reason of value.reasons) {
      if (!allowedReasons.has(reason as never)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["reasons"],
          message: "Feedback reasons do not match the selected sentiment."
        });
        return;
      }
    }
  });

export const contactInquirySchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  eventType: z.string().min(2),
  expectedAttendance: z.string().min(1),
  serviceNeeds: z.array(z.string()).min(1),
  brief: z.string().max(1200).optional().or(z.literal(""))
});

export type OrganiserSignupInput = z.infer<typeof organiserSignupSchema>;
export type StaffSignupInput = z.infer<typeof staffSignupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateEventInput = z.infer<typeof createEventSchema>;
export type CreateJobInput = z.infer<typeof createJobSchema>;
export type JobApplicationInput = z.infer<typeof jobApplicationSchema>;
export type JobAlertInput = z.infer<typeof jobAlertSchema>;
export type BrowseJobsFiltersInput = z.infer<typeof browseJobsFiltersSchema>;
export type OperatorReviewInput = z.infer<typeof operatorReviewSchema>;
export type StaffRatingInput = z.infer<typeof staffRatingSchema>;
export type UpdateOperatorAvailabilityInput = z.infer<typeof updateOperatorAvailabilitySchema>;
export type UpdateOperatorProfileInput = z.infer<typeof updateOperatorProfileSchema>;
export type UpdateEmailInput = z.infer<typeof updateEmailSchema>;
export type UpdateMarketingPreferencesInput = z.infer<typeof updateMarketingPreferencesSchema>;
export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;
export type PasswordResetRequestInput = z.infer<typeof passwordResetRequestSchema>;
export type PasswordResetCompleteInput = z.infer<typeof passwordResetCompleteSchema>;
export type ClientFeedbackInput = z.infer<typeof clientFeedbackSchema>;
export type ContactInquiryInput = z.infer<typeof contactInquirySchema>;

export const CLIENT_FEEDBACK_REASON_OPTIONS = {
  up: UP_FEEDBACK_REASONS,
  down: DOWN_FEEDBACK_REASONS
} as const;

export { PASSWORD_HINT };
