import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { getAdminAssignments } from "@/lib/queries/assignments";

export async function GET() {
  await requireAdmin();
  const assignments = await getAdminAssignments();
  return NextResponse.json(assignments);
}
