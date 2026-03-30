create extension if not exists pgcrypto;

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
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
  created_at timestamptz not null default now(),
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

create table if not exists public.ratings (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  staff_id uuid not null references public.profiles(id) on delete cascade,
  organiser_id uuid not null references public.profiles(id) on delete restrict,
  rating integer not null check (rating between 1 and 5),
  comment text not null default '',
  created_at timestamptz not null default now(),
  unique (event_id, staff_id, organiser_id)
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
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

create or replace function public.log_application_status_change()
returns trigger
language plpgsql
security definer
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

drop trigger if exists applications_status_history_trigger on public.applications;
create trigger applications_status_history_trigger
after insert or update on public.applications
for each row execute procedure public.log_application_status_change();

create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_memberships_profile on public.organization_memberships(profile_id);
create index if not exists idx_events_org on public.events(organization_id, event_date desc);
create index if not exists idx_jobs_event on public.jobs(event_id);
create index if not exists idx_jobs_status on public.jobs(status, shift_start);
create index if not exists idx_applications_staff on public.applications(staff_id, applied_at desc);
create index if not exists idx_ratings_staff on public.ratings(staff_id, created_at desc);

create or replace view public.staff_rating_summary as
select
  p.id as staff_id,
  coalesce(avg(r.rating)::numeric, 0)::numeric(10,2) as average_rating,
  count(r.id)::int as review_count
from public.profiles p
left join public.ratings r on r.staff_id = p.id
where p.role = 'staff'
group by p.id;

create or replace view public.ranked_staff as
with global_rating as (
  select coalesce(avg(rating)::numeric, 4.2) as global_mean from public.ratings
)
select
  p.id as staff_id,
  p.full_name,
  p.email,
  p.phone,
  p.bio,
  p.skills,
  p.availability,
  p.avatar_url,
  s.average_rating,
  s.review_count,
  (
    (s.average_rating * s.review_count + g.global_mean * 5)
    / nullif((s.review_count + 5), 0)
  )::numeric(10,4) as weighted_score,
  row_number() over (
    order by
      (
        (s.average_rating * s.review_count + g.global_mean * 5)
        / nullif((s.review_count + 5), 0)
      ) desc,
      s.average_rating desc,
      s.review_count desc,
      p.full_name asc
  ) as rank
from public.profiles p
join public.staff_rating_summary s on s.staff_id = p.id
cross join global_rating g
where p.role = 'staff';

create or replace view public.application_activity as
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

create or replace view public.rating_queue as
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
left join public.ratings r on r.event_id = e.id and r.staff_id = a.staff_id
where a.status = 'accepted'
  and e.status = 'completed'
  and r.id is null;
