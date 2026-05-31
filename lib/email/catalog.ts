import { BRAND } from "@/lib/brand";
import { markdownToHtml } from "@/lib/email/content";
import { EMAIL_TEMPLATE_LABELS, EMAIL_TEMPLATE_TYPES } from "@/types/admin";
import type { EmailTemplate, EmailTemplateType } from "@/types/admin";

type TemplateDefinition = {
  subject: string;
  preview: string;
  markdown: string;
};

const TEMPLATE_BODIES: Record<EmailTemplateType, TemplateDefinition> = {
  client_onboarding: {
    subject: "Your Athena Pro client workspace is ready",
    preview: "Platform access, service visibility, and the next steps for your client team.",
    markdown: `# Welcome to ${BRAND.plainName}
Your client workspace is now active and ready to support live delivery planning, assignment visibility, and commercial oversight.

## What happens next
- Review your organisation profile and primary contacts
- Confirm your first operational brief or assignment requirement
- Share any venue, ticketing, or staffing constraints that need early visibility

## Support model
Athena Pro sits across ticketing logic, field execution, and commercial control. If you need a guided setup, reply to this email and the team will coordinate the next step.`
  },
  operator_onboarding: {
    subject: "Your Athena Pro field-team profile is live",
    preview: "Profile completion, availability, and readiness steps for live assignments.",
    markdown: `# Welcome to ${BRAND.plainName}
Your field-team profile is now active. The next step is to complete the details that help operations place you accurately.

## Before you go live
- Confirm your profile details and contact information
- Add availability, regions, and core skill tags
- Complete any remaining onboarding or verification requests

## Why this matters
Athena Pro prioritises calm delivery, pace, and reliability. A complete profile improves placement quality and response speed.`
  },
  client_onboarding_approved: {
    subject: "Your Athena Pro onboarding is complete",
    preview: "Confirmation that the client account is now approved for live operations.",
    markdown: `# Client onboarding approved
Your Athena Pro client onboarding is now complete and your account is approved for live use.

## You can now
- Publish or manage assignments
- Coordinate event delivery with the Athena team
- Receive operational and service updates through the platform

If you need a first-pass review of your setup, reply to this email and Athena will coordinate it.`
  },
  operator_onboarding_approved: {
    subject: "You are approved for live Athena assignments",
    preview: "Confirmation that operator onboarding is complete and assignment visibility is now active.",
    markdown: `# Operator onboarding approved
Your Athena Pro onboarding is complete and you are now approved for live assignment visibility.

## Next steps
- Keep your availability current
- Check assignment opportunities regularly
- Maintain profile accuracy so matching and scheduling stay clean

Athena uses your profile quality and delivery history to support stronger placement decisions.`
  },
  client_offboarding: {
    subject: "Your Athena Pro client access has been closed",
    preview: "A clean close-out summary for client platform access.",
    markdown: `# Workspace access closed
This is confirmation that your Athena Pro client access has now been closed.

## Close-out note
- Existing records remain retained in line with operational requirements
- Future access will remain paused until reactivation is confirmed
- Athena can coordinate handover or re-entry if service resumes

If this change was unexpected, reply to this message so the operations team can review it quickly.`
  },
  operator_offboarding: {
    subject: "Your Athena Pro operator access has been updated",
    preview: "A clear status update for field-team access changes.",
    markdown: `# Profile access updated
Your Athena Pro operator access has been changed and is no longer active in its previous state.

## What this means
- You may no longer appear in active assignment consideration
- Any future reactivation will follow an operations review
- Existing completed work remains on record

If you believe this change was made in error, reply to this email and Athena operations will review the account.`
  },
  job_confirmation_client: {
    subject: "Athena Pro assignment confirmation",
    preview: "A branded confirmation for a newly confirmed operator placement.",
    markdown: `# Assignment confirmed
An operator has now been confirmed against your Athena Pro assignment.

## Recommended content
- Assignment title and event context
- Confirmed operator details
- Timing, location, and rate summary
- Any final briefing notes or arrival instructions`
  },
  job_confirmation_operator: {
    subject: "Your Athena Pro assignment is confirmed",
    preview: "A branded confirmation for an accepted operator placement.",
    markdown: `# Assignment confirmed
Your placement on an Athena Pro assignment has now been confirmed.

## Recommended content
- Event and client context
- Shift timing and location
- Pay summary and arrival expectations
- Any final briefing instructions`
  },
  promotion: {
    subject: "Athena Pro standing update",
    preview: "Recognition and next-step guidance for stronger platform standing.",
    markdown: `# Standing update
Your standing within Athena Pro has moved forward based on recent delivery performance and operational confidence.

## What to keep doing
- Keep your profile current
- Maintain accurate availability
- Continue delivering with pace, calm communication, and reliability

Athena Pro uses these signals to keep stronger operators visible for premium deployments and higher-trust assignments.`
  },
  payment: {
    subject: "Athena Pro payment update",
    preview: "A branded payout or billing communication with room for finance detail.",
    markdown: `# Payment update
There is a new payment-related update ready for review in Athena Pro.

## Typical uses
- Client invoice issued or updated
- Operator payout confirmation
- Remittance timing or finance follow-up

Please review the linked summary or finance note for the exact amount, timing, and any next action required.`
  },
  newsletter: {
    subject: "Athena Pro bulletin",
    preview: "Operational news, platform updates, and audience messaging.",
    markdown: `# Athena bulletin
Use this template for platform-wide updates, campaign messaging, and operating notes that need the standard Athena presentation.

## Common content blocks
- New platform capabilities
- Service-line updates
- Assignment or delivery highlights
- Commercial and operational announcements`
  },
  notification: {
    subject: "Athena Pro notification",
    preview: "A concise operational update with the Athena shell applied.",
    markdown: `# Athena update
There is a new activity update waiting for you in Athena Pro.

## Good fit for this template
- Status changes
- Assignment-related alerts
- Admin follow-ups
- Time-sensitive platform notices`
  },
  password_changed: {
    subject: "Your Athena Pro password was changed",
    preview: "Security confirmation after a password change or reset.",
    markdown: `# Password updated
Your Athena Pro password was changed successfully.

## Security note
- If you made this change, no action is needed
- If you did not make this change, reset your password again immediately
- Contact Athena support if you need a manual review`
  },
  password_reset: {
    subject: "Reset your Athena Pro password",
    preview: "A secure reset link for your Athena Pro account.",
    markdown: `# Password reset request
We received a request to reset your Athena Pro password.

## Security note
- Use the secure link in this email to choose a new password
- If you did not request this change, you can ignore this message
- For repeated or suspicious requests, contact Athena support`
  },
  ticketing_tech_support: {
    subject: "Athena Pro ticketing and tech support brief",
    preview: "A branded template for gate logic, devices, access control, and live troubleshooting.",
    markdown: `# Ticketing and tech support
Athena Pro can support the technical layer behind live ingress, access control, and onsite issue handling.

## Typical scope
- Scanner and device readiness
- Access control mapping and validation logic
- Onsite network stability and troubleshooting
- Incident response for handhelds, printers, and validation hardware

Use this template when the conversation is centred on operational technology at the gate.`
  },
  personnel_operations: {
    subject: "Athena Pro personnel and operations brief",
    preview: "A branded template for field teams, supervisors, and frontline execution.",
    markdown: `# Personnel and operations
Athena Pro provides disciplined field delivery for events where pace, judgement, and guest-facing control matter.

## Typical scope
- Frontline staffing for ingress, accreditation, and customer touchpoints
- Supervisor-level oversight and escalation handling
- Crowd flow logistics and deployment coordination
- Performance-led staffing visibility through the platform

Use this template when the message is focused on people deployment and onsite execution.`
  },
  commercial_management: {
    subject: "Athena Pro commercial management brief",
    preview: "A branded template for revenue, controls, audit context, and commercial oversight.",
    markdown: `# Commercial management
Athena Pro supports the commercial layer when event operations carry financial sensitivity or control risk.

## Typical scope
- Revenue-aware operational planning
- Exception review and financial auditing support
- Operational recovery planning
- Commercial oversight for promoters, venues, and agency partners

Use this template when the discussion is strategic, financial, or control-oriented.`
  },
  integrated_support: {
    subject: "Athena Pro integrated support plan",
    preview: "A single branded template for full-service technical, operational, and commercial coverage.",
    markdown: `# Integrated support
Athena Pro is designed to align gate technology, field teams, and commercial oversight under one operating standard.

## Integrated service layers
- Ticketing and tech support
- Personnel and operations
- Commercial management

Use this template when the client needs a unified delivery plan rather than a single service line.`
  }
};

export const DEFAULT_EMAIL_TEMPLATES: EmailTemplate[] = EMAIL_TEMPLATE_TYPES.map((templateType) => {
  const template = TEMPLATE_BODIES[templateType];

  return {
    id: `default_${templateType}`,
    name: EMAIL_TEMPLATE_LABELS[templateType],
    templateType,
    subjectTemplate: template.subject,
    previewText: template.preview,
    bodyHtml: markdownToHtml(template.markdown),
    bodyMarkdown: template.markdown,
    isSystem: true,
    updatedAt: new Date().toISOString()
  };
});

export function getDefaultEmailTemplate(templateType: EmailTemplateType) {
  return DEFAULT_EMAIL_TEMPLATES.find((template) => template.templateType === templateType)!;
}
