import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { sendCampaignTest } from "@/lib/services/admin-communications";

export async function POST(
  _request: Request,
  { params }: { params: { campaignId: string } }
) {
  const { adminUser } = await requireAdmin();
  const result = await sendCampaignTest(params.campaignId, adminUser.email, adminUser.fullName);
  return NextResponse.json(result);
}
