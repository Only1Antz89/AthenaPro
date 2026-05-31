import { cookies } from "next/headers";
import { NextResponse } from "next/server";

function clearCookie(name: string) {
  cookies().set(name, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    expires: new Date(0)
  });
}

export async function POST() {
  clearCookie("athena_google_access_token");
  clearCookie("athena_google_oauth_state");

  return NextResponse.json({ ok: true });
}
