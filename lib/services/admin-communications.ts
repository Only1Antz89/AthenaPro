import { cache } from "react";
import { getDefaultEmailTemplate, DEFAULT_EMAIL_TEMPLATES } from "@/lib/email/catalog";
import { buildCampaignPreviewHtml, markdownToHtml, renderEmailShell } from "@/lib/email/content";
import {
  buildListUnsubscribeHeaders,
  buildMarketingFooter,
  hasAnyMarketingConsent,
  normalizeEmail
} from "@/lib/email/marketing";
import { sendMail } from "@/lib/email/mailer";
import { env, getRuntimeMode } from "@/lib/env";
import { AppError } from "@/lib/errors";
import { getAdminDataset } from "@/lib/queries/admin-dataset";
import { SITE_CONTACT } from "@/lib/site-content";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { generateId } from "@/lib/utils";
import type {
  CampaignDetail,
  CampaignSummary,
  EmailDelivery,
  EmailTemplate,
  EmailTemplateType,
  MarketingCategory
} from "@/types/admin";
import type { CreateCampaignInput } from "@/lib/validation/campaign";

type Recipient = {
  profileId?: string;
  email: string;
  emailNormalized?: string;
  fullName?: string;
  role: "organiser" | "staff";
  newsletterOptIn?: boolean;
  offersOptIn?: boolean;
  productUpdatesOptIn?: boolean;
  unsubscribeToken?: string;
};

function isMissingRelationError(error: { code?: string; message?: string } | null) {
  return Boolean(
    error &&
      (error.code === "42P01" ||
        error.code === "PGRST205" ||
        error.message?.includes("Could not find the table"))
  );
}

function stripHtml(value: string) {
  return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function getMessageIdDomain() {
  try {
    return new URL(SITE_CONTACT.websiteUrl).hostname;
  } catch {
    return "athenapro.co.uk";
  }
}

function createOutboundMessageId() {
  return `<${crypto.randomUUID()}@${getMessageIdDomain()}>`;
}

function getCampaignMetrics(
  recipients: Array<Record<string, unknown>> | null | undefined
): Pick<CampaignSummary, "audienceCount" | "openRate" | "clickRate"> {
  const audienceCount = recipients?.length ?? 0;

  if (!audienceCount) {
    return {
      audienceCount: 0,
      openRate: 0,
      clickRate: 0
    };
  }

  const opened = recipients?.filter((recipient) => Boolean(recipient.opened_at)).length ?? 0;
  const clicked = recipients?.filter((recipient) => Boolean(recipient.clicked_at)).length ?? 0;

  return {
    audienceCount,
    openRate: Number(((opened / audienceCount) * 100).toFixed(1)),
    clickRate: Number(((clicked / audienceCount) * 100).toFixed(1))
  };
}

function getMarketingEligibility(
  recipient: Pick<Recipient, "newsletterOptIn" | "offersOptIn" | "productUpdatesOptIn">
) {
  return {
    news: Boolean(recipient.newsletterOptIn),
    offers: Boolean(recipient.offersOptIn),
    updates: Boolean(recipient.productUpdatesOptIn)
  } satisfies Record<MarketingCategory, boolean>;
}

function shouldReceiveMarketingCategory(recipient: Recipient, marketingCategory: MarketingCategory) {
  return getMarketingEligibility(recipient)[marketingCategory];
}

function mapSmtp2goEventToDeliveryStatus(eventType: string): EmailDelivery["status"] {
  switch (eventType) {
    case "delivered":
      return "delivered";
    case "open":
      return "opened";
    case "click":
      return "clicked";
    case "bounce":
      return "bounced";
    case "spam":
      return "complained";
    case "unsubscribe":
      return "unsubscribed";
    case "reject":
      return "rejected";
    default:
      return "sent";
  }
}

function coerceWebhookTimestamp(value: unknown) {
  if (typeof value !== "string" || value.trim().length === 0) {
    return new Date().toISOString();
  }

  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? new Date().toISOString() : new Date(parsed).toISOString();
}

function toCampaignSummary(row: Record<string, unknown>, audienceCount = 0): CampaignSummary {
  return {
    id: String(row.id),
    name: String(row.name),
    subject: String(row.subject),
    previewText: String(row.preview_text ?? ""),
    audience: row.audience as CampaignSummary["audience"],
    templateType: row.template_type as EmailTemplateType,
    marketingCategory: (row.marketing_category as MarketingCategory | null) ?? "news",
    segmentKey: String(row.segment_key ?? "all"),
    status: row.status as CampaignSummary["status"],
    contentMode: row.content_mode as CampaignSummary["contentMode"],
    htmlContent: String(row.html_content ?? ""),
    markdownContent: row.markdown_content ? String(row.markdown_content) : undefined,
    contentJson: JSON.stringify(row.content_json ?? []),
    googleDocId: row.google_doc_id ? String(row.google_doc_id) : undefined,
    googleDocUrl: row.google_doc_url ? String(row.google_doc_url) : undefined,
    scheduledAt: row.scheduled_at ? String(row.scheduled_at) : undefined,
    sentAt: row.sent_at ? String(row.sent_at) : undefined,
    audienceCount,
    openRate: 0,
    clickRate: 0
  };
}

function toEmailTemplate(row: Record<string, unknown>): EmailTemplate {
  return {
    id: String(row.id),
    name: String(row.name),
    templateType: row.template_type as EmailTemplateType,
    subjectTemplate: String(row.subject_template),
    previewText: String(row.preview_text ?? ""),
    bodyHtml: String(row.body_html ?? ""),
    bodyMarkdown: row.body_markdown ? String(row.body_markdown) : undefined,
    isSystem: Boolean(row.is_system),
    updatedAt: String(row.updated_at ?? row.created_at ?? new Date().toISOString())
  };
}

function toEmailDelivery(row: Record<string, unknown>): EmailDelivery {
  return {
    id: String(row.id),
    templateType: row.template_type as EmailTemplateType,
    campaignId: row.campaign_id ? String(row.campaign_id) : undefined,
    recipientEmail: String(row.recipient_email),
    recipientName: row.recipient_name ? String(row.recipient_name) : undefined,
    subject: String(row.subject),
    provider: String(row.provider ?? "smtp2go"),
    status: row.status as EmailDelivery["status"],
    category: row.category ? (String(row.category) as EmailDelivery["category"]) : undefined,
    errorMessage: row.error_message ? String(row.error_message) : undefined,
    sentAt: row.sent_at ? String(row.sent_at) : undefined,
    deliveredAt: row.delivered_at ? String(row.delivered_at) : undefined,
    openedAt: row.opened_at ? String(row.opened_at) : undefined,
    clickedAt: row.clicked_at ? String(row.clicked_at) : undefined,
    lastEvent: row.last_event ? String(row.last_event) : undefined,
    lastEventAt: row.last_event_at ? String(row.last_event_at) : undefined,
    createdAt: String(row.created_at)
  };
}

async function getLiveTemplates() {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase.from("email_templates").select("*").order("name", { ascending: true });

  if (error) {
    if (isMissingRelationError(error)) {
      return DEFAULT_EMAIL_TEMPLATES;
    }

    throw new AppError(error.message, "EMAIL_TEMPLATE_QUERY_FAILED");
  }

  const mergedTemplates = new Map(DEFAULT_EMAIL_TEMPLATES.map((template) => [template.templateType, template]));

  for (const row of data ?? []) {
    const template = toEmailTemplate(row);
    mergedTemplates.set(template.templateType, template);
  }

  return DEFAULT_EMAIL_TEMPLATES.map((template) => mergedTemplates.get(template.templateType) ?? template);
}

async function getLiveDeliveries() {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("email_deliveries")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    if (isMissingRelationError(error)) {
      return [];
    }

    throw new AppError(error.message, "EMAIL_DELIVERY_QUERY_FAILED");
  }

  return (data ?? []).map((row) => toEmailDelivery(row));
}

