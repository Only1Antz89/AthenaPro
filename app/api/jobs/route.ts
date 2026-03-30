import { NextResponse } from "next/server";
import { getPublicJobs } from "@/lib/services/staffbook-service";

export async function GET() {
  const jobs = await getPublicJobs();
  return NextResponse.json(jobs);
}
