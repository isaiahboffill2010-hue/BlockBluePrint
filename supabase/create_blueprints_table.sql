-- Create the blueprints table used by BlockBlueprint.
-- Run this in your Supabase SQL editor or migration workflow.

create extension if not exists "pgcrypto";

create table if not exists public.blueprints (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  prompt text not null,
  name text,
  status text not null default 'generated',
  blueprint_data jsonb,
  created_at timestamptz not null default now()
);

create index if not exists blueprints_user_id_idx on public.blueprints (user_id);
create index if not exists blueprints_created_at_idx on public.blueprints (created_at desc);

alter table public.blueprints enable row level security;

drop policy if exists "Users can read their own blueprints" on public.blueprints;
create policy "Users can read their own blueprints"
  on public.blueprints
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can create their own blueprints" on public.blueprints;
create policy "Users can create their own blueprints"
  on public.blueprints
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own blueprints" on public.blueprints;
create policy "Users can update their own blueprints"
  on public.blueprints
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own blueprints" on public.blueprints;
create policy "Users can delete their own blueprints"
  on public.blueprints
  for delete
  to authenticated
  using (auth.uid() = user_id);
