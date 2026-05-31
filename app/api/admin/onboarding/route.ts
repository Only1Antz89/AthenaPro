import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { getAdminOnboarding } from "@/lib/queries/onboarding";

export async function GET() {
  await requireAdmin();
  const onboarding = await getAdminOnboarding();
  return NextResponse.json(onboarding);
}
