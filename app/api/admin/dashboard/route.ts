import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { getAdminDashboardData } from "@/lib/queries/admin-dashboard";

export async function GET() {
  await requireAdmin();
  const data = await getAdminDashboardData();
  return NextResponse.json(data);
}
