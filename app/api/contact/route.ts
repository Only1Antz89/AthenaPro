import { NextResponse } from "next/server";
import { z } from "zod";
import { sendMail } from "@/lib/email/mailer";
import { env } from "@/lib/env";
import { AppError } from "@/lib/errors";
import { contactInquirySchema } from "@/lib/validation/schemas";

const contactRequestSchema = contactInquirySchema.extend({
  // Hidden bot trap. Real users never see or populate this field.
  website: z.string().max(0).optional().default("")
});

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    };
    return entities[character];
  });
}

export async function POST(request: Request) {
  try {
    if (!env.contactInboxEmail) {
      return NextResponse.json(
        { ok: false, error: "Enquiry delivery is not configured." },
        { status: 503 }
      );
    }

    const payload = contactRequestSchema.parse(await request.json());
    const serviceNeeds = payload.serviceNeeds.join(", ");
    const brief = payload.brief || "No additional brief supplied.";

    await sendMail({
      to: env.contactInboxEmail,
      replyTo: payload.email,
      subject: `New ${payload.eventType} enquiry from ${payload.name}`,
      text: [
        `Name: ${payload.name}`,
        `Email: ${payload.email}`,
        `Event type: ${payload.eventType}`,
        `Expected attendance: ${payload.expectedAttendance}`,
        `Service needs: ${serviceNeeds}`,
        "",
        brief
      ].join("\n"),
      html: `
        <h1>New Athena Pro enquiry</h1>
        <p><strong>Name:</strong> ${escapeHtml(payload.name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(payload.email)}</p>
        <p><strong>Event type:</strong> ${escapeHtml(payload.eventType)}</p>
        <p><strong>Expected attendance:</strong> ${escapeHtml(payload.expectedAttendance)}</p>
        <p><strong>Service needs:</strong> ${escapeHtml(serviceNeeds)}</p>
        <h2>Brief</h2>
        <p>${escapeHtml(brief).replace(/\n/g, "<br>")}</p>
      `
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: "Check the enquiry details and try again." }, { status: 400 });
    }

    const status = error instanceof AppError ? error.status : 500;
    return NextResponse.json(
      { ok: false, error: status === 503 ? "Enquiry delivery is unavailable right now." : "Unable to send the enquiry." },
      { status }
    );
  }
}
