import { NextResponse } from "next/server";
import { hasAnyMarketingConsent } from "@/lib/email/marketing";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

function toBoolean(value: FormDataEntryValue | string | null | undefined) {
  return value === "true" || value === "on";
}

async function readRequestPayload(request: Request) {
  const url = new URL(request.url);
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const body = (await request.json()) as {
      token?: string;
      newsletterConsent?: boolean;
      offersConsent?: boolean;
      productUpdatesConsent?: boolean;
      unsubscribeAll?: boolean;
    };

    return {
      token: String(body.token ?? url.searchParams.get("token") ?? ""),
      newsletterConsent: Boolean(body.newsletterConsent),
      offersConsent: Boolean(body.offersConsent),
      productUpdatesConsent: Boolean(body.productUpdatesConsent),
      unsubscribeAll: Boolean(body.unsubscribeAll)
    };
  }

  if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
    const formData = await request.formData();

    return {
      token: String(formData.get("token") ?? url.searchParams.get("token") ?? ""),
      newsletterConsent: toBoolean(formData.get("newsletterConsent")),
      offersConsent: toBoolean(formData.get("offersConsent")),
      productUpdatesConsent: toBoolean(formData.get("productUpdatesConsent")),
      unsubscribeAll: toBoolean(formData.get("unsubscribeAll"))
    };
  }

  return {
    token: String(url.searchParams.get("token") ?? ""),
    newsletterConsent: false,
    offersConsent: false,
    productUpdatesConsent: false,
    unsubscribeAll: request.method === "POST"
  };
}

export async function POST(request: Request) {
  const payload = await readRequestPayload(request);
  const redirectUrl = new URL("/unsubscribe?status=error", request.url);
  const contentType = request.headers.get("content-type") ?? "";

  if (!payload.token) {
    return NextResponse.redirect(redirectUrl);
  }

  const adminSupabase = createAdminSupabaseClient();
  const now = new Date().toISOString();
  const hasConsent = payload.unsubscribeAll
    ? false
    : hasAnyMarketingConsent({
        newsletterOptIn: payload.newsletterConsent,
        offersOptIn: payload.offersConsent,
        productUpdatesOptIn: payload.productUpdatesConsent
      });

  const { data: preference } = await adminSupabase
    .from("marketing_preferences")
    .select("profile_id, email_normalized")
    .eq("unsubscribe_token", payload.token)
    .maybeSingle();

  if (!preference?.profile_id || !preference.email_normalized) {
    return NextResponse.redirect(redirectUrl);
  }

  const { error } = await adminSupabase
    .from("marketing_preferences")
    .update({
      newsletter_opt_in: payload.unsubscribeAll ? false : payload.newsletterConsent,
      offers_opt_in: payload.unsubscribeAll ? false : payload.offersConsent,
      product_updates_opt_in: payload.unsubscribeAll ? false : payload.productUpdatesConsent,
      newsletter_opted_out_at: payload.unsubscribeAll || !payload.newsletterConsent ? now : null,
      marketing_opted_out_at: hasConsent ? null : now,
      source: payload.unsubscribeAll ? "unsubscribe_link" : "preference_centre",
      updated_at: now
    })
    .eq("unsubscribe_token", payload.token);

  if (error) {
    return NextResponse.redirect(redirectUrl);
  }

  if (hasConsent) {
    await adminSupabase
      .from("email_suppressions")
      .update({
        active: false,
        source: "preference_centre",
        last_seen_at: now,
        updated_at: now
      })
      .eq("email_normalized", String(preference.email_normalized));
  } else {
    await adminSupabase.from("email_suppressions").upsert({
      email_normalized: String(preference.email_normalized),
      reason: "unsubscribe",
      source: payload.unsubscribeAll ? "unsubscribe_link" : "preference_centre",
      provider: "smtp2go",
      active: true,
      details: {
        profileId: preference.profile_id
      },
      first_seen_at: now,
      last_seen_at: now,
      updated_at: now
    });
  }

  if ((request.headers.get("accept") ?? "").includes("application/json")) {
    return NextResponse.json({
      ok: true,
      unsubscribed: !hasConsent
    });
  }

  if (!contentType.includes("application/x-www-form-urlencoded") && !contentType.includes("multipart/form-data")) {
    return new Response("OK", { status: 200 });
  }

  redirectUrl.searchParams.set("status", hasConsent ? "updated" : "success");
  return NextResponse.redirect(redirectUrl);
}
