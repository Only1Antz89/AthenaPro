import { NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { sendJobConfirmationEmails } from "@/lib/services/admin-communications";

const updateApplicationStatusSchema = z.object({
  status: z.enum(["pending", "accepted", "rejected", "withdrawn"])
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ applicationId: string }> }
) {
  const { applicationId } = await params;
  const body = await request.json();
  const payload = updateApplicationStatusSchema.parse(body);
  const supabase = await createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: false, error: "Authentication required." }, { status: 401 });
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();

  if (profile?.role !== "organiser") {
    return NextResponse.json({ ok: false, error: "Organiser account required." }, { status: 403 });
  }

  const { error } = await supabase
    .from("applications")
    .update({ status: payload.status })
    .eq("id", applicationId);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  }

  if (payload.status === "accepted") {
    try {
      await sendJobConfirmationEmails({ applicationId });
    } catch (sendError) {
      console.error(sendError);
      return NextResponse.json({
        ok: true,
        warning: "Assignment confirmed, but the confirmation email could not be sent."
      });
    }
  }

  return NextResponse.json({ ok: true });
}
