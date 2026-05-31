import { z } from "zod";

export const createClientSchema = z.object({
  companyName: z.string().min(2),
  primaryContactName: z.string().min(2),
  primaryContactEmail: z.string().email(),
  billingContactEmail: z.string().email(),
  status: z.enum(["active", "inactive", "at_risk"]).default("active")
});

export type CreateClientInput = z.infer<typeof createClientSchema>;
