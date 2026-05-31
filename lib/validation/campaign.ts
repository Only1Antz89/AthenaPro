import { z } from "zod";
import { EMAIL_TEMPLATE_TYPES } from "@/types/admin";

const optionalCampaignDateTimeSchema = z
  .string()
  .optional()
  .or(z.literal(""))
  .refine((value) => !value || !Number.isNaN(Date.parse(value)), {
    message: "Enter a valid schedule date."
  });

const campaignBlockSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("heading"),
    id: z.string().min(1),
    content: z.string().min(1)
  }),
  z.object({
    type: z.literal("text"),
    id: z.string().min(1),
    content: z.string().min(1)
  }),
  z.object({
    type: z.literal("image"),
    id: z.string().min(1),
    src: z.string().url(),
    alt: z.string().min(1)
  }),
  z.object({
    type: z.literal("cta"),
    id: z.string().min(1),
    label: z.string().min(1),
    href: z.string().url()
  }),
  z.object({
    type: z.literal("markdown"),
    id: z.string().min(1),
    content: z.string().min(1)
  })
]);

export const createCampaignSchema = z.object({
  name: z.string().min(2),
  subject: z.string().min(2),
  previewText: z.string().min(2),
  audience: z.enum(["clients", "operators", "both"]),
  templateType: z.enum(EMAIL_TEMPLATE_TYPES),
  marketingCategory: z.enum(["news", "offers", "updates"]).default("news"),
  segmentKey: z.string().min(1),
  contentMode: z.enum(["rich", "markdown"]).default("rich"),
  htmlContent: z.string().min(10),
  markdownContent: z.string().optional().or(z.literal("")),
  contentJson: z.array(campaignBlockSchema).default([]),
  googleDocId: z.string().optional().or(z.literal("")),
  googleDocUrl: z.string().url().optional().or(z.literal("")),
  scheduledAt: optionalCampaignDateTimeSchema
});

export type CreateCampaignInput = z.infer<typeof createCampaignSchema>;
