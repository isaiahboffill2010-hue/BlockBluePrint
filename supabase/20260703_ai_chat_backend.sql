-- BlockBlueprint AI chat backend schema.
-- Run this in Supabase before using POST /api/chat.

create extension if not exists "pgcrypto";

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  name text not null,
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  project_id uuid references public.projects(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  intent text,
  created_at timestamptz not null default now()
);

alter table public.blueprints
  add column if not exists project_id uuid references public.projects(id) on delete set null,
  add column if not exists title text,
  add column if not exists description text,
  add column if not exists difficulty text,
  add column if not exists estimated_time text,
  add column if not exists estimated_blocks integer,
  add column if not exists dimensions jsonb,
  add column if not exists raw_blueprint jsonb,
  add column if not exists updated_at timestamptz not null default now();

create table if not exists public.blueprint_sections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  project_id uuid references public.projects(id) on delete cascade,
  blueprint_id uuid not null references public.blueprints(id) on delete cascade,
  name text not null,
  description text,
  estimated_time text,
  status text not null default 'pending',
  sort_order integer not null default 0,
  layers jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists projects_user_id_idx on public.projects (user_id);
create index if not exists projects_updated_at_idx on public.projects (updated_at desc);
create index if not exists conversations_user_id_idx on public.conversations (user_id);
create index if not exists conversations_project_id_idx on public.conversations (project_id);
create index if not exists messages_conversation_id_idx on public.messages (conversation_id, created_at);
create index if not exists blueprints_project_id_idx on public.blueprints (project_id);
create index if not exists blueprint_sections_blueprint_id_idx on public.blueprint_sections (blueprint_id, sort_order);

alter table public.projects enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.blueprint_sections enable row level security;

drop policy if exists "Users can read their own projects" on public.projects;
create policy "Users can read their own projects"
  on public.projects for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can create their own projects" on public.projects;
create policy "Users can create their own projects"
  on public.projects for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own projects" on public.projects;
create policy "Users can update their own projects"
  on public.projects for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own projects" on public.projects;
create policy "Users can delete their own projects"
  on public.projects for delete to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can read their own conversations" on public.conversations;
create policy "Users can read their own conversations"
  on public.conversations for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can create their own conversations" on public.conversations;
create policy "Users can create their own conversations"
  on public.conversations for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own conversations" on public.conversations;
create policy "Users can update their own conversations"
  on public.conversations for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can read their own messages" on public.messages;
create policy "Users can read their own messages"
  on public.messages for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can create their own messages" on public.messages;
create policy "Users can create their own messages"
  on public.messages for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can read their own sections" on public.blueprint_sections;
create policy "Users can read their own sections"
  on public.blueprint_sections for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can create their own sections" on public.blueprint_sections;
create policy "Users can create their own sections"
  on public.blueprint_sections for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own sections" on public.blueprint_sections;
create policy "Users can update their own sections"
  on public.blueprint_sections for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own sections" on public.blueprint_sections;
create policy "Users can delete their own sections"
  on public.blueprint_sections for delete to authenticated
  using (auth.uid() = user_id);
