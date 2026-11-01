-- 30 & FABULOUS — RSVP database setup
-- Run this once in Supabase Dashboard -> SQL Editor -> New query.

create table if not exists public.guests (
  id bigint generated always as identity primary key,
  name text not null check (char_length(trim(name)) between 2 and 100),
  contact text not null check (char_length(trim(contact)) between 3 and 160),
  attendance text not null check (attendance in ('yes', 'part', 'no')),
  drink text not null default '',
  note text not null default '' check (char_length(note) <= 1000),
  created_at timestamptz not null default now()
);

alter table public.guests enable row level security;

-- Public visitors can submit an RSVP, but cannot read, edit, or delete guest records.
drop policy if exists "Guests can submit RSVP" on public.guests;
create policy "Guests can submit RSVP"
on public.guests
for insert
to anon
with check (
  char_length(trim(name)) between 2 and 100
  and char_length(trim(contact)) between 3 and 160
  and attendance in ('yes', 'part', 'no')
  and char_length(coalesce(note, '')) <= 1000
);

grant insert on table public.guests to anon;
grant usage, select on sequence public.guests_id_seq to anon;
