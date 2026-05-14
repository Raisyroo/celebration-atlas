import fs from 'node:fs';
import path from 'node:path';

const listingPath = process.argv[2];
const outputPath = process.argv[3] ?? `data/discovery/snapshots/michigan-statewide-${new Date().toISOString().slice(0,10)}.json`;

if (!listingPath) {
  console.error('Usage: node scripts/generate-michigan-snapshot.mjs <listing-input.json> [output-snapshot.json]');
  process.exit(1);
}

const payload = JSON.parse(fs.readFileSync(listingPath, 'utf8'));
const now = new Date();
const runDate = now.toISOString().slice(0, 10);
const runId = `mi-statewide-${runDate.replace(/-/g, '')}`;

const eventCandidates = (payload.listings ?? []).map((listing, idx) => ({
  candidate_name: listing.event_name,
  normalized_name: String(listing.event_name || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim(),
  slug_candidate: String(listing.event_name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
  event_type: listing.event_type ?? 'festival',
  category: listing.category ?? 'community',
  city: listing.city ?? null,
  county: listing.county ?? null,
  state: 'Michigan',
  country: 'USA',
  venue_name: listing.venue_name ?? null,
  start_date: listing.start_date,
  end_date: listing.end_date ?? listing.start_date,
  description: listing.description ?? null,
  official_website_candidate: listing.official_website ?? listing.event_url ?? null,
  source_urls: [listing.source_url].filter(Boolean),
  discovery_confidence: Number(listing.discovery_confidence ?? 0.72),
  duplicate_status: 'needs_review',
  needs_review: true,
  semantic_notes: `statewide_seed_batch=${payload.batch_name ?? 'default'};rank=${idx + 1}`,
}));

const snapshot = {
  run_metadata: {
    run_id: runId,
    run_date: runDate,
    agent_name: 'Michigan Event Discovery Agent',
    state: 'Michigan',
    run_type: 'statewide_seed_discovery',
    notes: payload.notes ?? 'Generated from statewide discovery listing feed. Review-first import.',
  },
  discovered_sources: payload.discovered_sources ?? [],
  event_candidates: eventCandidates,
  supplier_discoveries: payload.supplier_discoveries ?? [],
  duplicate_signals: payload.duplicate_signals ?? [],
  raw_discoveries: payload.listings ?? [],
  data_health: {
    listing_count: (payload.listings ?? []).length,
    generated_at: now.toISOString(),
    source: path.basename(listingPath),
  },
};

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(snapshot, null, 2));
console.log(`Snapshot generated: ${outputPath}`);
console.log(`Candidates: ${eventCandidates.length}`);
