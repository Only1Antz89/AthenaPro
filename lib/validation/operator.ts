import { z } from "zod";

export const createOperatorSchema = z.object({
  displayName: z.string().min(2),
  email: z.string().email(),
  regions: z.array(z.string()).default([]),
  skillTags: z.array(z.string()).default([]),
  onboardingStatus: z.enum(["pending", "in_review", "approved", "rejected"]).default("pending")
});

export type CreateOperatorInput = z.infer<typeof createOperatorSchema>;
