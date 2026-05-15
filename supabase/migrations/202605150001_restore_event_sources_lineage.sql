-- Restore canonical event-level lineage table for promoted events.
-- Non-destructive: create only if missing; add uniqueness needed by upsert conflict target.

create table if not exists public.event_sources (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  source_name text,
  source_url text not null,
  source_type text,
  trust_score numeric(3,2) check (trust_score >= 0 and trust_score <= 1),
  source_notes text,
  last_accessed timestamptz,
  created_at timestamptz not null default now()
);

create unique index if not exists idx_event_sources_event_url_unique
  on public.event_sources(event_id, source_url);