async function getLiveCampaignRows() {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("campaigns")
    .select("*, campaign_recipients(id, delivered_at, opened_at, clicked_at, failed_reason)")
    .order("created_at", { ascending: false });

  if (error) {
    if (isMissingRelationError(error)) {
      return [];
    }

    throw new AppError(error.message, "CAMPAIGN_QUERY_FAILED");
  }

  return data ?? [];
}

async function getLiveCampaignRow(campaignId: string) {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("campaigns")
    .select("*, campaign_recipients(*)")
    .eq("id", campaignId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }

    if (isMissingRelationError(error)) {
      return null;
    }

    throw new AppError(error.message, "CAMPAIGN_QUERY_FAILED");
  }

  return data;
}

async function getExistingDeliveryByEventKey(eventKey: string) {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("email_deliveries")
    .select("*")
    .eq("event_key", eventKey)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new AppError(error.message, "EMAIL_DELIVERY_QUERY_FAILED");
  }

  return data ? toEmailDelivery(data) : null;
}

async function getDeliveryByProviderMessageId(providerMessageId: string, recipientEmail: string) {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("email_deliveries")
    .select("*")
    .eq("provider_message_id", providerMessageId)
    .eq("recipient_email", recipientEmail)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new AppError(error.message, "EMAIL_DELIVERY_QUERY_FAILED");
  }

  return data as Record<string, unknown> | null;
}

async function listActiveSuppressions(emailNormalisedValues: string[]) {
  if (emailNormalisedValues.length === 0) {
    return new Set<string>();
  }

  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("email_suppressions")
    .select("email_normalized")
    .eq("active", true)
    .in("email_normalized", emailNormalisedValues);

  if (error) {
    throw new AppError(error.message, "EMAIL_SUPPRESSIONS_QUERY_FAILED");
  }

  return new Set((data ?? []).map((row) => String(row.email_normalized)));
}

async function upsertEmailSuppression(input: {
  emailNormalized: string;
  reason: string;
  source: string;
  details?: Record<string, unknown>;
}) {
  const supabase = createAdminSupabaseClient();
  await supabase.from("email_suppressions").upsert({
    email_normalized: input.emailNormalized,
    reason: input.reason,
    source: input.source,
    provider: "smtp2go",
    active: true,
    details: input.details ?? {},
    first_seen_at: new Date().toISOString(),
    last_seen_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });
}

