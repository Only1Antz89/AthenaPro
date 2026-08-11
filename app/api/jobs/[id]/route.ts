import { NextResponse } from "next/server";
import { getPublicJobs } from "@/lib/services/staffbook-service";

export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const jobs = await getPublicJobs();
  const job = jobs.find((entry) => entry.id === id);

  if (!job) {
    return NextResponse.json({ message: "Job not found." }, { status: 404 });
  }

  return NextResponse.json(job);
}
