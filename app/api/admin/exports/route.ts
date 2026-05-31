import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { getAdminExportJobs } from "@/lib/queries/reports";

export async function GET() {
  await requireAdmin();
  const jobs = await getAdminExportJobs();
  return NextResponse.json(jobs);
}

export async function POST(request: Request) {
  await requireAdmin();
  const body = await request.json().catch(() => ({}));

  return NextResponse.json(
    {
      message: "Export creation is stubbed. Wire this endpoint to background processing or storage-backed streaming.",
      request: body
    },
    { status: 202 }
  );
}
