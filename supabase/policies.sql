alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.organization_memberships enable row level security;
alter table public.events enable row level security;
alter table public.jobs enable row level security;
alter table public.applications enable row level security;
alter table public.application_status_history enable row level security;
alter table public.ratings enable row level security;

create or replace function public.is_org_member(org_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.organization_memberships m
    where m.organization_id = org_id
      and m.profile_id = auth.uid()
  );
$$;

drop policy if exists "profiles_select_self_or_public_staff" on public.profiles;
create policy "profiles_select_self_or_public_staff"
on public.profiles
for select
using (id = auth.uid() or role = 'staff');

drop policy if exists "profiles_update_self" on public.profiles;
create policy "profiles_update_self"
on public.profiles
for update
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "profiles_insert_self" on public.profiles;
create policy "profiles_insert_self"
on public.profiles
for insert
with check (id = auth.uid());

drop policy if exists "organizations_select_members" on public.organizations;
create policy "organizations_select_members"
on public.organizations
for select
using (public.is_org_member(id));

drop policy if exists "organizations_insert_owner" on public.organizations;
create policy "organizations_insert_owner"
on public.organizations
for insert
with check (true);

drop policy if exists "memberships_select_self_or_org_members" on public.organization_memberships;
create policy "memberships_select_self_or_org_members"
on public.organization_memberships
for select
using (profile_id = auth.uid() or public.is_org_member(organization_id));

drop policy if exists "memberships_insert_self" on public.organization_memberships;
create policy "memberships_insert_self"
on public.organization_memberships
for insert
with check (profile_id = auth.uid());

drop policy if exists "events_public_read_published" on public.events;
create policy "events_public_read_published"
on public.events
for select
using (status in ('published', 'completed') or public.is_org_member(organization_id));

drop policy if exists "events_org_manage" on public.events;
create policy "events_org_manage"
on public.events
for all
using (public.is_org_member(organization_id))
with check (public.is_org_member(organization_id) and created_by = auth.uid());

drop policy if exists "jobs_public_read_open_closed" on public.jobs;
create policy "jobs_public_read_open_closed"
on public.jobs
for select
using (status in ('open', 'closed') or public.is_org_member(organization_id));

drop policy if exists "jobs_org_manage" on public.jobs;
create policy "jobs_org_manage"
on public.jobs
for all
using (public.is_org_member(organization_id))
with check (public.is_org_member(organization_id) and created_by = auth.uid());

drop policy if exists "applications_staff_read_own" on public.applications;
create policy "applications_staff_read_own"
on public.applications
for select
using (
  staff_id = auth.uid()
  or public.is_org_member((select organization_id from public.jobs where id = job_id))
);

drop policy if exists "applications_staff_insert_own" on public.applications;
create policy "applications_staff_insert_own"
on public.applications
for insert
with check (
  staff_id = auth.uid()
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'staff'
  )
);

drop policy if exists "applications_update_by_owner_or_staff_withdraw" on public.applications;
create policy "applications_update_by_owner_or_staff_withdraw"
on public.applications
for update
using (
  staff_id = auth.uid()
  or public.is_org_member((select organization_id from public.jobs where id = job_id))
)
with check (
  (
    staff_id = auth.uid()
    and status = 'withdrawn'
  )
  or public.is_org_member((select organization_id from public.jobs where id = job_id))
);

drop policy if exists "history_read_related_users" on public.application_status_history;
create policy "history_read_related_users"
on public.application_status_history
for select
using (
  exists (
    select 1
    from public.applications a
    join public.jobs j on j.id = a.job_id
    where a.id = application_id
      and (a.staff_id = auth.uid() or public.is_org_member(j.organization_id))
  )
);

drop policy if exists "ratings_public_read" on public.ratings;
create policy "ratings_public_read"
on public.ratings
for select
using (true);

drop policy if exists "ratings_insert_authorised_organisers" on public.ratings;
create policy "ratings_insert_authorised_organisers"
on public.ratings
for insert
with check (
  organiser_id = auth.uid()
  and public.is_org_member(organization_id)
  and exists (
    select 1
    from public.applications a
    join public.jobs j on j.id = a.job_id
    join public.events e on e.id = j.event_id
    where a.staff_id = ratings.staff_id
      and a.status = 'accepted'
      and e.id = ratings.event_id
      and e.status = 'completed'
      and j.organization_id = ratings.organization_id
  )
);
