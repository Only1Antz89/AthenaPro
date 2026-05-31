# Athena Pro Platform

Athena Pro is a production-minded event operations platform for ticketing support, field team deployment, and commercial event oversight. It is built with `Next.js 14`, `TypeScript`, `Tailwind CSS`, and `Supabase`, with a fallback demo runtime that keeps the app interactive when Supabase is not configured.

## What's Included

- Premium public site for Athena Pro marketing, services, about, and enquiry flow
- Platform access, client workspace, and field-team workspace
- Event creation, assignment publishing, deployment request, and review flows
- Bayesian-weighted field-team ranking
- Supabase SQL for schema, RLS policies, views, and seed data
- Demo-mode local auth and browser-persisted seed data

## Tech Approach

- `app/`: App Router routes and API handlers
- `components/`: shared UI and layout building blocks
- `features/`: route-facing modules and workflow orchestration
- `lib/domain/`: ranking and transition logic
- `lib/data/`: live and demo providers plus store utilities
- `lib/services/`: server-safe public data services
- `lib/validation/`: shared Zod schemas
- `supabase/`: schema, policies, and seed SQL

## Runtime Modes

### Demo mode

Demo mode is automatic when `NEXT_PUBLIC_SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_ANON_KEY` is missing.

- Signup and login work locally in the browser
- New client accounts receive a starter organisation workspace
- New field-team accounts receive seeded applications and reviews
- Data persists in browser `localStorage`

### Live mode

When Supabase env vars are present, the app uses Supabase Auth and table CRUD through the live provider.

- Auth: email/password via Supabase
- Data: browser client against Supabase tables
- Security: intended to work with the RLS policies in `supabase/policies.sql`

## Environment Variables

Create `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SMTP2GO_SMTP_HOST=mail.smtp2go.com
SMTP2GO_SMTP_PORT=587
SMTP2GO_SMTP_USER=your-smtp2go-user
SMTP2GO_SMTP_PASSWORD=your-smtp2go-password
SMTP2GO_FROM_EMAIL=ops@your-domain.com
SMTP2GO_FROM_NAME=Athena Pro
SMTP2GO_WEBHOOK_AUTH=Bearer your-smtp2go-webhook-secret
ATHENA_REGISTERED_OFFICE=Your registered office postal address
ATHENA_COMPANY_REGISTRATION=Your company registration number
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=https://your-domain.com/api/admin/google/oauth/callback
```

`SUPABASE_SERVICE_ROLE_KEY` is only for server-side/public service usage and setup tasks. Do not expose it in client code.

## Local Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Quality Commands

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## Supabase Setup

Run the SQL in this order:

1. `supabase/schema.sql`
2. `supabase/policies.sql`
3. `supabase/athena-admin-schema.sql`
4. `supabase/seed.sql`

## Production Notes

- The app keeps provider and service boundaries so the demo/runtime split remains intact.
- Persisted role enums remain `organiser` and `staff` internally for compatibility, while the UI is presented as client and field team.
- The current contact form is validated UI only and does not yet route enquiries to an external destination.
