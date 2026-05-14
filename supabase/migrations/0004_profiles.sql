-- User profile storage for resume builder
create table if not exists public.profiles (
  user_id text primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create index if not exists profiles_updated_at_idx
  on public.profiles (updated_at desc);
