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
