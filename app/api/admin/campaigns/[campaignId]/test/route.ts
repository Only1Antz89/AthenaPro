import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { sendCampaignTest } from "@/lib/services/admin-communications";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ campaignId: string }> }
) {
  const { adminUser } = await requireAdmin();
  const { campaignId } = await params;
  const result = await sendCampaignTest(campaignId, adminUser.email, adminUser.fullName);
  return NextResponse.json(result);
}
