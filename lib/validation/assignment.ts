import { z } from "zod";

export const createAssignmentSchema = z.object({
  clientId: z.string().min(1),
  title: z.string().min(2),
  locationName: z.string().min(2),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
  requiredHeadcount: z.number().int().min(1)
});

export type CreateAssignmentInput = z.infer<typeof createAssignmentSchema>;
