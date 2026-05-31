import { NextResponse } from "next/server";
import { z } from "zod";
import { getRuntimeMode } from "@/lib/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { sendTransactionalTemplateEmail } from "@/lib/services/admin-communications";

const onboardingEmailSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(2),
  role: z.enum(["organiser", "staff"]),
  companyName: z.string().optional()
});

export async function POST(request: Request) {
  const body = await request.json();
  const payload = onboardingEmailSchema.parse(body);

  if (getRuntimeMode() === "live") {
    const supabase = createServerSupabaseClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user?.email) {
      return NextResponse.json({ ok: false, error: "Authentication required." }, { status: 401 });
    }

    if (user.email.toLowerCase() !== payload.email.toLowerCase()) {
      return NextResponse.json({ ok: false, error: "Recipient does not match the active user." }, { status: 403 });
    }
  }

  await sendTransactionalTemplateEmail({
    templateType: payload.role === "organiser" ? "client_onboarding" : "operator_onboarding",
    to: payload.email,
    recipientName: payload.fullName
  });

  return NextResponse.json({ ok: true });
}
