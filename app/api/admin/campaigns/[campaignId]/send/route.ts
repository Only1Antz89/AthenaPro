import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { sendCampaignNow } from "@/lib/services/admin-communications";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ campaignId: string }> }
) {
  await requireAdmin();
  const { campaignId } = await params;
  const result = await sendCampaignNow(campaignId);
  return NextResponse.json(result);
}
