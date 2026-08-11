import { cookies } from "next/headers";
import { NextResponse } from "next/server";

async function clearCookie(name: string) {
  const cookieStore = await cookies();
  cookieStore.set(name, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    expires: new Date(0)
  });
}

export async function POST() {
  await Promise.all([
    clearCookie("athena_google_access_token"),
    clearCookie("athena_google_oauth_state")
  ]);

  return NextResponse.json({ ok: true });
}
