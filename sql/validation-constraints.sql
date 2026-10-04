-- EcoRoute — database-level validation (the last line of defence).
--
-- Forms and server routes already validate input (src/lib/validation.js), but several
-- writes go from the browser straight to the database (citizen registration, report
-- submission, driver registration…). These CHECK constraints make the database refuse
-- clearly invalid data no matter who sends it.
--
-- Run once in the Supabase SQL Editor. All-or-nothing (transaction) and safe to re-run.
-- Every existing row was checked beforehand and satisfies these rules.
--
-- NOTE: the zone list below must match src/lib/zones.js — if a zone is ever added,
-- update both.

begin;

-- ── CitizenReports ───────────────────────────────────────────────────────────────
alter table public."CitizenReports" drop constraint if exists reports_description_len;
alter table public."CitizenReports" add constraint reports_description_len
  check (description is null or char_length(description) <= 1000);

alter table public."CitizenReports" drop constraint if exists reports_address_len;
alter table public."CitizenReports" add constraint reports_address_len
  check (exact_address is null or char_length(btrim(exact_address)) between 3 and 200);

alter table public."CitizenReports" drop constraint if exists reports_lat_range;
alter table public."CitizenReports" add constraint reports_lat_range
  check (latitude is null or latitude between 5.5 and 10.0);

alter table public."CitizenReports" drop constraint if exists reports_lng_range;
alter table public."CitizenReports" add constraint reports_lng_range
  check (longitude is null or longitude between 79.3 and 82.1);

alter table public."CitizenReports" drop constraint if exists reports_zone_valid;
alter table public."CitizenReports" add constraint reports_zone_valid
  check (zone in ('Colombo 03', 'Colombo 04', 'Colombo 05', 'Colombo 07'));

alter table public."CitizenReports" drop constraint if exists reports_issue_len;
alter table public."CitizenReports" add constraint reports_issue_len
  check (issue_type is null or char_length(issue_type) <= 100);

-- ── driver_profiles ──────────────────────────────────────────────────────────────
alter table public."driver_profiles" drop constraint if exists drivers_name_len;
alter table public."driver_profiles" add constraint drivers_name_len
  check (full_name is not null and char_length(btrim(full_name)) between 1 and 100);

alter table public."driver_profiles" drop constraint if exists drivers_license_len;
alter table public."driver_profiles" add constraint drivers_license_len
  check (license_number is null or char_length(license_number) <= 30);

alter table public."driver_profiles" drop constraint if exists drivers_zone_valid;
alter table public."driver_profiles" add constraint drivers_zone_valid
  check (assigned_zone is null or assigned_zone in ('Colombo 03', 'Colombo 04', 'Colombo 05', 'Colombo 07'));

alter table public."driver_profiles" drop constraint if exists drivers_vehicle_len;
alter table public."driver_profiles" add constraint drivers_vehicle_len
  check (vehicle_number is null or char_length(vehicle_number) <= 30);

alter table public."driver_profiles" drop constraint if exists drivers_phone_len;
alter table public."driver_profiles" add constraint drivers_phone_len
  check (phone_number is null or char_length(phone_number) <= 20);

-- ── profiles (citizen / admin) ───────────────────────────────────────────────────
alter table public."profiles" drop constraint if exists profiles_name_len;
alter table public."profiles" add constraint profiles_name_len
  check (full_name is null or char_length(full_name) <= 100);

alter table public."profiles" drop constraint if exists profiles_phone_len;
alter table public."profiles" add constraint profiles_phone_len
  check (phone is null or char_length(phone) <= 20);

alter table public."profiles" drop constraint if exists profiles_house_len;
alter table public."profiles" add constraint profiles_house_len
  check (house_number is null or char_length(house_number) <= 30);

alter table public."profiles" drop constraint if exists profiles_zone_valid;
alter table public."profiles" add constraint profiles_zone_valid
  check (zone is null or zone = '' or zone in ('Colombo 03', 'Colombo 04', 'Colombo 05', 'Colombo 07'));

-- ── vehicles ─────────────────────────────────────────────────────────────────────
alter table public."vehicles" drop constraint if exists vehicles_plate_format;
alter table public."vehicles" add constraint vehicles_plate_format
  check (registration_number ~ '^[A-Z0-9][A-Z0-9 -]{2,14}$');

-- ── BankPayouts ──────────────────────────────────────────────────────────────────
alter table public."BankPayouts" drop constraint if exists payouts_amounts;
alter table public."BankPayouts" add constraint payouts_amounts
  check (eco_burned > 0 and lkr_amount >= 0);

alter table public."BankPayouts" drop constraint if exists payouts_account_digits;
alter table public."BankPayouts" add constraint payouts_account_digits
  check (account_number ~ '^[0-9]{6,20}$');

alter table public."BankPayouts" drop constraint if exists payouts_account_name_len;
alter table public."BankPayouts" add constraint payouts_account_name_len
  check (char_length(btrim(account_name)) between 2 and 100);

alter table public."BankPayouts" drop constraint if exists payouts_bank_valid;
alter table public."BankPayouts" add constraint payouts_bank_valid
  check (bank_name in ('Commercial Bank', 'Hatton National Bank (HNB)', 'Sampath Bank',
                       'Bank of Ceylon (BOC)', 'People''s Bank', 'DFCC Bank'));

commit;
