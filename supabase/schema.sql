-- ============================================================
-- AdZen.co — Supabase schema for contact + newsletter forms
-- ============================================================
-- How to use:
-- 1. Create a free project at https://supabase.com
-- 2. Open the SQL Editor in your project dashboard
-- 3. Paste this entire file and click "Run"
-- 4. Copy your Project URL + anon/public API key (Settings > API)
--    into the config section near the top of index.html's <script>
-- ============================================================

-- Required for gen_random_uuid()
create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- Contact form submissions
-- ------------------------------------------------------------
create table if not exists contact_submissions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null check (char_length(name) between 1 and 200),
  email text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  phone text check (phone is null or char_length(phone) <= 30),
  company text check (company is null or char_length(company) <= 200),
  message text not null check (char_length(message) between 1 and 5000),
  status text not null default 'new' check (status in ('new','contacted','closed'))
);

alter table contact_submissions enable row level security;

-- Public (anon) visitors may INSERT only — never read, update, or delete.
-- View/manage submissions from the Supabase Table Editor while logged
-- in as the project owner (that request uses your service role, which
-- bypasses RLS, so no separate "read" policy is needed for you).
create policy "public can insert contact submissions"
  on contact_submissions
  for insert
  to anon
  with check (true);

-- ------------------------------------------------------------
-- Newsletter subscribers
-- ------------------------------------------------------------
create table if not exists newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text check (name is null or char_length(name) <= 200),
  email text not null unique check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  phone text check (phone is null or char_length(phone) <= 30)
);

alter table newsletter_subscribers enable row level security;

create policy "public can insert newsletter subscribers"
  on newsletter_subscribers
  for insert
  to anon
  with check (true);

-- ------------------------------------------------------------
-- Helpful indexes for the dashboard / future admin views
-- ------------------------------------------------------------
create index if not exists idx_contact_created_at on contact_submissions (created_at desc);
create index if not exists idx_newsletter_created_at on newsletter_subscribers (created_at desc);

-- ------------------------------------------------------------
-- Notes
-- ------------------------------------------------------------
-- • The anon/public API key is DESIGNED to be used in frontend code.
--   It is safe to embed as long as Row Level Security (above) is on
--   and no SELECT/UPDATE/DELETE policies exist for the anon role,
--   which is exactly what this schema does — public visitors can only
--   add rows, never read or change existing ones.
-- • Never put your "service_role" key anywhere in frontend code — that
--   key bypasses RLS entirely and must stay server-side/private only.
-- • To export submissions as CSV: Table Editor → select table → Export.
-- • The honeypot field is enforced in the frontend JS (silently
--   discarded before the request is sent), so it isn't a DB column here.
