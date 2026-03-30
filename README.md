# StaffBook Demo

StaffBook Demo is a production-minded demo platform for event organisers and staff recruitment. It is built with `Next.js 14`, `TypeScript`, `Tailwind CSS`, and `Supabase`, with a fallback demo runtime that keeps the app fully interactive when Supabase is not configured.

## What’s Included

- Landing page, auth pages, organiser dashboard, staff dashboard
- Event creation, job posting, application, and rating flows
- Bayesian-weighted staff ranking
- Supabase SQL for schema, RLS policies, views, and seed data
- Public API routes for highlights, jobs, job detail, and ranked staff
- Demo-mode local auth and browser-persisted seed data

## Tech Approach

- `app/`: App Router routes and API handlers
- `components/`: reusable UI and layout building blocks
- `features/`: route-facing client modules and workflow orchestration
- `lib/domain/`: ranking and transition logic
- `lib/data/`: live and demo providers plus store utilities
- `lib/services/`: server-safe public data services
- `lib/validation/`: shared Zod schemas
- `supabase/`: schema, policies, and seed SQL

## Runtime Modes

### Demo mode

Demo mode is automatic when `NEXT_PUBLIC_SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_ANON_KEY` is missing.

- Signup and login work locally in the browser
- New organiser accounts receive a starter organisation workspace
- New staff accounts receive seeded applications and ratings
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
3. `supabase/seed.sql`

Recommended notes:

- Disable mandatory email confirmation for local/demo setup if you want smoother live signup testing.
- Ensure the authenticated role can access tables through the provided RLS policies.
- Generate typed database definitions later if you want to remove the loose live-adapter typing.

## Netlify Deployment

1. Create a new Netlify site from this repo.
2. Set the three environment variables above in Netlify.
3. Build command: `npm run build`
4. Publish directory: `.next`

If you deploy without Supabase env vars, the app still renders and runs in demo mode.

## Production Notes

- The app is structured around provider and service boundaries so a future mobile app can reuse API patterns without a full rewrite.
- `organizations` and `organization_memberships` are modeled now so multi-user organiser teams can be added later.
- `application_status_history` and RLS policies provide the start of an auditable workflow.
- The live Supabase adapter is intentionally schema-aligned but not generated from DB types yet; add generated Supabase types as the next hardening step.

## Assumptions

- Web is the first production client, but mobile reuse is expected later.
- Team invites, notifications, payments, and messaging are deferred.
- Dark mode is intentionally omitted to keep focus on the primary demo and foundation quality.
