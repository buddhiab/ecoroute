-- EcoRoute — enforce WHO may write to the admin-controlled tables.
--
-- Run once in the Supabase SQL Editor. It is wrapped in a transaction: if any statement
-- fails, nothing is applied. Safe to re-run. Emergency undo: sql/rls-rollback.sql.
--
-- Before this, any logged-in user (even a plain citizen) could approve drivers, change
-- zones, resolve/assign any report, create routes and delete driver profiles.
--
-- Admin identity comes from app_metadata (writable only with the service-role key),
-- never user_metadata (editable by the user). After running, sign out and back in as
-- admin once so your login token carries the role.
--
-- Reads are intentionally left open for now (public tracking page, landing stats,
-- registration pickers); locking down what the public key can READ is a separate step.
-- Server routes use the service role, which bypasses these rules.

begin;

-- ── helper: is the caller a real admin? ──────────────────────────────────────────
create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') in ('admin', 'super_admin'), false)
$$;

-- ── start clean: drop every existing policy on the tables managed here ──────────
do $$
declare p record;
begin
  for p in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in ('CitizenReports', 'driver_profiles', 'Routes', 'vehicles',
                        'HCILogs', 'push_subscriptions', 'admin_profiles')
  loop
    execute format('drop policy %I on %I.%I', p.policyname, p.schemaname, p.tablename);
  end loop;
end $$;

alter table public."CitizenReports"    enable row level security;
alter table public."driver_profiles"   enable row level security;
alter table public."Routes"            enable row level security;
alter table public."vehicles"          enable row level security;
alter table public."HCILogs"           enable row level security;
alter table public."push_subscriptions" enable row level security;

do $$
begin
  if to_regclass('public.admin_profiles') is not null then
    execute 'alter table public.admin_profiles enable row level security';
  end if;
end $$;
-- push_subscriptions and admin_profiles get NO policies: only server routes (service role) touch them.

-- ── CitizenReports ───────────────────────────────────────────────────────────────
create policy reports_read on public."CitizenReports"
  for select to anon, authenticated using (true);

-- a citizen can file a report only as themselves, unassigned, unrewarded, Pending
create policy reports_insert_own on public."CitizenReports"
  for insert to authenticated
  with check (
    user_id::text = auth.uid()::text
    and status = 'Pending'
    and assigned_driver_id is null
    and reward_tx is null
  );

create policy reports_admin_update on public."CitizenReports"
  for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- a driver can move reports ASSIGNED TO THEM to In Progress / Resolved (see trigger below)
create policy reports_driver_update on public."CitizenReports"
  for update to authenticated
  using (assigned_driver_id::text in (
    select id::text from public.driver_profiles where user_id::text = auth.uid()::text))
  with check (
    assigned_driver_id::text in (
      select id::text from public.driver_profiles where user_id::text = auth.uid()::text)
    and status in ('In Progress', 'Resolved')
  );

create policy reports_admin_delete on public."CitizenReports"
  for delete to authenticated using (public.is_admin());

-- a driver may change ONLY the status of a report
create or replace function public.guard_report_update()
returns trigger
language plpgsql
as $$
begin
  if current_user in ('service_role', 'postgres', 'supabase_admin') or public.is_admin() then
    return new;
  end if;
  if (to_jsonb(new) - array['status', 'updated_at']) is distinct from
     (to_jsonb(old) - array['status', 'updated_at']) then
    raise exception 'Only the status of an assigned report can be changed here.' using errcode = '42501';
  end if;
  return new;
end
$$;

drop trigger if exists guard_report_update on public."CitizenReports";
create trigger guard_report_update
  before update on public."CitizenReports"
  for each row execute function public.guard_report_update();

-- ── driver_profiles ──────────────────────────────────────────────────────────────
create policy drivers_read on public."driver_profiles"
  for select to anon, authenticated using (true);

-- self-registration: always lands unapproved (works with or without an immediate session)
create policy drivers_register on public."driver_profiles"
  for insert to anon, authenticated
  with check (is_approved = false);

create policy drivers_admin_update on public."driver_profiles"
  for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy drivers_self_update on public."driver_profiles"
  for update to authenticated
  using (user_id::text = auth.uid()::text)
  with check (user_id::text = auth.uid()::text);

create policy drivers_admin_delete on public."driver_profiles"
  for delete to authenticated using (public.is_admin());

-- a driver may change ONLY live location, tracking state and their alert — never
-- is_approved, zone, vehicle, licence or identity
create or replace function public.guard_driver_update()
returns trigger
language plpgsql
as $$
begin
  if current_user in ('service_role', 'postgres', 'supabase_admin') or public.is_admin() then
    return new;
  end if;
  if (to_jsonb(new) - array['latitude', 'longitude', 'is_tracking', 'tracking_task_id', 'recent_alert', 'updated_at']) is distinct from
     (to_jsonb(old) - array['latitude', 'longitude', 'is_tracking', 'tracking_task_id', 'recent_alert', 'updated_at']) then
    raise exception 'Drivers can only update their live location, tracking state and alerts.' using errcode = '42501';
  end if;
  return new;
end
$$;

drop trigger if exists guard_driver_update on public."driver_profiles";
create trigger guard_driver_update
  before update on public."driver_profiles"
  for each row execute function public.guard_driver_update();

-- ── Routes ───────────────────────────────────────────────────────────────────────
create policy routes_read on public."Routes"
  for select to anon, authenticated using (true);

create policy routes_admin_write on public."Routes"
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- a driver may mark THEIR OWN route Completed (dashboard + offline sync)
create policy routes_driver_complete on public."Routes"
  for update to authenticated
  using (exists (
    select 1 from public.driver_profiles d
    where d.user_id::text = auth.uid()::text and d.full_name = "Routes".driver_name))
  with check (
    status = 'Completed'
    and exists (
      select 1 from public.driver_profiles d
      where d.user_id::text = auth.uid()::text and d.full_name = "Routes".driver_name)
  );

-- ── vehicles ─────────────────────────────────────────────────────────────────────
create policy vehicles_read on public."vehicles"
  for select to anon, authenticated using (true);

create policy vehicles_admin_write on public."vehicles"
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ── HCILogs (usability telemetry) ────────────────────────────────────────────────
create policy hci_admin_read on public."HCILogs"
  for select to authenticated using (public.is_admin());

create policy hci_insert on public."HCILogs"
  for insert to authenticated with check (true);

create policy hci_admin_update on public."HCILogs"
  for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy hci_admin_delete on public."HCILogs"
  for delete to authenticated using (public.is_admin());

commit;
