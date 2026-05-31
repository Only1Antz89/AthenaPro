create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'service_tier') then
    create type public.service_tier as enum ('festival', 'mixed', 'formal', 'high_end');
  end if;

  if not exists (select 1 from pg_type where typname = 'service_tier_source') then
    create type public.service_tier_source as enum ('default', 'manual', 'ai_suggested');
  end if;

  if not exists (select 1 from pg_type where typname = 'client_feedback_sentiment') then
    create type public.client_feedback_sentiment as enum ('up', 'down');
  end if;

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

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  onboarding_status text not null default 'pending' check (onboarding_status in ('pending', 'in_review', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('organiser', 'staff')),
  full_name text not null,
  email text not null,
  phone text,
  company_name text,
  bio text,
  skills text[] not null default '{}',
  availability text,
  avatar_url text,
  location text,
  languages text[] not null default '{}',
  preferred_roles text[] not null default '{}',
  age integer check (age is null or age between 16 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.marketing_preferences (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  email_normalized text not null,
  newsletter_opt_in boolean not null default false,
  offers_opt_in boolean not null default false,
  product_updates_opt_in boolean not null default false,
  newsletter_opted_in_at timestamptz,
  newsletter_opted_out_at timestamptz,
  marketing_opted_out_at timestamptz,
  unsubscribe_token uuid not null default gen_random_uuid(),
  source text not null default 'signup',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.email_suppressions (
  email_normalized text primary key,
  reason text not null,
  source text not null default 'system',
  provider text not null default 'smtp2go',
  active boolean not null default true,
  details jsonb not null default '{}'::jsonb,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.operator_profiles (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  display_name text not null,
  headline text,
  base_location text,
  details text,
  onboarding_status text not null default 'pending' check (onboarding_status in ('pending', 'in_review', 'approved', 'rejected')),
  preferred_roles text[] not null default '{}',
  languages text[] not null default '{}',
  can_drive boolean not null default false,
  date_of_birth date,
  age integer check (age is null or age between 16 and 100),
  avatar_url text,
  availability_summary text,
  stripe_account_status text check (stripe_account_status in ('not_started', 'pending', 'ready')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.operator_availability_rules (
  id uuid primary key default gen_random_uuid(),
  operator_id uuid not null references public.profiles(id) on delete cascade,
  day_of_week integer not null check (day_of_week between 0 and 6),
  is_available boolean not null default false,
  is_all_day boolean not null default false,
  start_time time,
  end_time time,
  unique (operator_id, day_of_week)
);

create table if not exists public.operator_payment_profiles (
  operator_id uuid primary key references public.profiles(id) on delete cascade,
  provider text not null default 'stripe' check (provider in ('stripe')),
  account_id text,
  onboarding_status text not null default 'not_started' check (onboarding_status in ('not_started', 'pending', 'ready')),
  payouts_enabled boolean not null default false,
  details_submitted boolean not null default false,
  last_synced_at timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists public.organization_memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('owner', 'manager')),
  created_at timestamptz not null default now(),
  unique (organization_id, profile_id)
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  created_by uuid not null references public.profiles(id) on delete restrict,
  title text not null,
  description text not null default '',
  location text not null default '',
  event_date timestamptz not null,
  event_type text not null default '',
  required_roles text[] not null default '{}',
  service_tier public.service_tier not null default 'mixed',
  service_tier_source public.service_tier_source not null default 'default',
  suggested_service_tier public.service_tier,
  ai_suggested_tags text[] not null default '{}',
  ai_suggested_roles text[] not null default '{}',
  status text not null check (status in ('draft', 'published', 'completed', 'cancelled')) default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  created_by uuid not null references public.profiles(id) on delete restrict,
  title text not null,
  description text not null default '',
  role_type text not null,
  shift_start timestamptz not null,
  shift_end timestamptz not null,
  pay_rate numeric(10,2) not null check (pay_rate > 0),
  positions_needed integer not null default 1 check (positions_needed > 0),
  minimum_age integer check (minimum_age is null or minimum_age between 16 and 100),
  status text not null check (status in ('draft', 'open', 'closed', 'cancelled')) default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  staff_id uuid not null references public.profiles(id) on delete cascade,
  status text not null check (status in ('pending', 'accepted', 'rejected', 'withdrawn')) default 'pending',
  cover_note text not null default '',
  applied_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (job_id, staff_id)
);

create table if not exists public.application_status_history (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  from_status text check (from_status in ('pending', 'accepted', 'rejected', 'withdrawn')),
  to_status text not null check (to_status in ('pending', 'accepted', 'rejected', 'withdrawn')),
  actor_id uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);

create table if not exists public.job_view_events (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  viewer_id uuid not null references public.profiles(id) on delete cascade,
  viewed_at timestamptz not null default now()
);

create index if not exists job_view_events_job_id_viewed_at_idx
on public.job_view_events (job_id, viewed_at desc);

create index if not exists job_view_events_viewer_id_job_id_viewed_at_idx
on public.job_view_events (viewer_id, job_id, viewed_at desc);

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

create table if not exists public.ratings (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  staff_id uuid not null references public.profiles(id) on delete cascade,
  organiser_id uuid not null references public.profiles(id) on delete restrict,
  reliability_score integer not null check (reliability_score between 1 and 5),
  professionalism_score integer not null check (professionalism_score between 1 and 5),
  communication_score integer not null check (communication_score between 1 and 5),
  customer_service_score integer not null check (customer_service_score between 1 and 5),
  pressure_handling_score integer not null check (pressure_handling_score between 1 and 5),
  overall_score numeric(3,2) not null check (overall_score between 1 and 5),
  rating numeric(3,2) generated always as (overall_score) stored,
  comment text not null default '',
  created_at timestamptz not null default now(),
  unique (job_id, staff_id)
);

create table if not exists public.client_feedback (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.applications(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  staff_id uuid not null references public.profiles(id) on delete cascade,
  client_id uuid not null references public.organizations(id) on delete cascade,
  sentiment public.client_feedback_sentiment not null,
  reasons text[] not null default '{}',
  note text,
  created_at timestamptz not null default now(),
  unique (assignment_id, staff_id)
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type public.notification_type not null,
  title text not null,
  body text not null,
  href text,
  is_read boolean not null default false,
  email_status public.email_job_status not null default 'queued',
  created_at timestamptz not null default now()
);

create table if not exists public.notification_email_jobs (
  id uuid primary key default gen_random_uuid(),
  notification_id uuid not null references public.notifications(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  template_key public.notification_type not null,
  status public.email_job_status not null default 'queued',
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table if exists public.profiles
  add column if not exists phone text,
  add column if not exists company_name text,
  add column if not exists bio text,
  add column if not exists skills text[] not null default '{}',
  add column if not exists availability text,
  add column if not exists avatar_url text,
  add column if not exists location text,
  add column if not exists languages text[] not null default '{}',
  add column if not exists preferred_roles text[] not null default '{}',
  add column if not exists age integer,
  add column if not exists updated_at timestamptz not null default now();

alter table if exists public.marketing_preferences
  add column if not exists email_normalized text,
  add column if not exists newsletter_opted_in_at timestamptz,
  add column if not exists newsletter_opted_out_at timestamptz,
  add column if not exists offers_opt_in boolean not null default false,
  add column if not exists product_updates_opt_in boolean not null default false,
  add column if not exists marketing_opted_out_at timestamptz,
  add column if not exists unsubscribe_token uuid,
  add column if not exists source text not null default 'signup',
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

update public.marketing_preferences mp
set email_normalized = lower(p.email)
from public.profiles p
where mp.profile_id = p.id
  and (mp.email_normalized is null or mp.email_normalized = '');

alter table if exists public.marketing_preferences
  alter column email_normalized set not null;

update public.marketing_preferences
set unsubscribe_token = gen_random_uuid()
where unsubscribe_token is null;

alter table if exists public.marketing_preferences
  alter column unsubscribe_token set default gen_random_uuid();

alter table if exists public.operator_profiles
  add column if not exists headline text,
  add column if not exists base_location text,
  add column if not exists details text,
  add column if not exists onboarding_status text not null default 'pending',
  add column if not exists preferred_roles text[] not null default '{}',
  add column if not exists languages text[] not null default '{}',
  add column if not exists can_drive boolean not null default false,
  add column if not exists date_of_birth date,
  add column if not exists age integer,
  add column if not exists avatar_url text,
  add column if not exists availability_summary text,
  add column if not exists stripe_account_status text,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

alter table if exists public.operator_payment_profiles
  add column if not exists account_id text,
  add column if not exists onboarding_status text not null default 'not_started',
  add column if not exists payouts_enabled boolean not null default false,
  add column if not exists details_submitted boolean not null default false,
  add column if not exists last_synced_at timestamptz,
  add column if not exists updated_at timestamptz not null default now();

alter table if exists public.events
  add column if not exists description text not null default '',
  add column if not exists location text not null default '',
  add column if not exists event_type text not null default '',
  add column if not exists required_roles text[] not null default '{}',
  add column if not exists service_tier public.service_tier not null default 'mixed',
  add column if not exists service_tier_source public.service_tier_source not null default 'default',
  add column if not exists suggested_service_tier public.service_tier,
  add column if not exists ai_suggested_tags text[] not null default '{}',
  add column if not exists ai_suggested_roles text[] not null default '{}',
  add column if not exists updated_at timestamptz not null default now();

alter table if exists public.organizations
  add column if not exists onboarding_status text not null default 'pending';

alter table if exists public.jobs
  add column if not exists description text not null default '',
  add column if not exists role_type text,
  add column if not exists positions_needed integer not null default 1,
  add column if not exists minimum_age integer,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

alter table if exists public.applications
  add column if not exists cover_note text not null default '',
  add column if not exists applied_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

alter table if exists public.job_view_events
  add column if not exists viewed_at timestamptz not null default now();

alter table if exists public.job_alerts
  add column if not exists name text,
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

alter table if exists public.ratings
  add column if not exists job_id uuid references public.jobs(id) on delete cascade,
  add column if not exists reliability_score integer,
  add column if not exists professionalism_score integer,
  add column if not exists communication_score integer,
  add column if not exists customer_service_score integer,
  add column if not exists pressure_handling_score integer,
  add column if not exists overall_score numeric(3,2),
  add column if not exists comment text not null default '',
  add column if not exists created_at timestamptz not null default now();

alter table if exists public.client_feedback
  add column if not exists reasons text[] not null default '{}',
  add column if not exists note text,
  add column if not exists created_at timestamptz not null default now();

alter table if exists public.notifications
  add column if not exists href text,
  add column if not exists is_read boolean not null default false,
  add column if not exists email_status public.email_job_status not null default 'queued',
  add column if not exists created_at timestamptz not null default now();

alter table if exists public.notification_email_jobs
  add column if not exists status public.email_job_status not null default 'queued',
  add column if not exists payload jsonb not null default '{}'::jsonb,
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

create or replace function public.set_operator_profile_age()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.age =
    case
      when new.date_of_birth is null then null
      else extract(year from age(current_date, new.date_of_birth))::int
    end;

  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute procedure public.set_updated_at();

drop trigger if exists operator_profiles_set_updated_at on public.operator_profiles;
create trigger operator_profiles_set_updated_at
before update on public.operator_profiles
for each row execute procedure public.set_updated_at();

drop trigger if exists operator_profiles_set_age on public.operator_profiles;
create trigger operator_profiles_set_age
before insert or update of date_of_birth on public.operator_profiles
for each row execute procedure public.set_operator_profile_age();

drop trigger if exists marketing_preferences_set_updated_at on public.marketing_preferences;
create trigger marketing_preferences_set_updated_at
before update on public.marketing_preferences
for each row execute procedure public.set_updated_at();

drop trigger if exists email_suppressions_set_updated_at on public.email_suppressions;
create trigger email_suppressions_set_updated_at
before update on public.email_suppressions
for each row execute procedure public.set_updated_at();

drop trigger if exists operator_payment_profiles_set_updated_at on public.operator_payment_profiles;
create trigger operator_payment_profiles_set_updated_at
before update on public.operator_payment_profiles
for each row execute procedure public.set_updated_at();

drop trigger if exists events_set_updated_at on public.events;
create trigger events_set_updated_at
before update on public.events
for each row execute procedure public.set_updated_at();

drop trigger if exists jobs_set_updated_at on public.jobs;
create trigger jobs_set_updated_at
before update on public.jobs
for each row execute procedure public.set_updated_at();

drop trigger if exists applications_set_updated_at on public.applications;
create trigger applications_set_updated_at
before update on public.applications
for each row execute procedure public.set_updated_at();

drop trigger if exists notification_email_jobs_set_updated_at on public.notification_email_jobs;
create trigger notification_email_jobs_set_updated_at
before update on public.notification_email_jobs
for each row execute procedure public.set_updated_at();

drop trigger if exists job_alerts_set_updated_at on public.job_alerts;
create trigger job_alerts_set_updated_at
before update on public.job_alerts
for each row execute procedure public.set_updated_at();

create or replace function public.log_application_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.application_status_history(application_id, from_status, to_status, actor_id)
    values (new.id, null, new.status, new.staff_id);
    return new;
  end if;

  if new.status is distinct from old.status then
    insert into public.application_status_history(application_id, from_status, to_status, actor_id)
    values (new.id, old.status, new.status, auth.uid());
  end if;

  return new;
end;
$$;

revoke execute on function public.log_application_status_change() from public;
revoke execute on function public.log_application_status_change() from anon;
revoke execute on function public.log_application_status_change() from authenticated;

drop trigger if exists applications_status_history_trigger on public.applications;
create trigger applications_status_history_trigger
after insert or update on public.applications
for each row execute procedure public.log_application_status_change();

create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_profiles_location on public.profiles(location);
create index if not exists idx_organizations_onboarding_status on public.organizations(onboarding_status, created_at desc);
create index if not exists idx_marketing_preferences_newsletter on public.marketing_preferences(newsletter_opt_in);
create index if not exists idx_marketing_preferences_offers on public.marketing_preferences(offers_opt_in);
create index if not exists idx_marketing_preferences_updates on public.marketing_preferences(product_updates_opt_in);
create unique index if not exists idx_marketing_preferences_unsubscribe_token on public.marketing_preferences(unsubscribe_token);
create unique index if not exists idx_marketing_preferences_email_normalized on public.marketing_preferences(email_normalized);
create index if not exists idx_email_suppressions_active on public.email_suppressions(active, email_normalized);
create index if not exists idx_memberships_profile on public.organization_memberships(profile_id);
create index if not exists idx_events_org on public.events(organization_id, event_date desc);
create index if not exists idx_events_service_tier on public.events(service_tier, event_date desc);
create index if not exists idx_jobs_event on public.jobs(event_id);
create index if not exists idx_jobs_status on public.jobs(status, shift_start);
create index if not exists idx_applications_staff on public.applications(staff_id, applied_at desc);
create index if not exists idx_ratings_staff on public.ratings(staff_id, created_at desc);
create index if not exists idx_operator_availability_operator on public.operator_availability_rules(operator_id, day_of_week);
create index if not exists idx_saved_jobs_staff_created_at on public.saved_jobs(staff_id, created_at desc);
create index if not exists idx_saved_jobs_job_id on public.saved_jobs(job_id);
create index if not exists idx_job_alerts_staff_active on public.job_alerts(staff_id, is_active, updated_at desc);
create index if not exists idx_client_feedback_staff on public.client_feedback(staff_id, created_at desc);
create index if not exists idx_notifications_user on public.notifications(user_id, created_at desc);
create index if not exists idx_operator_profiles_onboarding_status on public.operator_profiles(onboarding_status, updated_at desc);

drop view if exists public.ranked_staff;
drop view if exists public.staff_rating_summary;
drop view if exists public.application_activity;
drop view if exists public.rating_queue;

create view public.staff_rating_summary
with (security_invoker = true) as
with global_rating as (
  select coalesce(avg(overall_score)::numeric, 4.2) as global_mean from public.ratings
)
select
  p.id as staff_id,
  coalesce(avg(r.overall_score)::numeric, 0)::numeric(10,2) as average_rating,
  count(r.id)::int as review_count,
  coalesce(avg(r.reliability_score)::numeric, 0)::numeric(10,2) as reliability_rating,
  coalesce(avg(r.professionalism_score)::numeric, 0)::numeric(10,2) as professionalism_rating,
  coalesce(avg(r.communication_score)::numeric, 0)::numeric(10,2) as communication_rating,
  coalesce(avg(r.customer_service_score)::numeric, 0)::numeric(10,2) as customer_service_rating,
  coalesce(avg(r.pressure_handling_score)::numeric, 0)::numeric(10,2) as pressure_handling_rating,
  (
    (
      coalesce(avg(r.overall_score)::numeric, 0) * count(r.id)::numeric +
      (select global_mean from global_rating) * 5
    )
    / nullif(count(r.id)::numeric + 5, 0)
  )::numeric(10,4) as weighted_score
from public.profiles p
left join public.ratings r on r.staff_id = p.id
where p.role = 'staff'
group by p.id;

create view public.ranked_staff
with (security_invoker = true) as
select
  p.id as staff_id,
  p.full_name,
  p.email,
  p.phone,
  p.bio,
  p.skills,
  p.availability,
  p.avatar_url,
  p.location,
  p.languages,
  p.preferred_roles,
  p.age,
  s.average_rating,
  s.review_count,
  s.weighted_score,
  s.reliability_rating,
  s.professionalism_rating,
  s.communication_rating,
  s.customer_service_rating,
  s.pressure_handling_rating,
  row_number() over (
    order by
      s.weighted_score desc,
      s.average_rating desc,
      s.review_count desc,
      p.full_name asc
  ) as rank
from public.profiles p
join public.staff_rating_summary s on s.staff_id = p.id
where p.role = 'staff';

create view public.application_activity
with (security_invoker = true) as
select
  a.id,
  a.job_id,
  a.staff_id,
  a.status,
  a.cover_note,
  a.applied_at,
  j.title as job_title,
  e.title as event_title,
  e.event_date,
  o.name as organization_name,
  p.full_name as staff_name
from public.applications a
join public.jobs j on j.id = a.job_id
join public.events e on e.id = j.event_id
join public.organizations o on o.id = j.organization_id
join public.profiles p on p.id = a.staff_id;

create view public.rating_queue
with (security_invoker = true) as
select
  a.id as application_id,
  a.staff_id,
  j.id as job_id,
  j.title as job_title,
  e.id as event_id,
  e.title as event_title,
  e.organization_id,
  e.event_date
from public.applications a
join public.jobs j on j.id = a.job_id
join public.events e on e.id = j.event_id
left join public.ratings r on r.job_id = j.id and r.staff_id = a.staff_id
where a.status = 'accepted'
  and e.status = 'completed'
  and r.id is null;
