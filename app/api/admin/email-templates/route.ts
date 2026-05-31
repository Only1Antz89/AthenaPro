import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { getAdminEmailTemplates } from "@/lib/queries/campaigns";

export async function GET() {
  await requireAdmin();
  const templates = await getAdminEmailTemplates();
  return NextResponse.json(templates);
}
