import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { AppError } from "@/lib/errors";
import { listGoogleDocs } from "@/lib/services/admin-communications";

export async function GET() {
  await requireAdmin();
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("athena_google_access_token")?.value;

  if (!accessToken) {
    return NextResponse.json({ error: "Google is not connected." }, { status: 401 });
  }

  try {
    const docs = await listGoogleDocs(accessToken);
    return NextResponse.json(docs);
  } catch (error) {
    if (error instanceof AppError && (error.status === 401 || error.status === 403)) {
      cookieStore.delete("athena_google_access_token");
      return NextResponse.json({ error: "Google connection expired." }, { status: 401 });
    }

    throw error;
  }
}
