import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { AppError } from "@/lib/errors";
import { importGoogleDoc } from "@/lib/services/admin-communications";

export async function POST(
  _request: Request,
  { params }: { params: { fileId: string } }
) {
  await requireAdmin();
  const accessToken = cookies().get("athena_google_access_token")?.value;

  if (!accessToken) {
    return NextResponse.json({ error: "Google is not connected." }, { status: 401 });
  }

  try {
    const payload = await importGoogleDoc(accessToken, params.fileId);
    return NextResponse.json(payload);
  } catch (error) {
    if (error instanceof AppError && (error.status === 401 || error.status === 403)) {
      cookies().delete("athena_google_access_token");
      return NextResponse.json({ error: "Google connection expired." }, { status: 401 });
    }

    throw error;
  }
}
