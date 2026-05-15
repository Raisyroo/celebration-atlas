# Celebration Atlas

## Local Supabase ingestion package (run on your machine/Codespaces)

This repository includes portable local scripts for Supabase connection testing and write testing.

### 1) Setup

```bash
cp .env.example .env
# fill in real values in .env
npm install
```

### 2) Run connection test

```bash
node --env-file=.env scripts/test_supabase_connection.mjs
# or
npm run test:supabase -- --env-file=.env
```

### 3) Run test insert

```bash
node --env-file=.env scripts/insert_test_event.mjs
# or
npm run test:insert-event -- --env-file=.env
```

## Notes

- Do not commit real secrets.
- Scripts require:
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
- These scripts are intended to run where outbound HTTPS is available (local machine or GitHub Codespaces).


Legacy note: `public.festivals` smoke testing is deprecated; canonical master table is `public.events`.


## Promote a candidate into canonical events (dry-run first)

Default mode is dry-run (no writes):

```bash
NODE_USE_ENV_PROXY=1 node --env-file=.env scripts/promote_event_candidate.mjs --candidate-id <candidate_uuid>
# or
NODE_USE_ENV_PROXY=1 node --env-file=.env scripts/promote_event_candidate.mjs --candidate-name "Romeo Peach Festival"
```

Execute mode (writes enabled):

```bash
NODE_USE_ENV_PROXY=1 node --env-file=.env scripts/promote_event_candidate.mjs --candidate-id <candidate_uuid> --execute
```

Behavior:
- derives slug from `slug_candidate`, `normalized_name`, then `candidate_name`
- upserts into `public.events` by slug
- updates `event_candidates.matched_event_id` and marks `verification_status='promoted'` only in `--execute` mode
- attempts source lineage upsert to `public.event_sources` when that table is exposed; otherwise warns and continues


## Alias-resolution review + gated promotion (Michigan held set)

Use the scripted review-first alias step for the four held Michigan candidates:

```bash
NODE_USE_ENV_PROXY=1 node --env-file=.env scripts/review_and_promote_alias_candidates.mjs
```

Execute mode (writes + promotion):

```bash
NODE_USE_ENV_PROXY=1 node --env-file=.env scripts/review_and_promote_alias_candidates.mjs --execute
```

Behavior:
- validates required review tables are accessible before any write
- records alias/related-distinct adjudication to `event_candidates.semantic_notes`
- closes candidate duplicate-match rows in `event_candidate_matches` with reviewer attribution
- runs canonical promotion only after review-state write succeeds
- preserves existing workflow guardrail (no promotion without recorded review decision)

## Canonical event-level source lineage (`public.event_sources`)

`public.event_sources` is the canonical post-promotion lineage table for verified events in `public.events`.

- `event_candidate_sources` remains the pre-promotion/fallback provenance record.
- After promotion, lineage can be resolved by either:
  - direct `public.event_sources` rows for the canonical event, or
  - fallback join path: `events.id -> event_candidates.matched_event_id -> event_candidate_sources.candidate_id`.

Migration coverage:
- `supabase/migrations/202605150001_restore_event_sources_lineage.sql`
  - creates `public.event_sources` if missing
  - enforces unique `(event_id, source_url)` via `idx_event_sources_event_url_unique`
  - supports `upsert(..., { onConflict: 'event_id,source_url' })` in promotion scripts

Read-only readiness verification:

```bash
NODE_USE_ENV_PROXY=1 node --env-file=.env scripts/verify_event_sources_lineage_readiness.mjs
```

Expected outcomes:
- `event_sources_exists_via_rest: true`
- `event_sources_exposed_in_openapi: true`
- no dry-run warning that `event_sources` is unavailable

Optional SQL validation (read-only, if you have SQL console access):

```sql
select indexname, indexdef
from pg_indexes
where schemaname='public' and tablename='event_sources';
```
