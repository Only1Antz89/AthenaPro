import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { getAdminCampaignById } from "@/lib/queries/campaigns";
import { updateCampaign } from "@/lib/services/admin-communications";
import { createCampaignSchema } from "@/lib/validation/campaign";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ campaignId: string }> }
) {
  await requireAdmin();
  const { campaignId } = await params;
  const campaign = await getAdminCampaignById(campaignId);

  if (!campaign) {
    return NextResponse.json({ error: "Campaign not found." }, { status: 404 });
  }

  return NextResponse.json(campaign);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ campaignId: string }> }
) {
  await requireAdmin();
  const { campaignId } = await params;
  const body = await request.json();
  const payload = createCampaignSchema.parse(body);
  const campaign = await updateCampaign(campaignId, payload);
  return NextResponse.json(campaign);
}
