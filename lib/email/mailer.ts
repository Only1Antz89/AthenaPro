import nodemailer from "nodemailer";
import { BRAND } from "@/lib/brand";
import { env } from "@/lib/env";
import { AppError } from "@/lib/errors";

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (!env.hasSmtp2go) {
    return null;
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.smtp2goHost,
      port: env.smtp2goPort,
      secure: env.smtp2goPort === 465,
      auth: {
        user: env.smtp2goUser,
        pass: env.smtp2goPassword
      }
    });
  }

  return transporter;
}

export async function sendMail(input: {
  to: string;
  subject: string;
  html: string;
  text: string;
  headers?: Record<string, string>;
  messageId?: string;
}) {
  const smtpTransport = getTransporter();

  if (!smtpTransport) {
    throw new AppError("SMTP2GO is not configured for this environment.", "EMAIL_PROVIDER_NOT_CONFIGURED", 503);
  }

  const result = await smtpTransport.sendMail({
    from: {
      name: env.smtp2goFromName || BRAND.plainName,
      address: env.smtp2goFromEmail
    },
    to: input.to,
    subject: input.subject,
    html: input.html,
    text: input.text,
    headers: input.headers,
    messageId: input.messageId
  });

  return {
    provider: "smtp2go",
    status: "sent" as const,
    messageId: result.messageId
  };
}
