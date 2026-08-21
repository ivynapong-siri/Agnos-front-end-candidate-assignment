-- Agnos intake — persistent storage for submitted forms.
--
-- Run this once in the Supabase dashboard: SQL Editor -> New query -> paste ->
-- Run. It is safe to run twice.
--
-- Why this exists: until now the front desk held everything in memory, so a
-- reload — on either side — emptied the board. Staff need the day's intakes to
-- survive a refresh and to be the same list on every machine.

create table if not exists public.intake (
  session_id  uuid        primary key,
  -- The ?room= channel, so two people testing side by side do not see each
  -- other's patients. Matches the realtime topic exactly.
  room        text        not null default 'agnos-intake-v1',
  data        jsonb       not null,
  submitted   boolean     not null default false,
  filled      integer     not null default 0,
  total       integer     not null default 9,
  started_at  timestamptz not null,
  updated_at  timestamptz not null default now()
);

-- The board reads one room, newest first.
create index if not exists intake_room_updated_idx
  on public.intake (room, updated_at desc);

alter table public.intake enable row level security;

-- The browser holds the publishable key and nothing else, so these policies are
-- what the browser is allowed to do. They are deliberately open, and that is a
-- decision for a demonstration rather than a clinic:
--
--   * anyone with the key can read every row
--   * anyone with the key can write a row
--
-- That is already true of the realtime channel this replaces, but a table keeps
-- the data after everyone has gone home, which is a different kind of exposure.
-- A real deployment would put these rows behind an authenticated staff role and
-- have the patient write through a server that checks something first.
drop policy if exists intake_read on public.intake;
create policy intake_read on public.intake
  for select to anon, authenticated using (true);

drop policy if exists intake_write on public.intake;
create policy intake_write on public.intake
  for insert to anon, authenticated with check (true);

drop policy if exists intake_update on public.intake;
create policy intake_update on public.intake
  for update to anon, authenticated using (true) with check (true);

-- Retention. This table is entirely personal information, so it should not
-- accumulate. Anything older than a day is cleared the next time anyone writes.
create or replace function public.intake_sweep() returns trigger
language plpgsql as $$
begin
  delete from public.intake where updated_at < now() - interval '24 hours';
  return null;
end;
$$;

drop trigger if exists intake_sweep_trigger on public.intake;
create trigger intake_sweep_trigger
  after insert on public.intake
  for each statement execute function public.intake_sweep();
