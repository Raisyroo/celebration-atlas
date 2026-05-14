# Michigan Statewide Event Discovery Workflow (Review-First)

## Recommended Workflow
1. **Seed-source discovery:** Load reusable statewide source definitions (`src/lib/discoverySourceSeeds.ts`) and persist discovered source candidates into `discovery_sources`.
2. **Structured listing harvest:** Capture listing rows from county fairs, tourism boards, chamber calendars, festival directories, city event pages, and state fair associations into a listing input JSON.
3. **Snapshot generation:** Convert listings into canonical snapshot schema with `scripts/generate-michigan-snapshot.mjs`.
4. **Snapshot validation:** Run `scripts/validate-snapshot.mjs` prior to import.
5. **Review-first import:** Run `scripts/import-snapshot.mjs`; imported records default to `needs_review=true` and duplicate status requiring human adjudication.
6. **High-volume triage:** Use admin queue filtering (`/admin/event-candidates`) with Michigan statewide defaults and confidence/duplicate filters.
7. **Manual promotion only:** Continue promotion via explicit admin actions; no autonomous promotion path added.

## Required Additions
- Reusable source definitions for statewide seed expansion.
- Snapshot generator from raw listing feeds.
- API/admin queue filtering for statewide volume triage.
- Operational runbook for daily/weekly crawl batches.

## Scaling Risks
- Source overlap causes candidate duplication spikes.
- Dynamic calendars may require scraper-specific render support.
- Uneven source quality can flood low-confidence rows.
- Seasonal spikes (summer/fall festivals) may overwhelm manual review capacity.

## Next Operational Steps
1. Stand up one listing collector per source category with shared output contract.
2. Run weekly statewide batches and daily delta batches for top-priority sources.
3. Add queue-SLA metrics (age in queue, duplicates pending, county coverage).
4. Expand seed definitions to all Michigan counties and top municipalities.
