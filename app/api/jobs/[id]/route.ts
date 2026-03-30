import { NextResponse } from "next/server";
import { getPublicJobs } from "@/lib/services/staffbook-service";

export async function GET(
  _: Request,
  { params }: { params: { id: string } }
) {
  const jobs = await getPublicJobs();
  const job = jobs.find((entry) => entry.id === params.id);

  if (!job) {
    return NextResponse.json({ message: "Job not found." }, { status: 404 });
  }

  return NextResponse.json(job);
}
