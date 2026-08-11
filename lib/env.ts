import { z } from "zod";
import type { RuntimeMode } from "@/types/domain";

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  SMTP2GO_SMTP_HOST: z.string().optional(),
  SMTP2GO_SMTP_PORT: z.coerce.number().optional(),
  SMTP2GO_SMTP_USER: z.string().optional(),
  SMTP2GO_SMTP_PASSWORD: z.string().optional(),
  SMTP2GO_FROM_EMAIL: z.string().email().optional(),
  SMTP2GO_FROM_NAME: z.string().optional(),
  CONTACT_INBOX_EMAIL: z.string().email().optional(),
  SMTP2GO_WEBHOOK_AUTH: z.string().optional(),
  ATHENA_REGISTERED_OFFICE: z.string().optional(),
  ATHENA_COMPANY_REGISTRATION: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_REDIRECT_URI: z.string().url().optional(),
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: z.string().optional(),
  VAPID_PRIVATE_KEY: z.string().optional(),
  WEB_PUSH_CONTACT: z.string().optional()
});

const parsed = envSchema.safeParse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  SMTP2GO_SMTP_HOST: process.env.SMTP2GO_SMTP_HOST,
  SMTP2GO_SMTP_PORT: process.env.SMTP2GO_SMTP_PORT,
  SMTP2GO_SMTP_USER: process.env.SMTP2GO_SMTP_USER,
  SMTP2GO_SMTP_PASSWORD: process.env.SMTP2GO_SMTP_PASSWORD,
  SMTP2GO_FROM_EMAIL: process.env.SMTP2GO_FROM_EMAIL,
  SMTP2GO_FROM_NAME: process.env.SMTP2GO_FROM_NAME,
  CONTACT_INBOX_EMAIL: process.env.CONTACT_INBOX_EMAIL,
  SMTP2GO_WEBHOOK_AUTH: process.env.SMTP2GO_WEBHOOK_AUTH,
  ATHENA_REGISTERED_OFFICE: process.env.ATHENA_REGISTERED_OFFICE,
  ATHENA_COMPANY_REGISTRATION: process.env.ATHENA_COMPANY_REGISTRATION,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI,
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY: process.env.VAPID_PRIVATE_KEY,
  WEB_PUSH_CONTACT: process.env.WEB_PUSH_CONTACT
});

const data = parsed.success ? parsed.data : {};

export const env = {
  supabaseUrl: data.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnonKey: data.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  supabaseServiceRoleKey: data.SUPABASE_SERVICE_ROLE_KEY ?? "",
  smtp2goHost: data.SMTP2GO_SMTP_HOST ?? "",
  smtp2goPort: data.SMTP2GO_SMTP_PORT ?? 587,
  smtp2goUser: data.SMTP2GO_SMTP_USER ?? "",
  smtp2goPassword: data.SMTP2GO_SMTP_PASSWORD ?? "",
  smtp2goFromEmail: data.SMTP2GO_FROM_EMAIL ?? "",
  smtp2goFromName: data.SMTP2GO_FROM_NAME ?? "Athena Pro",
  contactInboxEmail: data.CONTACT_INBOX_EMAIL ?? data.SMTP2GO_FROM_EMAIL ?? "",
  smtp2goWebhookAuth: data.SMTP2GO_WEBHOOK_AUTH ?? "",
  registeredOffice: data.ATHENA_REGISTERED_OFFICE ?? "",
  companyRegistration: data.ATHENA_COMPANY_REGISTRATION ?? "",
  googleClientId: data.GOOGLE_CLIENT_ID ?? "",
  googleClientSecret: data.GOOGLE_CLIENT_SECRET ?? "",
  googleRedirectUri: data.GOOGLE_REDIRECT_URI ?? "",
  vapidPublicKey: data.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "",
  vapidPrivateKey: data.VAPID_PRIVATE_KEY ?? "",
  webPushContact: data.WEB_PUSH_CONTACT ?? "mailto:ops@athenapro.co.uk",
  hasSupabase:
    Boolean(data.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(data.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  hasSmtp2go:
    Boolean(data.SMTP2GO_SMTP_HOST) &&
    Boolean(data.SMTP2GO_SMTP_USER) &&
    Boolean(data.SMTP2GO_SMTP_PASSWORD) &&
    Boolean(data.SMTP2GO_FROM_EMAIL),
  hasGoogleOAuth:
    Boolean(data.GOOGLE_CLIENT_ID) &&
    Boolean(data.GOOGLE_CLIENT_SECRET) &&
    Boolean(data.GOOGLE_REDIRECT_URI),
  hasWebPush:
    Boolean(data.NEXT_PUBLIC_VAPID_PUBLIC_KEY) &&
    Boolean(data.VAPID_PRIVATE_KEY)
};

export function getRuntimeMode(): RuntimeMode {
  return env.hasSupabase ? "live" : "demo";
}
