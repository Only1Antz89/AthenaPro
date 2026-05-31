import { SITE_CONTACT } from "@/lib/site-content";

export type MarketingConsentInput = {
  newsletterConsent: boolean;
  offersConsent: boolean;
  productUpdatesConsent: boolean;
};

type MarketingPreferenceSnapshot = {
  createdAt?: string;
  newsletterOptedInAt?: string | null;
  unsubscribeToken?: string | null;
};

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function hasAnyMarketingConsent(input: {
  newsletterOptIn: boolean;
  offersOptIn: boolean;
  productUpdatesOptIn: boolean;
}) {
  return input.newsletterOptIn || input.offersOptIn || input.productUpdatesOptIn;
}

export function buildPreferenceUrls(unsubscribeToken?: string) {
  if (!unsubscribeToken) {
    return {};
  }

  const manageUrl = new URL("/unsubscribe", SITE_CONTACT.websiteUrl);
  manageUrl.searchParams.set("token", unsubscribeToken);

  const unsubscribeUrl = new URL("/api/marketing/unsubscribe", SITE_CONTACT.websiteUrl);
  unsubscribeUrl.searchParams.set("token", unsubscribeToken);

  return {
    manageUrl: manageUrl.toString(),
    unsubscribeUrl: unsubscribeUrl.toString()
  };
}

export function buildMarketingFooter(unsubscribeToken?: string) {
  const links = buildPreferenceUrls(unsubscribeToken);

  if (!links.manageUrl || !links.unsubscribeUrl) {
    return "";
  }

  return [
    "You are receiving Athena Pro marketing email because you asked for news, offers, or product updates.",
    `<a href="${links.manageUrl}" style="color:#b9e6ff;text-decoration:none;">Manage preferences</a>`,
    `<a href="${links.unsubscribeUrl}" style="color:#b9e6ff;text-decoration:none;">Unsubscribe from all marketing</a>`
  ].join(" · ");
}

export function buildListUnsubscribeHeaders(unsubscribeToken?: string) {
  const links = buildPreferenceUrls(unsubscribeToken);

  if (!links.unsubscribeUrl) {
    return undefined;
  }

  return {
    "List-Unsubscribe": `<${links.unsubscribeUrl}>`,
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click"
  } satisfies Record<string, string>;
}

export function buildMarketingPreferenceUpsert(input: {
  profileId: string;
  email: string;
  source: string;
  consent: MarketingConsentInput;
  existing?: MarketingPreferenceSnapshot | null;
  now?: string;
}) {
  const now = input.now ?? new Date().toISOString();
  const anyConsent = hasAnyMarketingConsent({
    newsletterOptIn: input.consent.newsletterConsent,
    offersOptIn: input.consent.offersConsent,
    productUpdatesOptIn: input.consent.productUpdatesConsent
  });

  return {
    profile_id: input.profileId,
    email_normalized: normalizeEmail(input.email),
    newsletter_opt_in: input.consent.newsletterConsent,
    offers_opt_in: input.consent.offersConsent,
    product_updates_opt_in: input.consent.productUpdatesConsent,
    newsletter_opted_in_at: input.consent.newsletterConsent
      ? input.existing?.newsletterOptedInAt ?? now
      : input.existing?.newsletterOptedInAt ?? null,
    newsletter_opted_out_at: input.consent.newsletterConsent ? null : now,
    marketing_opted_out_at: anyConsent ? null : now,
    unsubscribe_token: input.existing?.unsubscribeToken ?? undefined,
    source: input.source,
    created_at: input.existing?.createdAt ?? now,
    updated_at: now
  };
}
