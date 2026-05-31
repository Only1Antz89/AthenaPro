import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { sendCampaignNow } from "@/lib/services/admin-communications";

export async function POST(
  _request: Request,
  { params }: { params: { campaignId: string } }
) {
  await requireAdmin();
  const result = await sendCampaignNow(params.campaignId);
  return NextResponse.json(result);
}
