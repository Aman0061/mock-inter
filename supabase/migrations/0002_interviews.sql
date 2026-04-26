-- Interview sessions for signed-in users.
-- Writes happen server-side via the service-role key, scoped by Clerk user_id.

create table if not exists public.interviews (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  type text not null check (type in ('product_sense', 'behavioral', 'analytical', 'strategy')),
  company text,
  status text not null default 'active' check (status in ('active', 'completed')),
  message_count integer not null default 0,
  messages jsonb not null default '[]'::jsonb,
  feedback text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists interviews_user_id_updated_idx
  on public.interviews (user_id, updated_at desc);

alter table public.interviews enable row level security;
-- No policies => только service-role пишет/читает; anon/auth заблокированы.
