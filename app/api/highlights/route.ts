import { NextResponse } from "next/server";
import { getPublicHighlights } from "@/lib/services/staffbook-service";

export async function GET() {
  const data = await getPublicHighlights();
  return NextResponse.json(data);
}
