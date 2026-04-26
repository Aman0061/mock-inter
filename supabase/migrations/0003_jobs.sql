-- Job descriptions analyzed by AI to produce structured prep material.
-- Writes happen server-side via the service-role key, scoped by Clerk user_id.

create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  raw_text text not null,
  title text,
  company text,
  seniority text,
  analysis jsonb,
  status text not null default 'pending' check (status in ('pending', 'ready', 'failed')),
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists jobs_user_id_updated_idx
  on public.jobs (user_id, updated_at desc);

alter table public.jobs enable row level security;
-- Только service-role пишет/читает; anon/auth заблокированы.