async function clearEmailSuppression(emailNormalized: string, source: string) {
  const supabase = createAdminSupabaseClient();
  await supabase
    .from("email_suppressions")
    .update({
      active: false,
      source,
      last_seen_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq("email_normalized", emailNormalized);
}

async function applyMarketingOptOutByEmail(emailNormalized: string, source: string) {
  const supabase = createAdminSupabaseClient();
  const now = new Date().toISOString();
  await supabase
    .from("marketing_preferences")
    .update({
      newsletter_opt_in: false,
      offers_opt_in: false,
      product_updates_opt_in: false,
      newsletter_opted_out_at: now,
      marketing_opted_out_at: now,
      source,
      updated_at: now
    })
    .eq("email_normalized", emailNormalized);
}

async function logEmailDelivery(input: {
  templateType: EmailTemplateType;
  campaignId?: string;
  profileId?: string;
  eventKey?: string;
  category?: "transactional" | "marketing";
  recipientEmail: string;
  recipientName?: string;
  subject: string;
  status: EmailDelivery["status"];
  provider: string;
  providerMessageId?: string;
  providerEmailId?: string;
  errorMessage?: string;
  metadata?: Record<string, unknown>;
}) {
  if (getRuntimeMode() !== "live") {
    return;
  }

  const supabase = createAdminSupabaseClient();
  await supabase.from("email_deliveries").insert({
    template_type: input.templateType,
    campaign_id: input.campaignId ?? null,
    profile_id: input.profileId ?? null,
    event_key: input.eventKey ?? null,
    category: input.category ?? "transactional",
    recipient_email: input.recipientEmail,
    recipient_name: input.recipientName ?? null,
    subject: input.subject,
    provider: input.provider,
    status: input.status,
    provider_message_id: input.providerMessageId ?? null,
    provider_email_id: input.providerEmailId ?? null,
    error_message: input.errorMessage ?? null,
    sent_at: input.status === "sent" ? new Date().toISOString() : null,
    delivered_at: input.status === "delivered" ? new Date().toISOString() : null,
    opened_at: input.status === "opened" ? new Date().toISOString() : null,
    clicked_at: input.status === "clicked" ? new Date().toISOString() : null,
    last_event: input.status,
    last_event_at: new Date().toISOString(),
    metadata: input.metadata ?? {}
  });
}

export const getAdminEmailTemplates = cache(async () => {
  if (getRuntimeMode() !== "live") {
    return (await getAdminDataset()).emailTemplates;
  }

  return getLiveTemplates();
});

export const getAdminEmailDeliveries = cache(async () => {
  if (getRuntimeMode() !== "live") {
    return (await getAdminDataset()).emailDeliveries;
  }

  return getLiveDeliveries();
});

export const getAdminCampaignsLiveAware = cache(async () => {
  if (getRuntimeMode() !== "live") {
    return (await getAdminDataset()).campaigns;
  }

  const rows = await getLiveCampaignRows();
  return rows.map((row) => {
    const metrics = getCampaignMetrics(
      Array.isArray(row.campaign_recipients) ? (row.campaign_recipients as Array<Record<string, unknown>>) : []
    );

    return {
      ...toCampaignSummary(row, metrics.audienceCount),
      openRate: metrics.openRate,
      clickRate: metrics.clickRate
    };
  });
});

export async function getAdminCampaignByIdLiveAware(campaignId: string): Promise<CampaignDetail | null> {
  if (getRuntimeMode() !== "live") {
    return (await getAdminDataset()).campaignDetails[campaignId] ?? null;
  }

  const row = await getLiveCampaignRow(campaignId);

  if (!row) {
    return null;
  }

  const recipientBreakdown = Array.isArray(row.campaign_recipients)
    ? [
        {
          label: "Recipients",
          count: row.campaign_recipients.length
        }
      ]
    : [{ label: "Recipients", count: 0 }];

  return {
    ...toCampaignSummary(row, recipientBreakdown[0]?.count ?? 0),
    ...getCampaignMetrics(
      Array.isArray(row.campaign_recipients) ? (row.campaign_recipients as Array<Record<string, unknown>>) : []
    ),
    recipientBreakdown
  };
}

export async function createCampaign(input: CreateCampaignInput, adminUserId?: string) {
  if (getRuntimeMode() !== "live") {
    return {
      id: generateId("campaign"),
      ...input,
      contentJson: JSON.stringify(input.contentJson),
      status: input.scheduledAt ? "scheduled" : "draft",
      audienceCount: 0,
      openRate: 0,
      clickRate: 0,
      sentAt: undefined,
      scheduledAt: input.scheduledAt || undefined
    } satisfies CampaignSummary;
  }

  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("campaigns")
    .insert({
      name: input.name,
      subject: input.subject,
      preview_text: input.previewText,
      audience: input.audience,
      template_type: input.templateType,
      marketing_category: input.marketingCategory,
      segment_key: input.segmentKey,
      content_mode: input.contentMode,
      content_json: input.contentJson,
      markdown_content: input.markdownContent || null,
      html_content: input.htmlContent,
      google_doc_id: input.googleDocId || null,
      google_doc_url: input.googleDocUrl || null,
      status: input.scheduledAt ? "scheduled" : "draft",
      scheduled_at: input.scheduledAt || null,
      created_by: adminUserId ?? null,
      updated_at: new Date().toISOString()
    })
    .select("*")
    .single();

  if (error) {
    throw new AppError(error.message, "CAMPAIGN_CREATE_FAILED");
  }

  return toCampaignSummary(data, 0);
}

export async function updateCampaign(campaignId: string, input: CreateCampaignInput) {
  if (getRuntimeMode() !== "live") {
    return {
      id: campaignId,
      ...input,
      contentJson: JSON.stringify(input.contentJson),
      status: input.scheduledAt ? "scheduled" : "draft",
      audienceCount: 0,
      openRate: 0,
      clickRate: 0,
      sentAt: undefined,
      scheduledAt: input.scheduledAt || undefined
    } satisfies CampaignSummary;
  }

  const existingCampaign = await getLiveCampaignRow(campaignId);

  if (!existingCampaign) {
    throw new AppError("Campaign not found.", "NOT_FOUND", 404);
  }

  const nextStatus =
    existingCampaign.status === "sent" || existingCampaign.status === "failed"
      ? existingCampaign.status
      : input.scheduledAt
        ? "scheduled"
        : "draft";

  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("campaigns")
    .update({
      name: input.name,
      subject: input.subject,
      preview_text: input.previewText,
      audience: input.audience,
      template_type: input.templateType,
      marketing_category: input.marketingCategory,
      segment_key: input.segmentKey,
      content_mode: input.contentMode,
      content_json: input.contentJson,
      markdown_content: input.markdownContent || null,
      html_content: input.htmlContent,
      google_doc_id: input.googleDocId || null,
      google_doc_url: input.googleDocUrl || null,
      status: nextStatus,
      scheduled_at: input.scheduledAt || null,
      updated_at: new Date().toISOString()
    })
    .eq("id", campaignId)
    .select("*")
    .single();

  if (error) {
    throw new AppError(error.message, "CAMPAIGN_UPDATE_FAILED");
  }

  return toCampaignSummary(data, 0);
}

async function getProfilesByAudience(audience: CampaignSummary["audience"]) {
  const supabase = createAdminSupabaseClient();
  const roles =
    audience === "both"
      ? ["organiser", "staff"]
      : audience === "clients"
        ? ["organiser"]
        : ["staff"];

  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, full_name, email, role, marketing_preferences(newsletter_opt_in, offers_opt_in, product_updates_opt_in, unsubscribe_token, email_normalized)"
    )
    .in("role", roles);

  if (error) {
    throw new AppError(error.message, "RECIPIENT_QUERY_FAILED");
  }

  return (data ?? []).map((row: Record<string, unknown>) => ({
    profileId: String(row.id),
    fullName: String(row.full_name),
    email: String(row.email),
    emailNormalized: normalizeEmail(String(row.email)),
    role: row.role as Recipient["role"],
    newsletterOptIn:
      Array.isArray(row.marketing_preferences) && row.marketing_preferences[0]
        ? Boolean((row.marketing_preferences[0] as Record<string, unknown>).newsletter_opt_in)
        : false,
    offersOptIn:
      Array.isArray(row.marketing_preferences) && row.marketing_preferences[0]
        ? Boolean((row.marketing_preferences[0] as Record<string, unknown>).offers_opt_in)
        : false,
    productUpdatesOptIn:
      Array.isArray(row.marketing_preferences) && row.marketing_preferences[0]
        ? Boolean((row.marketing_preferences[0] as Record<string, unknown>).product_updates_opt_in)
        : false,
    unsubscribeToken:
      Array.isArray(row.marketing_preferences) && row.marketing_preferences[0]
        ? String((row.marketing_preferences[0] as Record<string, unknown>).unsubscribe_token ?? "")
        : undefined
  })) as Recipient[];
}

async function resolveCampaignRecipients(campaign: CampaignSummary) {
  if (getRuntimeMode() !== "live") {
    const data = await getAdminDataset();
    const recipients =
      campaign.audience === "clients"
        ? (data.clients.map((client) => ({
            email: client.primaryContactEmail,
            fullName: client.primaryContactName,
            role: "organiser" as const
          })) as Recipient[])
        : campaign.audience === "operators"
          ? (data.operators.map((operator) => ({
              email: operator.email,
              fullName: operator.displayName,
              role: "staff" as const
            })) as Recipient[])
          : ([
              ...data.clients.map((client) => ({
                email: client.primaryContactEmail,
                fullName: client.primaryContactName,
                role: "organiser" as const
              })),
              ...data.operators.map((operator) => ({
                email: operator.email,
                fullName: operator.displayName,
                role: "staff" as const
              }))
            ] as Recipient[]);

    return recipients;
  }

  const recipients = await getProfilesByAudience(campaign.audience);
  const uniqueRecipients = new Map<string, Recipient>();

  for (const recipient of recipients) {
    uniqueRecipients.set(recipient.emailNormalized ?? normalizeEmail(recipient.email), recipient);
  }

  const dedupedRecipients = Array.from(uniqueRecipients.values());
  const suppressedEmails = await listActiveSuppressions(
    dedupedRecipients.map((recipient) => recipient.emailNormalized ?? normalizeEmail(recipient.email))
  );

  return dedupedRecipients.filter((recipient) => {
    const emailNormalized = recipient.emailNormalized ?? normalizeEmail(recipient.email);

    if (suppressedEmails.has(emailNormalized)) {
      return false;
    }

    return shouldReceiveMarketingCategory(recipient, campaign.marketingCategory);
  });
}

async function upsertCampaignRecipient(
  campaignId: string,
  recipient: Recipient,
  status: "pending" | "sent" | "failed",
  failedReason?: string,
  providerMessageId?: string,
  providerEmailId?: string
) {
  if (getRuntimeMode() !== "live") {
    return;
  }

  const supabase = createAdminSupabaseClient();
  await supabase.from("campaign_recipients").insert({
    campaign_id: campaignId,
    profile_id: recipient.profileId ?? null,
    email: recipient.email,
    recipient_type: recipient.role,
    delivery_status: status,
    provider_message_id: providerMessageId ?? null,
    provider_email_id: providerEmailId ?? null,
    delivered_at: status === "sent" ? new Date().toISOString() : null,
    failed_reason: failedReason ?? null
  });
}

function renderTemplateHtml(
  template: EmailTemplate,
  subject: string,
  overrides?: {
    previewText?: string;
    bodyHtml?: string;
    ctaLabel?: string;
    ctaUrl?: string;
    footerHtml?: string;
  }
) {
  return renderEmailShell({
    eyebrow: template.name,
    title: subject,
    preheader: overrides?.previewText ?? template.previewText,
    bodyHtml: overrides?.bodyHtml ?? template.bodyHtml,
    ctaLabel: overrides?.ctaLabel,
    ctaUrl: overrides?.ctaUrl,
    footerHtml: overrides?.footerHtml
  });
}

export async function sendTransactionalTemplateEmail(input: {
  templateType: EmailTemplateType;
  to: string;
  profileId?: string;
  recipientName?: string;
  subject?: string;
  previewText?: string;
  bodyHtml?: string;
  bodyMarkdown?: string;
  ctaLabel?: string;
  ctaUrl?: string;
  footerHtml?: string;
  unsubscribeToken?: string;
  category?: "transactional" | "marketing";
  eventKey?: string;
  metadata?: Record<string, unknown>;
}) {
  if (input.eventKey && getRuntimeMode() === "live") {
    const existingDelivery = await getExistingDeliveryByEventKey(input.eventKey);

    if (existingDelivery && existingDelivery.status !== "failed") {
      return {
        provider: existingDelivery.provider,
        status: existingDelivery.status,
        messageId: existingDelivery.id
      };
    }
  }

  const templates = await getAdminEmailTemplates();
  const template =
    templates.find((entry) => entry.templateType === input.templateType) ??
    getDefaultEmailTemplate(input.templateType);
  const subject = input.subject ?? template.subjectTemplate;
  const category = input.category ?? "transactional";
  const messageId = createOutboundMessageId();
  const html = renderTemplateHtml(template, subject, {
    previewText: input.previewText,
    bodyHtml: input.bodyHtml,
    ctaLabel: input.ctaLabel,
    ctaUrl: input.ctaUrl,
    footerHtml:
      category === "marketing"
        ? input.footerHtml || buildMarketingFooter(input.unsubscribeToken)
        : input.footerHtml
  });
  const result = await sendMail({
    to: input.to,
    subject,
    html,
    text: stripHtml(input.bodyMarkdown ?? template.bodyMarkdown ?? input.bodyHtml ?? template.bodyHtml),
    headers: category === "marketing" ? buildListUnsubscribeHeaders(input.unsubscribeToken) : undefined,
    messageId
  });

  await logEmailDelivery({
    templateType: input.templateType,
    profileId: input.profileId,
    eventKey: input.eventKey,
    category,
    recipientEmail: input.to,
    recipientName: input.recipientName,
    subject,
    provider: result.provider,
    status: result.status,
    providerMessageId: result.messageId,
    metadata: input.metadata
  });

  return result;
}

export async function sendPasswordResetEmail(input: {
  to: string;
  recipientName?: string;
  resetUrl: string;
}) {
  const bodyMarkdown = `# Password reset request
Use the secure link below to reset your Athena Pro password.

- If you requested this, continue using the reset link
- If you did not request this, you can ignore this email
- Contact Athena support if the request appears suspicious`;

  return sendTransactionalTemplateEmail({
    templateType: "password_reset",
    to: input.to,
    recipientName: input.recipientName,
    bodyMarkdown,
    bodyHtml: markdownToHtml(bodyMarkdown),
    ctaLabel: "Reset password",
    ctaUrl: input.resetUrl
  });
}

export async function sendJobConfirmationEmails(input: { applicationId: string }) {
  if (getRuntimeMode() !== "live") {
    return;
  }

  const supabase = createAdminSupabaseClient();
  const { data: application, error: applicationError } = await supabase
    .from("applications")
    .select("id, job_id, staff_id, status")
    .eq("id", input.applicationId)
    .single();

  if (applicationError || !application) {
    throw new AppError(applicationError?.message ?? "Application not found.", "APPLICATION_QUERY_FAILED");
  }

  if (application.status !== "accepted") {
    return;
  }

  const [{ data: job, error: jobError }, { data: operator, error: operatorError }] = await Promise.all([
    supabase
      .from("jobs")
      .select("id, title, shift_start, shift_end, pay_rate, created_by, event_id, organization_id, organizations(name), events(title, location)")
      .eq("id", application.job_id)
      .single(),
    supabase.from("profiles").select("id, full_name, email").eq("id", application.staff_id).single()
  ]);

  if (jobError || !job || operatorError || !operator) {
    throw new AppError(
      jobError?.message ?? operatorError?.message ?? "Unable to load job confirmation context.",
      "JOB_CONFIRMATION_CONTEXT_FAILED"
    );
  }

  const { data: clientProfile } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .eq("id", job.created_by)
    .maybeSingle();

  const organizationRow = Array.isArray(job.organizations) ? job.organizations[0] : job.organizations;
  const eventRow = Array.isArray(job.events) ? job.events[0] : job.events;
  const organizationName = String((organizationRow as Record<string, unknown> | null)?.name ?? "Athena Pro client");
  const eventTitle = String((eventRow as Record<string, unknown> | null)?.title ?? "Live event");
  const eventLocation = String((eventRow as Record<string, unknown> | null)?.location ?? "Location to be confirmed");

  const operatorMarkdown = `# Assignment confirmed
You have been confirmed for **${job.title}**.

- Client: ${organizationName}
- Event: ${eventTitle}
- Location: ${eventLocation}
- Shift: ${new Date(job.shift_start).toLocaleString("en-GB")} to ${new Date(job.shift_end).toLocaleString("en-GB")}
- Pay: GBP ${Number(job.pay_rate ?? 0).toFixed(2)} per hour

Check your Athena Pro workspace for any final briefing notes or arrival instructions.`;

  await sendTransactionalTemplateEmail({
    templateType: "job_confirmation_operator",
    to: String(operator.email),
    profileId: String(operator.id),
    recipientName: String(operator.full_name ?? ""),
    subject: `Confirmed: ${job.title} with ${organizationName}`,
    previewText: `Your Athena Pro assignment for ${eventTitle} is now confirmed.`,
    bodyMarkdown: operatorMarkdown,
    bodyHtml: markdownToHtml(operatorMarkdown),
    eventKey: `job_confirmation_operator:${application.id}`,
    metadata: {
      applicationId: application.id,
      jobId: job.id,
      profileId: operator.id
    }
  });

  if (clientProfile?.email) {
    const clientMarkdown = `# Operator confirmed
An operator has now been confirmed for **${job.title}**.

- Operator: ${String(operator.full_name ?? "Confirmed operator")}
- Event: ${eventTitle}
- Location: ${eventLocation}
- Shift: ${new Date(job.shift_start).toLocaleString("en-GB")} to ${new Date(job.shift_end).toLocaleString("en-GB")}
- Rate: GBP ${Number(job.pay_rate ?? 0).toFixed(2)} per hour

Use the Athena Pro workspace for any final brief updates, access notes, or delivery changes.`;

    await sendTransactionalTemplateEmail({
      templateType: "job_confirmation_client",
      to: String(clientProfile.email),
      profileId: String(clientProfile.id ?? ""),
      recipientName: String(clientProfile.full_name ?? ""),
      subject: `Operator confirmed: ${job.title}`,
      previewText: `${String(operator.full_name ?? "An operator")} has been confirmed for ${eventTitle}.`,
      bodyMarkdown: clientMarkdown,
      bodyHtml: markdownToHtml(clientMarkdown),
      eventKey: `job_confirmation_client:${application.id}`,
      metadata: {
        applicationId: application.id,
        jobId: job.id,
        profileId: clientProfile.id ?? null
      }
    });
  }
}

export async function sendOnboardingApprovedEmail(input: {
  profileId: string;
  role: "organiser" | "staff";
  email: string;
  recipientName?: string;
}) {
  if (getRuntimeMode() !== "live") {
    return;
  }

  await sendTransactionalTemplateEmail({
    templateType: input.role === "organiser" ? "client_onboarding_approved" : "operator_onboarding_approved",
    to: input.email,
    profileId: input.profileId,
    recipientName: input.recipientName,
    eventKey: `${input.role}_onboarding_approved:${input.profileId}`
  });
}

export async function processSmtp2goWebhook(payload: Record<string, unknown>) {
  if (getRuntimeMode() !== "live") {
    return { ok: true, ignored: true };
  }

  const eventType = String(payload.event ?? "").toLowerCase();
  const recipientEmail = normalizeEmail(String(payload.rcpt ?? ""));
  const providerMessageId = String(payload["message-id"] ?? "");
  const providerEmailId = String(payload.email_id ?? "");
  const providerEventId = String(payload.id ?? "");
  const eventAt = coerceWebhookTimestamp(payload.time ?? payload.sendtime);
  const message = String(payload.message ?? payload.context ?? "");

  if (!eventType || !recipientEmail) {
    return { ok: true, ignored: true };
  }

  const supabase = createAdminSupabaseClient();
  await supabase.from("email_webhook_events").insert({
    provider: "smtp2go",
    provider_event_id: providerEventId || null,
    provider_email_id: providerEmailId || null,
    provider_message_id: providerMessageId || null,
    recipient_email: recipientEmail,
    event_type: eventType,
    event_at: eventAt,
    payload
  });

  const deliveryStatus = mapSmtp2goEventToDeliveryStatus(eventType);
  const delivery = providerMessageId
    ? await getDeliveryByProviderMessageId(providerMessageId, recipientEmail)
    : null;

  const deliveryUpdate: Record<string, unknown> = {
    status: deliveryStatus,
    provider_email_id: providerEmailId || null,
    last_event: eventType,
    last_event_at: eventAt
  };

  if (message) {
    deliveryUpdate.error_message = message;
  }

  if (eventType === "delivered") {
    deliveryUpdate.delivered_at = eventAt;
  }

  if (eventType === "open") {
    deliveryUpdate.opened_at = eventAt;
  }

  if (eventType === "click") {
    deliveryUpdate.clicked_at = eventAt;
  }

  if (eventType === "bounce") {
    deliveryUpdate.bounced_at = eventAt;
  }

  if (eventType === "spam") {
    deliveryUpdate.complained_at = eventAt;
  }

  if (eventType === "unsubscribe") {
    deliveryUpdate.unsubscribed_at = eventAt;
  }

  if (eventType === "reject") {
    deliveryUpdate.rejected_at = eventAt;
  }

  if (delivery?.id) {
    await supabase.from("email_deliveries").update(deliveryUpdate).eq("id", delivery.id);
  }

  if (delivery?.campaign_id || providerMessageId) {
    const campaignRecipientUpdate: Record<string, unknown> = {
      provider_email_id: providerEmailId || null,
      last_event: eventType,
      last_event_at: eventAt
    };

    if (eventType === "delivered") {
      campaignRecipientUpdate.delivery_status = "sent";
      campaignRecipientUpdate.delivered_at = eventAt;
    }

    if (eventType === "open") {
      campaignRecipientUpdate.opened_at = eventAt;
    }

    if (eventType === "click") {
      campaignRecipientUpdate.clicked_at = eventAt;
    }

    if (eventType === "bounce") {
      campaignRecipientUpdate.delivery_status = "failed";
      campaignRecipientUpdate.bounced_at = eventAt;
      campaignRecipientUpdate.failed_reason = message || "SMTP2GO reported a bounce.";
    }

    if (eventType === "spam") {
      campaignRecipientUpdate.delivery_status = "failed";
      campaignRecipientUpdate.complained_at = eventAt;
      campaignRecipientUpdate.failed_reason = "Recipient marked this email as spam.";
    }

    if (eventType === "unsubscribe") {
      campaignRecipientUpdate.unsubscribed_at = eventAt;
    }

    if (eventType === "reject") {
      campaignRecipientUpdate.delivery_status = "failed";
      campaignRecipientUpdate.rejected_at = eventAt;
      campaignRecipientUpdate.failed_reason = message || "SMTP2GO rejected this email.";
    }

    let query = supabase.from("campaign_recipients").update(campaignRecipientUpdate);

    if (providerMessageId) {
      query = query.eq("provider_message_id", providerMessageId);
    } else if (delivery?.campaign_id) {
      query = query.eq("campaign_id", String(delivery.campaign_id)).eq("email", String(delivery.recipient_email ?? recipientEmail));
    } else {
      query = query.eq("email", recipientEmail);
    }

    await query;
  }

  if (["bounce", "spam", "unsubscribe", "reject"].includes(eventType)) {
    const reason = eventType === "spam" ? "complaint" : eventType;
    await upsertEmailSuppression({
      emailNormalized: recipientEmail,
      reason,
      source: "smtp2go_webhook",
      details: payload
    });
    await applyMarketingOptOutByEmail(recipientEmail, "smtp2go_webhook");
  }

  if (eventType === "resubscribe") {
    await clearEmailSuppression(recipientEmail, "smtp2go_webhook");
  }

  return { ok: true, eventType };
}

export async function sendCampaignTest(campaignId: string, email: string, recipientName?: string) {
  const campaign = await getAdminCampaignByIdLiveAware(campaignId);

  if (!campaign) {
    throw new AppError("Campaign not found.", "NOT_FOUND", 404);
  }

  const htmlBody = buildCampaignPreviewHtml(campaign);
  const html = renderEmailShell({
    eyebrow: campaign.name,
    title: campaign.subject,
    preheader: campaign.previewText,
    bodyHtml: htmlBody
  });

  const result = await sendMail({
    to: email,
    subject: `[Test] ${campaign.subject}`,
    html,
    text: stripHtml(campaign.markdownContent || campaign.htmlContent),
    headers: buildListUnsubscribeHeaders(undefined),
    messageId: createOutboundMessageId()
  });

  await logEmailDelivery({
    templateType: campaign.templateType,
    campaignId: campaign.id,
    category: "marketing",
    recipientEmail: email,
    recipientName,
    subject: `[Test] ${campaign.subject}`,
    provider: result.provider,
    status: result.status,
    providerMessageId: result.messageId
  });

  return result;
}

export async function scheduleCampaign(campaignId: string, scheduledAt: string) {
  if (getRuntimeMode() !== "live") {
    return { id: campaignId, scheduledAt };
  }

  const supabase = createAdminSupabaseClient();
  const { error } = await supabase
    .from("campaigns")
    .update({
      scheduled_at: scheduledAt,
      status: "scheduled",
      updated_at: new Date().toISOString()
    })
    .eq("id", campaignId);

  if (error) {
    throw new AppError(error.message, "CAMPAIGN_SCHEDULE_FAILED");
  }

  return { id: campaignId, scheduledAt };
}

export async function sendCampaignNow(campaignId: string) {
  const campaign = await getAdminCampaignByIdLiveAware(campaignId);

  if (!campaign) {
    throw new AppError("Campaign not found.", "NOT_FOUND", 404);
  }

  const recipients = await resolveCampaignRecipients(campaign);

  if (recipients.length === 0) {
    if (getRuntimeMode() === "live") {
      const supabase = createAdminSupabaseClient();
      await supabase
        .from("campaigns")
        .update({
          status: "failed",
          updated_at: new Date().toISOString()
        })
        .eq("id", campaign.id);
    }

    throw new AppError("No eligible recipients matched this campaign.", "NO_CAMPAIGN_RECIPIENTS", 400);
  }

  const bodyHtml = buildCampaignPreviewHtml(campaign);

  let sentCount = 0;
  let failedCount = 0;

  await Promise.all(
    recipients.map(async (recipient) => {
      try {
        const emailHtml = renderEmailShell({
          eyebrow: campaign.name,
          title: campaign.subject,
          preheader: campaign.previewText,
          bodyHtml,
          footerHtml: buildMarketingFooter(recipient.unsubscribeToken)
        });
        const messageId = createOutboundMessageId();

        const result = await sendMail({
          to: recipient.email,
          subject: campaign.subject,
          html: emailHtml,
          text: stripHtml(campaign.markdownContent || campaign.htmlContent),
          headers: buildListUnsubscribeHeaders(recipient.unsubscribeToken),
          messageId
        });

        sentCount += 1;

        await upsertCampaignRecipient(campaign.id, recipient, "sent", undefined, result.messageId);
        await logEmailDelivery({
          templateType: campaign.templateType,
          campaignId: campaign.id,
          profileId: recipient.profileId,
          category: "marketing",
          recipientEmail: recipient.email,
          recipientName: recipient.fullName,
          subject: campaign.subject,
          provider: result.provider,
          status: result.status,
          providerMessageId: result.messageId,
          metadata: {
            marketingCategory: campaign.marketingCategory,
            segmentKey: campaign.segmentKey
          }
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to send campaign email.";
        failedCount += 1;
        await upsertCampaignRecipient(campaign.id, recipient, "failed", message);
        await logEmailDelivery({
          templateType: campaign.templateType,
          campaignId: campaign.id,
          profileId: recipient.profileId,
          category: "marketing",
          recipientEmail: recipient.email,
          recipientName: recipient.fullName,
          subject: campaign.subject,
          provider: "smtp2go",
          status: "failed",
          errorMessage: message
        });
      }
    })
  );

  if (getRuntimeMode() === "live") {
    const supabase = createAdminSupabaseClient();
    const finalStatus =
      failedCount === recipients.length
        ? "failed"
        : sentCount === recipients.length
          ? "sent"
          : "sending";

    await supabase
      .from("campaigns")
      .update({
        status: finalStatus,
        sent_at: sentCount > 0 ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      })
      .eq("id", campaign.id);
  }

  return {
    campaignId,
    recipientCount: recipients.length,
    sentCount,
    queuedCount: 0,
    failedCount
  };
}

export async function listGoogleDocs(accessToken: string) {
  const response = await fetch(
    "https://www.googleapis.com/drive/v3/files?q=mimeType='application/vnd.google-apps.document'&pageSize=25&fields=files(id,name,webViewLink,modifiedTime)",
    {
      headers: {
        Authorization: `Bearer ${accessToken}`
      },
      cache: "no-store"
    }
  );

  if (!response.ok) {
    throw new AppError("Unable to load Google Docs.", "GOOGLE_DOC_LIST_FAILED", response.status);
  }

  const payload = (await response.json()) as {
    files?: Array<{ id: string; name: string; webViewLink?: string; modifiedTime?: string }>;
  };

  return payload.files ?? [];
}

export async function importGoogleDoc(accessToken: string, fileId: string) {
  const metadataResponse = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?fields=id,name,webViewLink`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`
      },
      cache: "no-store"
    }
  );

  if (!metadataResponse.ok) {
    throw new AppError("Unable to load Google Doc metadata.", "GOOGLE_DOC_METADATA_FAILED", metadataResponse.status);
  }

  const metadata = (await metadataResponse.json()) as {
    id: string;
    name: string;
    webViewLink?: string;
  };

  const exportResponse = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=text/html`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`
      },
      cache: "no-store"
    }
  );

  if (!exportResponse.ok) {
    throw new AppError("Unable to import Google Doc.", "GOOGLE_DOC_IMPORT_FAILED", exportResponse.status);
  }

  const htmlContent = await exportResponse.text();
  const plainText = stripHtml(htmlContent);

  return {
    name: metadata.name,
    subject: metadata.name,
    previewText: plainText.slice(0, 140),
    contentMode: "rich" as const,
    htmlContent,
    markdownContent: plainText,
    contentJson: [
      {
        id: generateId("block"),
        type: "text" as const,
        content: plainText
      }
    ],
    googleDocId: metadata.id,
    googleDocUrl: metadata.webViewLink ?? ""
  };
}

export function buildGoogleAuthUrl() {
  if (!env.hasGoogleOAuth) {
    throw new AppError("Google OAuth is not configured.", "GOOGLE_OAUTH_NOT_CONFIGURED", 500);
  }

  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", env.googleClientId);
  url.searchParams.set("redirect_uri", env.googleRedirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile https://www.googleapis.com/auth/drive.readonly");
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");
  return url.toString();
}

export async function exchangeGoogleCode(code: string) {
  if (!env.hasGoogleOAuth) {
    throw new AppError("Google OAuth is not configured.", "GOOGLE_OAUTH_NOT_CONFIGURED", 500);
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      code,
      client_id: env.googleClientId,
      client_secret: env.googleClientSecret,
      redirect_uri: env.googleRedirectUri,
      grant_type: "authorization_code"
    })
  });

  if (!response.ok) {
    throw new AppError("Unable to complete Google OAuth.", "GOOGLE_OAUTH_FAILED", response.status);
  }

  return (await response.json()) as {
    access_token: string;
    expires_in: number;
    refresh_token?: string;
  };
}
