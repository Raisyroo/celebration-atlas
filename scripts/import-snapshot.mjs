import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const snapshotPath = process.argv[2];
if (!snapshotPath) {
  console.error('Usage: node scripts/import-snapshot.mjs <snapshot.json>');
  process.exit(1);
}

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('ERROR: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.');
  process.exit(1);
}

function log(stage, msg) {
  console.log(`[${stage}] ${msg}`);
}

async function sb(path, { method = 'GET', body, query = '' } = {}) {
  const url = `${SUPABASE_URL}/rest/v1/${path}${query}`;
  const res = await fetch(url, {
    method,
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: method === 'POST' ? 'return=representation' : 'return=minimal',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${method} ${path} failed (${res.status}): ${text}`);
  }

  if (method === 'GET' || method === 'POST') {
    const text = await res.text();
    return text ? JSON.parse(text) : [];
  }
  return null;
}

const summary = {
  sourcesInserted: 0,
  candidatesInserted: 0,
  candidateSourcesInserted: 0,
  suppliersInserted: 0,
  matchesInserted: 0,
  errorsLogged: 0,
  warnings: 0,
  errors: 0,
};

let runId = null;

async function logImportError(stage, recordType, payload, errorMessage) {
  summary.errors += 1;
  console.error(`[ERROR] ${stage}/${recordType}: ${errorMessage}`);
  if (!runId) return;

  try {
    await sb('snapshot_import_errors', {
      method: 'POST',
      body: [{ discovery_run_id: runId, stage, record_type: recordType, payload, error_message: errorMessage }],
    });
    summary.errorsLogged += 1;
  } catch (err) {
    console.error(`[ERROR] snapshot_import_errors logging failed: ${err.message}`);
  }
}

function loadSnapshot(path) {
  const raw = fs.readFileSync(path, 'utf8');
  return JSON.parse(raw);
}

try {
  log('validate', `Running validator for ${snapshotPath}`);
  execFileSync('node', ['scripts/validate-snapshot.mjs', snapshotPath], { stdio: 'inherit' });
} catch {
  console.error('ERROR: Snapshot validation failed. Import aborted.');
  process.exit(1);
}

const snapshot = loadSnapshot(snapshotPath);

const sourceMap = new Map();
const candidateMap = new Map();

try {
  const runRows = await sb('discovery_runs', {
    method: 'POST',
    body: [{
      run_type: snapshot.run_metadata.run_type,
      status: 'completed',
      started_at: new Date(`${snapshot.run_metadata.run_date}T00:00:00Z`).toISOString(),
      completed_at: new Date().toISOString(),
      notes: snapshot.run_metadata.notes ?? null,
      run_metadata: snapshot.run_metadata,
      items_found: (snapshot.event_candidates ?? []).length,
      candidates_created: (snapshot.event_candidates ?? []).length,
      duplicates_flagged: (snapshot.duplicate_signals ?? []).length,
    }],
  });
  runId = runRows[0].id;
  log('run', `Created discovery_run ${runId}`);
} catch (err) {
  console.error(`ERROR: Unable to create discovery_run: ${err.message}`);
  process.exit(1);
}

for (const src of snapshot.discovered_sources ?? []) {
  try {
    const insertRows = await sb('discovery_sources', {
      method: 'POST',
      body: [{
        name: src.source_name,
        source_url: src.source_url,
        source_type: src.source_type,
        region: src.region ?? null,
        state: snapshot.run_metadata.state,
        priority: src.priority ?? 'medium',
        trust_score: src.trust_score,
        notes: src.notes ?? null,
      }],
    });
    const row = insertRows[0];
    sourceMap.set(src.source_url, row.id);
    summary.sourcesInserted += 1;
  } catch (err) {
    summary.warnings += 1;
    console.warn(`[WARN] source insert failed (likely duplicate URL), trying lookup: ${src.source_url}`);
    try {
      const rows = await sb('discovery_sources', { query: `?source_url=eq.${encodeURIComponent(src.source_url)}&select=id,source_url` });
      if (rows[0]) sourceMap.set(src.source_url, rows[0].id);
      else await logImportError('discovered_sources', 'discovery_source', src, err.message);
    } catch (lookupErr) {
      await logImportError('discovered_sources', 'discovery_source', src, lookupErr.message);
    }
  }
}

for (const c of snapshot.event_candidates ?? []) {
  try {
    const rows = await sb('event_candidates', {
      method: 'POST',
      body: [{
        discovery_run_id: runId,
        candidate_name: c.candidate_name,
        normalized_name: c.normalized_name ?? null,
        slug_candidate: c.slug_candidate ?? null,
        event_type: c.event_type,
        category: c.category ?? null,
        subcategory: c.subcategory ?? null,
        city: c.city ?? null,
        county: c.county ?? null,
        state: c.state ?? snapshot.run_metadata.state,
        country: c.country ?? 'USA',
        venue_name: c.venue_name ?? null,
        start_date: c.start_date,
        end_date: c.end_date,
        typical_month: c.typical_month ?? null,
        typical_season: c.typical_season ?? null,
        description: c.description ?? null,
        official_website_candidate: c.official_website_candidate ?? null,
        social_links: c.social_links ?? [],
        source_urls: c.source_urls ?? [],
        discovery_confidence: c.discovery_confidence,
        duplicate_status: c.duplicate_status,
        needs_review: c.needs_review ?? true,
        semantic_notes: c.semantic_notes ?? null,
        raw_payload: c,
      }],
    });
    const candidateId = rows[0].id;
    candidateMap.set(c.candidate_name, candidateId);
    summary.candidatesInserted += 1;

    for (const sourceUrl of c.source_urls ?? []) {
      try {
        await sb('event_candidate_sources', {
          method: 'POST',
          body: [{
            candidate_id: candidateId,
            source_name: snapshot.discovered_sources.find((s) => s.source_url === sourceUrl)?.source_name ?? null,
            source_url: sourceUrl,
            source_type: c.source_type ?? null,
            trust_score: snapshot.discovered_sources.find((s) => s.source_url === sourceUrl)?.trust_score ?? null,
            created_at: new Date().toISOString(),
          }],
        });
        summary.candidateSourcesInserted += 1;
      } catch (err) {
        await logImportError('event_candidate_sources', 'candidate_source', { candidate: c.candidate_name, sourceUrl }, err.message);
      }
    }
  } catch (err) {
    await logImportError('event_candidates', 'event_candidate', c, err.message);
  }
}

for (const s of snapshot.supplier_discoveries ?? []) {
  try {
    await sb('supplier_discoveries', {
      method: 'POST',
      body: [{
        discovery_run_id: runId,
        supplier_name: s.supplier_name,
        supplier_type: s.supplier_type ?? null,
        website: s.website ?? null,
        source_url: s.source_url ?? null,
        events_found: s.events_found ?? [],
        relationship_types: s.relationship_types ?? [],
        confidence: s.confidence ?? null,
        notes: s.notes ?? null,
      }],
    });
    summary.suppliersInserted += 1;
  } catch (err) {
    await logImportError('supplier_discoveries', 'supplier_discovery', s, err.message);
  }
}

for (const d of snapshot.duplicate_signals ?? []) {
  try {
    const candidateId = candidateMap.get(d.candidate_name);
    if (!candidateId) {
      summary.warnings += 1;
      console.warn(`[WARN] duplicate signal candidate not found: ${d.candidate_name}`);
      continue;
    }
    const possibleCandidateId = candidateMap.get(d.possible_match_name) ?? null;
    await sb('event_candidate_matches', {
      method: 'POST',
      body: [{
        candidate_id: candidateId,
        possible_candidate_id: possibleCandidateId,
        match_score: d.match_score,
        match_reason: d.match_reason,
        recommended_action: d.recommended_action ?? 'review',
        status: 'pending_review',
      }],
    });
    summary.matchesInserted += 1;
  } catch (err) {
    await logImportError('duplicate_signals', 'candidate_match', d, err.message);
  }
}

log('summary', `sources_inserted=${summary.sourcesInserted}`);
log('summary', `candidates_inserted=${summary.candidatesInserted}`);
log('summary', `candidate_sources_inserted=${summary.candidateSourcesInserted}`);
log('summary', `suppliers_inserted=${summary.suppliersInserted}`);
log('summary', `matches_inserted=${summary.matchesInserted}`);
log('summary', `warnings=${summary.warnings}`);
log('summary', `errors=${summary.errors}`);
log('summary', `errors_logged=${summary.errorsLogged}`);
if (summary.errors > 0) {
  console.log('Final result: IMPORT_COMPLETED_WITH_ERRORS');
  process.exit(1);
}
console.log('Final result: IMPORT_SUCCESS');
