import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/require-admin";
import { scheduleCampaign } from "@/lib/services/admin-communications";

const scheduleSchema = z.object({
  scheduledAt: z.string().min(1).refine((value) => !Number.isNaN(Date.parse(value)), {
    message: "Enter a valid schedule date."
  })
});

export async function POST(
  request: Request,
  { params }: { params: { campaignId: string } }
) {
  await requireAdmin();
  const body = await request.json();
  const payload = scheduleSchema.parse(body);
  const result = await scheduleCampaign(params.campaignId, payload.scheduledAt);
  return NextResponse.json(result);
}
