-- Canonical migration plan: keep public.events as master table.
-- Non-destructive: creates missing structures only.

create extension if not exists "pgcrypto";

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  event_type text not null,
  category text,
  subcategory text,
  city text,
  county text,
  state text not null default 'Michigan',
  country text not null default 'USA',
  venue_name text,
  official_website text,
  facebook_url text,
  instagram_url text,
  typical_month text,
  typical_season text,
  recurrence_pattern text,
  short_description text,
  long_description text,
  status text not null default 'active',
  verification_status text not null default 'verified',
  confidence_score numeric(3,2) check (confidence_score >= 0 and confidence_score <= 1),
  first_discovered_at timestamptz,
  last_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.discovery_sources (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  source_url text not null unique,
  source_type text not null,
  region text,
  city text,
  county text,
  state text not null default 'Michigan',
  priority text not null default 'medium',
  trust_score numeric(3,2) not null default 0.50 check (trust_score >= 0 and trust_score <= 1),
  is_active boolean not null default true,
  notes text,
  last_checked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.discovery_runs (
  id uuid primary key default gen_random_uuid(),
  run_type text not null,
  source_id uuid references public.discovery_sources(id) on delete set null,
  status text not null default 'pending',
  started_at timestamptz,
  completed_at timestamptz,
  items_found integer not null default 0,
  candidates_created integer not null default 0,
  duplicates_flagged integer not null default 0,
  estimated_cost numeric(12,2),
  actual_cost numeric(12,2),
  approval_required boolean not null default false,
  approval_status text not null default 'not_required',
  error_message text,
  notes text,
  run_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.event_candidates (
  id uuid primary key default gen_random_uuid(),
  discovery_run_id uuid not null references public.discovery_runs(id) on delete cascade,
  candidate_name text not null,
  normalized_name text,
  slug_candidate text,
  event_type text not null default 'unknown',
  category text,
  subcategory text,
  city text,
  county text,
  state text not null default 'Michigan',
  country text not null default 'USA',
  venue_name text,
  start_date date,
  end_date date,
  typical_month text,
  typical_season text,
  probable_recurrence text,
  description text,
  official_website_candidate text,
  social_links jsonb not null default '[]'::jsonb,
  source_urls jsonb not null default '[]'::jsonb,
  discovery_confidence numeric(3,2) not null default 0.50 check (discovery_confidence >= 0 and discovery_confidence <= 1),
  verification_status text not null default 'needs_review',
  duplicate_status text not null default 'unique_candidate',
  matched_event_id uuid references public.events(id) on delete set null,
  needs_review boolean not null default true,
  semantic_notes text,
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.event_candidate_sources (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.event_candidates(id) on delete cascade,
  source_name text,
  source_url text not null,
  source_type text,
  source_excerpt text,
  trust_score numeric(3,2) check (trust_score >= 0 and trust_score <= 1),
  last_accessed timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.event_candidate_matches (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.event_candidates(id) on delete cascade,
  possible_event_id uuid references public.events(id) on delete set null,
  possible_candidate_id uuid references public.event_candidates(id) on delete set null,
  match_score numeric(3,2) not null check (match_score >= 0 and match_score <= 1),
  match_reason text not null,
  recommended_action text not null default 'review',
  status text not null default 'pending_review',
  reviewed_by text,
  created_at timestamptz not null default now()
);

create table if not exists public.supplier_discoveries (
  id uuid primary key default gen_random_uuid(),
  discovery_run_id uuid not null references public.discovery_runs(id) on delete cascade,
  supplier_name text not null,
  supplier_type text,
  website text,
  source_url text,
  events_found jsonb not null default '[]'::jsonb,
  relationship_types jsonb not null default '[]'::jsonb,
  confidence numeric(3,2) check (confidence >= 0 and confidence <= 1),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.snapshot_import_errors (
  id uuid primary key default gen_random_uuid(),
  discovery_run_id uuid references public.discovery_runs(id) on delete set null,
  stage text not null,
  record_type text not null,
  payload jsonb,
  error_message text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_event_candidates_run on public.event_candidates(discovery_run_id);
create index if not exists idx_candidate_matches_candidate on public.event_candidate_matches(candidate_id);
create index if not exists idx_snapshot_errors_run on public.snapshot_import_errors(discovery_run_id);

-- NOTE: public.festivals intentionally untouched here.
-- It can be dropped in a future explicitly approved migration once no runtime dependencies remain.
