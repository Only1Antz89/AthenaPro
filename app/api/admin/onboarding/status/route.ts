import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/require-admin";
import { sendOnboardingApprovedEmail } from "@/lib/services/admin-communications";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

const updateOnboardingStatusSchema = z.object({
  entityType: z.enum(["organization", "operator_profile"]),
  entityId: z.string().uuid().or(z.string().min(1)),
  status: z.enum(["pending", "in_review", "approved", "rejected"])
});

export async function POST(request: Request) {
  await requireAdmin();
  const body = await request.json();
  const payload = updateOnboardingStatusSchema.parse(body);
  const supabase = createAdminSupabaseClient();

  if (payload.entityType === "organization") {
    const { error } = await supabase
      .from("organizations")
      .update({ onboarding_status: payload.status })
      .eq("id", payload.entityId);

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
    }

    if (payload.status === "approved") {
      const { data: membership } = await supabase
        .from("organization_memberships")
        .select("profile_id, role, profiles(full_name, email)")
        .eq("organization_id", payload.entityId)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();

      const profile = Array.isArray(membership?.profiles) ? membership?.profiles[0] : membership?.profiles;

      if (membership?.profile_id && profile?.email) {
        await sendOnboardingApprovedEmail({
          profileId: String(membership.profile_id),
          role: "organiser",
          email: String(profile.email),
          recipientName: profile.full_name ? String(profile.full_name) : undefined
        });
      }
    }

    return NextResponse.json({ ok: true });
  }

  const { error } = await supabase
    .from("operator_profiles")
    .update({ onboarding_status: payload.status })
    .eq("profile_id", payload.entityId);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  }

  if (payload.status === "approved") {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", payload.entityId)
      .maybeSingle();

    if (profile?.email) {
      await sendOnboardingApprovedEmail({
        profileId: payload.entityId,
        role: "staff",
        email: String(profile.email),
        recipientName: profile.full_name ? String(profile.full_name) : undefined
      });
    }
  }

  return NextResponse.json({ ok: true });
}
