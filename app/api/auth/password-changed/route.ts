import { NextResponse } from "next/server";
import { getRuntimeMode } from "@/lib/env";
import { sendTransactionalTemplateEmail } from "@/lib/services/admin-communications";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST() {
  if (getRuntimeMode() !== "live") {
    return NextResponse.json({ ok: true });
  }

  const supabase = createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return NextResponse.json({ ok: false, error: "No active session." }, { status: 401 });
  }

  await sendTransactionalTemplateEmail({
    templateType: "password_changed",
    to: user.email,
    recipientName: user.user_metadata.full_name ?? undefined
  });

  return NextResponse.json({ ok: true });
}
