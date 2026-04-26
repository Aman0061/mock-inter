-- Waitlist for landing page email capture.
-- Writes happen server-side using the service-role key, so no public RLS policies.

create table if not exists public.waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  source text,
  created_at timestamptz not null default now()
);

create index if not exists waitlist_created_at_idx
  on public.waitlist (created_at desc);

alter table public.waitlist enable row level security;
-- No policies => only service-role bypasses RLS, anon/auth roles are blocked.
