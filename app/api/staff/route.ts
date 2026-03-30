import { NextResponse } from "next/server";
import { getPublicRankedStaff } from "@/lib/services/staffbook-service";

export async function GET() {
  const staff = await getPublicRankedStaff();
  return NextResponse.json(staff);
}
