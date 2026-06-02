create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'notification_type') then
    create type public.notification_type as enum (
      'review_due',
      'promotion_due',
      'demotion_risk',
      'job_match',
      'operator_match',
      'client_feedback_due',
      'job_alert'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'email_job_status') then
    create type public.email_job_status as enum ('queued', 'processing', 'sent', 'failed');
  end if;
end $$;

alter type public.notification_type add value if not exists 'job_alert';
alter type public.notification_type add value if not exists 'company_message';
alter type public.notification_type add value if not exists 'event_pre_day';
alter type public.notification_type add value if not exists 'event_on_day';
alter type public.notification_type add value if not exists 'event_post_event';
alter type public.notification_type add value if not exists 'company_job_posted';

create table if not exists public.saved_jobs (
  staff_id uuid not null references public.profiles(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (staff_id, job_id)
);

create table if not exists public.job_alerts (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  query text,
  location text,
  role_types text[] not null default '{}',
  minimum_pay numeric(10,2),
  date_from date,
  date_to date,
  is_active boolean not null default true,
  email_opt_in boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (date_from is null or date_to is null or date_from <= date_to),
  check (minimum_pay is null or minimum_pay >= 0)
);

create table if not exists public.company_follows (
  staff_id uuid not null references public.profiles(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (staff_id, organization_id)
);

create table if not exists public.job_likes (
  staff_id uuid not null references public.profiles(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (staff_id, job_id)
);

create table if not exists public.dismissed_jobs (
  staff_id uuid not null references public.profiles(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (staff_id, job_id)
);

create table if not exists public.job_media_slides (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  image_url text not null,
  alt_text text,
  caption text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.conversation_threads (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  staff_id uuid not null references public.profiles(id) on delete cascade,
  job_id uuid references public.jobs(id) on delete set null,
  event_id uuid references public.events(id) on delete set null,
  application_id uuid references public.applications(id) on delete set null,
  subject text not null,
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (organization_id, staff_id, job_id)
);

create table if not exists public.conversation_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.conversation_threads(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table if exists public.job_alerts
  add column if not exists query text,
  add column if not exists location text,
  add column if not exists role_types text[] not null default '{}',
  add column if not exists minimum_pay numeric(10,2),
  add column if not exists date_from date,
  add column if not exists date_to date,
  add column if not exists is_active boolean not null default true,
  add column if not exists email_opt_in boolean not null default true,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

alter table if exists public.job_media_slides
  add column if not exists alt_text text,
  add column if not exists caption text,
  add column if not exists sort_order integer not null default 0,
  add column if not exists created_at timestamptz not null default now();

alter table if exists public.conversation_threads
  add column if not exists job_id uuid references public.jobs(id) on delete set null,
  add column if not exists event_id uuid references public.events(id) on delete set null,
  add column if not exists application_id uuid references public.applications(id) on delete set null,
  add column if not exists subject text not null default 'Event conversation',
  add column if not exists last_message_at timestamptz not null default now(),
  add column if not exists created_at timestamptz not null default now();

alter table if exists public.conversation_messages
  add column if not exists read_at timestamptz;

alter table if exists public.push_subscriptions
  add column if not exists user_agent text,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists job_alerts_set_updated_at on public.job_alerts;
create trigger job_alerts_set_updated_at
before update on public.job_alerts
for each row execute procedure public.set_updated_at();

drop trigger if exists push_subscriptions_set_updated_at on public.push_subscriptions;
create trigger push_subscriptions_set_updated_at
before update on public.push_subscriptions
for each row execute procedure public.set_updated_at();

create index if not exists idx_saved_jobs_staff_created_at on public.saved_jobs(staff_id, created_at desc);
create index if not exists idx_saved_jobs_job_id on public.saved_jobs(job_id);
create index if not exists idx_job_alerts_staff_active on public.job_alerts(staff_id, is_active, updated_at desc);
create index if not exists idx_company_follows_organization on public.company_follows(organization_id, created_at desc);
create index if not exists idx_job_likes_job_id on public.job_likes(job_id, created_at desc);
create index if not exists idx_dismissed_jobs_staff_created_at on public.dismissed_jobs(staff_id, created_at desc);
create index if not exists idx_job_media_slides_job_order on public.job_media_slides(job_id, sort_order asc);
create index if not exists idx_conversation_threads_staff_last on public.conversation_threads(staff_id, last_message_at desc);
create index if not exists idx_conversation_threads_org_last on public.conversation_threads(organization_id, last_message_at desc);
create index if not exists idx_conversation_messages_thread_created on public.conversation_messages(thread_id, created_at asc);
create index if not exists idx_push_subscriptions_user on public.push_subscriptions(user_id, updated_at desc);

alter table if exists public.organizations enable row level security;
alter table if exists public.saved_jobs enable row level security;
alter table if exists public.job_alerts enable row level security;
alter table if exists public.company_follows enable row level security;
alter table if exists public.job_likes enable row level security;
alter table if exists public.dismissed_jobs enable row level security;
alter table if exists public.job_media_slides enable row level security;
alter table if exists public.conversation_threads enable row level security;
alter table if exists public.conversation_messages enable row level security;
alter table if exists public.push_subscriptions enable row level security;

grant select on public.organizations, public.events, public.jobs to anon, authenticated;
grant select on public.profiles, public.ratings to authenticated;
grant select, insert, update, delete on public.saved_jobs to authenticated;
grant select, insert, update, delete on public.job_alerts to authenticated;
grant select, insert, update, delete on public.company_follows to authenticated;
grant select, insert, update, delete on public.job_likes to authenticated;
grant select, insert, update, delete on public.dismissed_jobs to authenticated;
grant select on public.job_media_slides to anon, authenticated;
grant insert, update, delete on public.job_media_slides to authenticated;
grant select, insert, update, delete on public.conversation_threads to authenticated;
grant select, insert, update, delete on public.conversation_messages to authenticated;
grant select, insert, update, delete on public.push_subscriptions to authenticated;

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to anon, authenticated;

create or replace function private.is_org_member(org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.organization_memberships m
    where m.organization_id = org_id
      and m.profile_id = auth.uid()
  );
$$;

revoke execute on function private.is_org_member(uuid) from public;
grant execute on function private.is_org_member(uuid) to anon, authenticated;

drop policy if exists "organizations_select_members" on public.organizations;
create policy "organizations_select_members"
on public.organizations
for select
using (
  private.is_org_member(id)
  or exists (
    select 1
    from public.jobs j
    where j.organization_id = organizations.id
      and j.status in ('open', 'closed')
  )
  or exists (
    select 1
    from public.events e
    where e.organization_id = organizations.id
      and e.status in ('published', 'completed')
  )
);

drop policy if exists "saved_jobs_read_self" on public.saved_jobs;
create policy "saved_jobs_read_self"
on public.saved_jobs
for select
using (staff_id = auth.uid());

drop policy if exists "saved_jobs_manage_self" on public.saved_jobs;
create policy "saved_jobs_manage_self"
on public.saved_jobs
for all
using (staff_id = auth.uid())
with check (staff_id = auth.uid());

drop policy if exists "job_alerts_manage_self" on public.job_alerts;
create policy "job_alerts_manage_self"
on public.job_alerts
for all
using (staff_id = auth.uid())
with check (staff_id = auth.uid());

drop policy if exists "company_follows_read_self" on public.company_follows;
create policy "company_follows_read_self"
on public.company_follows
for select
using (staff_id = auth.uid());

drop policy if exists "company_follows_manage_self" on public.company_follows;
create policy "company_follows_manage_self"
on public.company_follows
for all
using (staff_id = auth.uid())
with check (staff_id = auth.uid());

drop policy if exists "job_likes_read_self" on public.job_likes;
create policy "job_likes_read_self"
on public.job_likes
for select
using (staff_id = auth.uid());

drop policy if exists "job_likes_manage_self" on public.job_likes;
create policy "job_likes_manage_self"
on public.job_likes
for all
using (staff_id = auth.uid())
with check (staff_id = auth.uid());

drop policy if exists "dismissed_jobs_read_self" on public.dismissed_jobs;
create policy "dismissed_jobs_read_self"
on public.dismissed_jobs
for select
using (staff_id = auth.uid());

drop policy if exists "dismissed_jobs_manage_self" on public.dismissed_jobs;
create policy "dismissed_jobs_manage_self"
on public.dismissed_jobs
for all
using (staff_id = auth.uid())
with check (staff_id = auth.uid());

drop policy if exists "job_media_slides_public_or_org" on public.job_media_slides;
create policy "job_media_slides_public_or_org"
on public.job_media_slides
for select
using (
  private.is_org_member(organization_id)
  or exists (select 1 from public.jobs j where j.id = job_id and j.status = 'open')
);

drop policy if exists "job_media_slides_org_manage" on public.job_media_slides;
create policy "job_media_slides_org_manage"
on public.job_media_slides
for all
using (private.is_org_member(organization_id))
with check (private.is_org_member(organization_id));

drop policy if exists "conversation_threads_read_related" on public.conversation_threads;
create policy "conversation_threads_read_related"
on public.conversation_threads
for select
using (staff_id = auth.uid() or private.is_org_member(organization_id));

drop policy if exists "conversation_threads_insert_related" on public.conversation_threads;
create policy "conversation_threads_insert_related"
on public.conversation_threads
for insert
with check (staff_id = auth.uid() or private.is_org_member(organization_id));

drop policy if exists "conversation_threads_update_related" on public.conversation_threads;
create policy "conversation_threads_update_related"
on public.conversation_threads
for update
using (staff_id = auth.uid() or private.is_org_member(organization_id))
with check (staff_id = auth.uid() or private.is_org_member(organization_id));

drop policy if exists "conversation_messages_read_related" on public.conversation_messages;
create policy "conversation_messages_read_related"
on public.conversation_messages
for select
using (
  exists (
    select 1
    from public.conversation_threads t
    where t.id = thread_id
      and (t.staff_id = auth.uid() or private.is_org_member(t.organization_id))
  )
);

drop policy if exists "conversation_messages_insert_related" on public.conversation_messages;
create policy "conversation_messages_insert_related"
on public.conversation_messages
for insert
with check (
  sender_id = auth.uid()
  and exists (
    select 1
    from public.conversation_threads t
    where t.id = thread_id
      and (t.staff_id = auth.uid() or private.is_org_member(t.organization_id))
  )
);

drop policy if exists "conversation_messages_update_related" on public.conversation_messages;
create policy "conversation_messages_update_related"
on public.conversation_messages
for update
using (
  exists (
    select 1
    from public.conversation_threads t
    where t.id = thread_id
      and (t.staff_id = auth.uid() or private.is_org_member(t.organization_id))
  )
)
with check (
  exists (
    select 1
    from public.conversation_threads t
    where t.id = thread_id
      and (t.staff_id = auth.uid() or private.is_org_member(t.organization_id))
  )
);

drop policy if exists "push_subscriptions_manage_self" on public.push_subscriptions;
create policy "push_subscriptions_manage_self"
on public.push_subscriptions
for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop function if exists public.is_org_member(uuid);

notify pgrst, 'reload schema';
