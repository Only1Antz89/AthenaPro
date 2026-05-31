import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { getAdminAuditLog } from "@/lib/queries/audit-log";

export async function GET() {
  await requireAdmin();
  const entries = await getAdminAuditLog();
  return NextResponse.json(entries);
}
