-- Stega — pedometer som stegkälla
-- V1 läser stegen från telefonens inbyggda stegräknare (CoreMotion via
-- Expos pedometer). HealthKit/Health Connect tar över i utvecklingsbygget.

alter table public.daily_steps
  drop constraint daily_steps_source_check;
alter table public.daily_steps
  add constraint daily_steps_source_check
  check (source in ('healthkit', 'health_connect', 'pedometer'));
