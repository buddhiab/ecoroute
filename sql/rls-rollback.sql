-- EMERGENCY UNDO for sql/rls-hardening.sql.
-- Puts the managed tables back to "any logged-in user can do anything" so the app works
-- again while a problem is investigated. This re-opens the admin-controls hole — it is a
-- stop-gap, not a fix.

begin;

drop trigger if exists guard_report_update on public."CitizenReports";
drop trigger if exists guard_driver_update on public."driver_profiles";

do $$
declare p record;
begin
  for p in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in ('CitizenReports', 'driver_profiles', 'Routes', 'vehicles', 'HCILogs')
  loop
    execute format('drop policy %I on %I.%I', p.policyname, p.schemaname, p.tablename);
  end loop;
end $$;

create policy open_all on public."CitizenReports" for all to anon, authenticated using (true) with check (true);
create policy open_all on public."driver_profiles" for all to anon, authenticated using (true) with check (true);
create policy open_all on public."Routes"          for all to anon, authenticated using (true) with check (true);
create policy open_all on public."vehicles"        for all to anon, authenticated using (true) with check (true);
create policy open_all on public."HCILogs"         for all to anon, authenticated using (true) with check (true);

commit;
