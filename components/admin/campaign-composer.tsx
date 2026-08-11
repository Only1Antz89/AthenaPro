"use client";

import Link from "next/link";
import { startTransition, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Link2, RefreshCcw, Send, Upload, WandSparkles } from "lucide-react";
import { toast } from "sonner";
import { AdminDataTable } from "@/components/admin/data-table";
import { InsightCard } from "@/components/admin/insight-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { markdownToHtml, renderEmailShell } from "@/lib/email/content";
import { getRuntimeMode } from "@/lib/env";
import { toDisplayError } from "@/lib/errors";
import { generateId } from "@/lib/utils";
import { createCampaignSchema } from "@/lib/validation/campaign";
import { EMAIL_TEMPLATE_LABELS, EMAIL_TEMPLATE_TYPES } from "@/types/admin";
import type { CampaignDetail, EmailDelivery, EmailTemplate, EmailTemplateType } from "@/types/admin";

function toTemplateContentJson(mode: "rich" | "markdown", value: string) {
  return [
    {
      id: generateId("block"),
      type: mode === "markdown" ? "markdown" : "text",
      content: value
    }
  ];
}

export function CampaignComposer({
  initialCampaign,
  templates,
  deliveries = []
}: {
  initialCampaign?: CampaignDetail | null;
  templates: EmailTemplate[];
  deliveries?: EmailDelivery[];
}) {
  const router = useRouter();
  const editorRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [submitting, setSubmitting] = useState<null | "save" | "test" | "schedule" | "send">(null);
  const [docs, setDocs] = useState<Array<{ id: string; name: string; webViewLink?: string }>>([]);
  const [googleConnected, setGoogleConnected] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState("");
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [form, setForm] = useState({
    name: initialCampaign?.name ?? "",
    subject: initialCampaign?.subject ?? "",
    previewText: initialCampaign?.previewText ?? "",
    audience: initialCampaign?.audience ?? ("both" as const),
    templateType: initialCampaign?.templateType ?? ("newsletter" as EmailTemplateType),
    marketingCategory: initialCampaign?.marketingCategory ?? ("news" as const),
    segmentKey: initialCampaign?.segmentKey ?? "all",
    contentMode: initialCampaign?.contentMode ?? ("rich" as const),
    htmlContent: initialCampaign?.htmlContent ?? "",
    markdownContent: initialCampaign?.markdownContent ?? "",
    googleDocId: initialCampaign?.googleDocId ?? "",
    googleDocUrl: initialCampaign?.googleDocUrl ?? "",
    scheduledAt: initialCampaign?.scheduledAt
      ? new Date(initialCampaign.scheduledAt).toISOString().slice(0, 16)
      : ""
  });

  const previewBodyHtml = useMemo(
    () => (form.contentMode === "markdown" ? markdownToHtml(form.markdownContent) : form.htmlContent),
    [form.contentMode, form.htmlContent, form.markdownContent]
  );
  const previewHtml = useMemo(
    () =>
      renderEmailShell({
        eyebrow: form.name || "Campaign preview",
        title: form.subject || "Subject preview",
        preheader: form.previewText || "Preview text",
        bodyHtml: previewBodyHtml || "<p>Start writing to preview your campaign.</p>"
      }),
    [form.name, form.previewText, form.subject, previewBodyHtml]
  );

  useEffect(() => {
    if (form.contentMode !== "rich" || !editorRef.current) {
      return;
    }

    if (editorRef.current.innerHTML !== form.htmlContent) {
      editorRef.current.innerHTML = form.htmlContent;
    }
  }, [form.contentMode, form.htmlContent]);

  async function loadDocs() {
    try {
      setLoadingDocs(true);
      const response = await fetch("/api/admin/google/docs", { cache: "no-store" });

      if (response.status === 401) {
        setGoogleConnected(false);
        setDocs([]);
        return;
      }

      const payload = (await response.json()) as Array<{ id: string; name: string; webViewLink?: string }>;
      setDocs(payload);
      setGoogleConnected(true);
    } catch (error) {
      toast.error(toDisplayError(error));
    } finally {
      setLoadingDocs(false);
    }
  }

  useEffect(() => {
    void loadDocs();
  }, []);

  function applyTemplate(templateType: EmailTemplateType) {
    const template = templates.find((entry) => entry.templateType === templateType);

    if (!template) {
      return;
    }

    setForm((current) => ({
      ...current,
      templateType,
      subject: current.subject || template.subjectTemplate,
      previewText: current.previewText || template.previewText,
      contentMode: current.contentMode,
      htmlContent: current.htmlContent || template.bodyHtml,
      markdownContent: current.markdownContent || template.bodyMarkdown || ""
    }));
  }

  async function saveCampaign() {
    const payload = createCampaignSchema.parse({
      ...form,
      htmlContent: form.contentMode === "markdown" ? markdownToHtml(form.markdownContent) : form.htmlContent,
      markdownContent: form.markdownContent,
      contentJson: toTemplateContentJson(
        form.contentMode,
        form.contentMode === "markdown" ? form.markdownContent : form.htmlContent
      )
    });

    const url = initialCampaign ? `/api/admin/campaigns/${initialCampaign.id}` : "/api/admin/campaigns";
    const method = initialCampaign ? "PATCH" : "POST";
    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error("Unable to save campaign.");
    }

    const campaign = (await response.json()) as CampaignDetail;
    toast.success(initialCampaign ? "Campaign updated." : "Campaign created.");

    if (!initialCampaign) {
      if (getRuntimeMode() !== "live") {
        return;
      }

      router.push(`/admin/communications/campaigns/${campaign.id}`);
      return;
    }

    startTransition(() => router.refresh());
  }

  function syncRichEditor() {
    setForm((current) => ({
      ...current,
      htmlContent: editorRef.current?.innerHTML ?? ""
    }));
  }

  function runRichCommand(command: string, value?: string) {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    syncRichEditor();
  }

  const campaignId = initialCampaign?.id;
  const campaignDeliveries = deliveries.filter((delivery) => delivery.campaignId === campaignId);

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate">Composer</p>
              <h3 className="mt-3 text-2xl font-semibold text-ink">Campaign authoring studio</h3>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="accent">{EMAIL_TEMPLATE_LABELS[form.templateType]}</Badge>
              <Badge variant="neutral">{form.contentMode}</Badge>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <Field label="Campaign name">
              <Input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
            </Field>
            <Field label="Template type">
              <Select
                value={form.templateType}
                onChange={(event) => {
                  const nextType = event.target.value as EmailTemplateType;
                  setForm((current) => ({ ...current, templateType: nextType }));
                  applyTemplate(nextType);
                }}
              >
                {EMAIL_TEMPLATE_TYPES.map((templateType) => (
                  <option key={templateType} value={templateType}>
                    {EMAIL_TEMPLATE_LABELS[templateType]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Subject">
              <Input value={form.subject} onChange={(event) => setForm((current) => ({ ...current, subject: event.target.value }))} />
            </Field>
            <Field label="Preview text">
              <Input value={form.previewText} onChange={(event) => setForm((current) => ({ ...current, previewText: event.target.value }))} />
            </Field>
            <Field label="Audience">
              <Select
                value={form.audience}
                onChange={(event) =>
                  setForm((current) => ({ ...current, audience: event.target.value as "clients" | "operators" | "both" }))
                }
              >
                <option value="clients">Clients</option>
                <option value="operators">Operators</option>
                <option value="both">Both</option>
              </Select>
            </Field>
            <Field label="Segment key">
              <Select
                value={form.segmentKey}
                onChange={(event) => setForm((current) => ({ ...current, segmentKey: event.target.value }))}
              >
                <option value="all">All</option>
                <option value="active_clients">Active clients</option>
                <option value="inactive_operators">Inactive operators</option>
                <option value="top_spend">Top spend</option>
                <option value="top_rated">Top rated</option>
                <option value="onboarding_incomplete">Onboarding incomplete</option>
              </Select>
            </Field>
            <Field label="Marketing category">
              <Select
                value={form.marketingCategory}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    marketingCategory: event.target.value as "news" | "offers" | "updates"
                  }))
                }
              >
                <option value="news">News</option>
                <option value="offers">Offers</option>
                <option value="updates">Updates</option>
              </Select>
            </Field>
            <Field label="Content mode">
              <Select
                value={form.contentMode}
                onChange={(event) =>
                  setForm((current) => ({ ...current, contentMode: event.target.value as "rich" | "markdown" }))
                }
              >
                <option value="rich">Rich editor</option>
                <option value="markdown">Markdown</option>
              </Select>
            </Field>
            <Field label="Schedule">
              <Input
                type="datetime-local"
                value={form.scheduledAt}
                onChange={(event) => setForm((current) => ({ ...current, scheduledAt: event.target.value }))}
              />
            </Field>
          </div>

          <div className="mt-6 rounded-[24px] border border-white/[0.08] bg-white/[0.02] p-4">
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" variant="secondary" className="px-4 py-2" onClick={() => runRichCommand("bold")}>
                Bold
              </Button>
              <Button type="button" variant="secondary" className="px-4 py-2" onClick={() => runRichCommand("italic")}>
                Italic
              </Button>
              <Button type="button" variant="secondary" className="px-4 py-2" onClick={() => runRichCommand("formatBlock", "<h1>")}>
                H1
              </Button>
              <Button type="button" variant="secondary" className="px-4 py-2" onClick={() => runRichCommand("formatBlock", "<h2>")}>
                H2
              </Button>
              <Button type="button" variant="secondary" className="px-4 py-2" onClick={() => runRichCommand("insertUnorderedList")}>
                List
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="gap-2 px-4 py-2"
                onClick={() => {
                  const href = window.prompt("Paste the link URL");
                  if (href) {
                    runRichCommand("createLink", href);
                  }
                }}
              >
                <Link2 className="h-4 w-4" />
                Link
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="gap-2 px-4 py-2"
                onClick={() => {
                  const src = window.prompt("Paste the image URL");
                  if (src) {
                    runRichCommand("insertImage", src);
                  }
                }}
              >
                <ImagePlus className="h-4 w-4" />
                Image URL
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="gap-2 px-4 py-2"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4" />
                Upload image
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];

                  if (!file) {
                    return;
                  }

                  const reader = new FileReader();
                  reader.onload = () => {
                    if (typeof reader.result === "string") {
                      runRichCommand("insertImage", reader.result);
                    }
                  };
                  reader.readAsDataURL(file);
                }}
              />
            </div>

            {form.contentMode === "rich" ? (
              <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                className="mt-4 min-h-[260px] rounded-[18px] border border-white/[0.08] bg-white/[0.03] px-4 py-4 text-sm text-ink outline-none focus:border-accent"
                onInput={syncRichEditor}
              />
            ) : (
              <div className="mt-4">
                <Field label="Markdown body">
                  <Textarea
                    value={form.markdownContent}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, markdownContent: event.target.value }))
                    }
                    className="min-h-[260px]"
                  />
                </Field>
              </div>
            )}
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-[1fr_auto_auto_auto]">
            <Button
              type="button"
              disabled={submitting !== null}
              onClick={async () => {
                try {
                  setSubmitting("save");
                  await saveCampaign();
                } catch (error) {
                  toast.error(toDisplayError(error));
                } finally {
                  setSubmitting(null);
                }
              }}
            >
              {submitting === "save" ? "Saving..." : "Save draft"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={!campaignId || submitting !== null}
              onClick={async () => {
                try {
                  setSubmitting("test");
                  const response = await fetch(`/api/admin/campaigns/${campaignId}/test`, {
                    method: "POST"
                  });

                  if (!response.ok) {
                    throw new Error("Unable to send test email.");
                  }

                  toast.success("Test send delivered to the admin email.");
                  startTransition(() => router.refresh());
                } catch (error) {
                  toast.error(toDisplayError(error));
                } finally {
                  setSubmitting(null);
                }
              }}
            >
              {submitting === "test" ? "Sending test..." : "Send test"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={!campaignId || !form.scheduledAt || submitting !== null}
              onClick={async () => {
                try {
                  setSubmitting("schedule");
                  const response = await fetch(`/api/admin/campaigns/${campaignId}/schedule`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ scheduledAt: new Date(form.scheduledAt).toISOString() })
                  });

                  if (!response.ok) {
                    throw new Error("Unable to schedule campaign.");
                  }

                  toast.success("Campaign scheduled.");
                  startTransition(() => router.refresh());
                } catch (error) {
                  toast.error(toDisplayError(error));
                } finally {
                  setSubmitting(null);
                }
              }}
            >
              {submitting === "schedule" ? "Scheduling..." : "Schedule"}
            </Button>
            <Button
              type="button"
              variant="accent"
              disabled={!campaignId || submitting !== null}
              onClick={async () => {
                try {
                  setSubmitting("send");
                  const response = await fetch(`/api/admin/campaigns/${campaignId}/send`, {
                    method: "POST"
                  });

                  if (!response.ok) {
                    throw new Error("Unable to send campaign.");
                  }

                  const payload = (await response.json()) as { recipientCount: number };
                  toast.success(`Campaign sent to ${payload.recipientCount} recipients.`);
                  startTransition(() => router.refresh());
                } catch (error) {
                  toast.error(toDisplayError(error));
                } finally {
                  setSubmitting(null);
                }
              }}
            >
              <Send className="mr-2 h-4 w-4" />
              {submitting === "send" ? "Sending..." : "Send now"}
            </Button>
          </div>
        </Card>

        <div className="space-y-6">
          <InsightCard title="Athena preview" description="Live email shell preview using the current campaign state.">
            <iframe
              title="Campaign preview"
              className="min-h-[520px] w-full rounded-[24px] border border-white/[0.08] bg-white"
              srcDoc={previewHtml}
            />
          </InsightCard>

          <InsightCard
            title="Google Docs import"
            description="Connect Google, choose a Doc, and import its content into the current draft."
          >
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  variant="secondary"
                  className="gap-2"
                  // OAuth must use a document navigation so the route handler can
                  // redirect the browser to Google's authorization endpoint.
                  // eslint-disable-next-line @next/next/no-location-assign-relative-destination
                  onClick={() => window.location.assign("/api/admin/google/oauth/start")}
                >
                  <>
                    <WandSparkles className="h-4 w-4" />
                    {googleConnected ? "Reconnect Google" : "Connect Google"}
                  </>
                </Button>
                <Button type="button" variant="ghost" className="gap-2" onClick={() => void loadDocs()}>
                  <RefreshCcw className="h-4 w-4" />
                  Refresh docs
                </Button>
              </div>

              {googleConnected ? (
                <>
                  <Field label="Available docs">
                    <Select value={selectedDocId} onChange={(event) => setSelectedDocId(event.target.value)}>
                      <option value="">Choose a Google Doc</option>
                      {docs.map((doc) => (
                        <option key={doc.id} value={doc.id}>
                          {doc.name}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={!selectedDocId || loadingDocs}
                    onClick={async () => {
                      try {
                        const response = await fetch(`/api/admin/google/docs/${selectedDocId}`, {
                          method: "POST"
                        });

                        if (!response.ok) {
                          throw new Error("Unable to import Google Doc.");
                        }

                        const payload = (await response.json()) as {
                          name: string;
                          subject: string;
                          previewText: string;
                          contentMode: "rich";
                          htmlContent: string;
                          markdownContent: string;
                          googleDocId: string;
                          googleDocUrl: string;
                        };

                        setForm((current) => ({
                          ...current,
                          name: payload.name,
                          subject: payload.subject,
                          previewText: payload.previewText,
                          contentMode: payload.contentMode,
                          htmlContent: payload.htmlContent,
                          markdownContent: payload.markdownContent,
                          googleDocId: payload.googleDocId,
                          googleDocUrl: payload.googleDocUrl
                        }));
                        toast.success("Google Doc imported into the draft.");
                      } catch (error) {
                        toast.error(toDisplayError(error));
                      }
                    }}
                  >
                    Import selected doc
                  </Button>
                </>
              ) : (
                <p className="text-sm leading-6 text-slate">
                  Google is not connected yet. Connect it to browse Docs and pull content into the current campaign.
                </p>
              )}
            </div>
          </InsightCard>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <InsightCard title="Template library" description="Athena-branded system and campaign templates available to the composer.">
          <AdminDataTable
            columns={[
              { key: "name", label: "Template" },
              { key: "type", label: "Type" },
              { key: "status", label: "Source" }
            ]}
            rows={templates.map((template) => ({
              id: template.id,
              cells: {
                name: template.name,
                type: EMAIL_TEMPLATE_LABELS[template.templateType],
                status: template.isSystem ? "System" : "Custom"
              }
            }))}
          />
          <div className="mt-4">
            <Link href="/admin/communications/templates" className="text-sm text-mist transition hover:text-ink">
              Open full template library
            </Link>
          </div>
        </InsightCard>

        <InsightCard title="Send history" description="Recent sends for this campaign or the wider communications surface.">
          <AdminDataTable
            columns={[
              { key: "recipient", label: "Recipient" },
              { key: "subject", label: "Subject" },
              { key: "status", label: "Status" }
            ]}
            rows={(campaignDeliveries.length > 0 ? campaignDeliveries : deliveries.slice(0, 8)).map((delivery) => ({
              id: delivery.id,
              cells: {
                recipient: delivery.recipientEmail,
                subject: delivery.subject,
                status: delivery.status
              }
            }))}
          />
          <div className="mt-4">
            <Link href="/admin/communications/history" className="text-sm text-mist transition hover:text-ink">
              Open delivery history
            </Link>
          </div>
        </InsightCard>
      </div>
    </div>
  );
}
