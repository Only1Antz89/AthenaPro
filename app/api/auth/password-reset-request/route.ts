import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getRuntimeMode } from "@/lib/env";
import { sendPasswordResetEmail } from "@/lib/services/admin-communications";
import { passwordResetRequestSchema } from "@/lib/validation/schemas";

const passwordResetEmailRequestSchema = passwordResetRequestSchema.extend({
  redirectTo: z.string().url()
});

export async function POST(request: Request) {
  const body = await request.json();
  const payload = passwordResetEmailRequestSchema.parse(body);

  if (getRuntimeMode() !== "live") {
    return NextResponse.json({ ok: true });
  }

  const supabase = createAdminSupabaseClient();

  const { data, error } = await supabase.auth.admin.generateLink({
    type: "recovery",
    email: payload.email,
    options: {
      redirectTo: payload.redirectTo
    }
  });

  if (error || !data.properties?.action_link) {
    return NextResponse.json({ ok: true });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .eq("email", payload.email)
    .maybeSingle();

  await sendPasswordResetEmail({
    to: payload.email,
    recipientName: profile?.full_name ?? undefined,
    resetUrl: data.properties.action_link
  });

  return NextResponse.json({ ok: true });
}
