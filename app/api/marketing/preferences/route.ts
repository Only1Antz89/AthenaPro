import { NextResponse } from "next/server";
import {
  buildMarketingPreferenceUpsert,
  hasAnyMarketingConsent,
  normalizeEmail
} from "@/lib/email/marketing";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { updateMarketingPreferencesSchema } from "@/lib/validation/schemas";

export async function POST(request: Request) {
  const body = await request.json();
  const payload = updateMarketingPreferencesSchema.parse(body);
  const serverSupabase = createServerSupabaseClient();
  const {
    data: { user }
  } = await serverSupabase.auth.getUser();

  if (!user?.id || !user.email) {
    return NextResponse.json({ ok: false, error: "Authentication required." }, { status: 401 });
  }

  const adminSupabase = createAdminSupabaseClient();
  const now = new Date().toISOString();
  const { data: existing } = await adminSupabase
    .from("marketing_preferences")
    .select("created_at, newsletter_opted_in_at, unsubscribe_token")
    .eq("profile_id", user.id)
    .maybeSingle();

  const { error } = await adminSupabase.from("marketing_preferences").upsert(
    buildMarketingPreferenceUpsert({
      profileId: user.id,
      email: user.email,
      source: "profile_settings",
      consent: payload,
      existing: existing
        ? {
            createdAt: existing.created_at ? String(existing.created_at) : undefined,
            newsletterOptedInAt: existing.newsletter_opted_in_at ? String(existing.newsletter_opted_in_at) : undefined,
            unsubscribeToken: existing.unsubscribe_token ? String(existing.unsubscribe_token) : undefined
          }
        : null,
      now
    })
  );

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  }

  const emailNormalized = normalizeEmail(user.email);
  const hasConsent = hasAnyMarketingConsent({
    newsletterOptIn: payload.newsletterConsent,
    offersOptIn: payload.offersConsent,
    productUpdatesOptIn: payload.productUpdatesConsent
  });

  if (hasConsent) {
    await adminSupabase
      .from("email_suppressions")
      .update({
        active: false,
        source: "profile_settings",
        last_seen_at: now,
        updated_at: now
      })
      .eq("email_normalized", emailNormalized);
  } else {
    await adminSupabase.from("email_suppressions").upsert({
      email_normalized: emailNormalized,
      reason: "unsubscribe",
      source: "profile_settings",
      provider: "smtp2go",
      active: true,
      details: {
        actor: user.id
      },
      first_seen_at: now,
      last_seen_at: now,
      updated_at: now
    });
  }

  return NextResponse.json({ ok: true });
}
