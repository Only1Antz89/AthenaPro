import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { getAdminEmailDeliveries } from "@/lib/queries/campaigns";

export async function GET() {
  await requireAdmin();
  const deliveries = await getAdminEmailDeliveries();
  return NextResponse.json(deliveries);
}
