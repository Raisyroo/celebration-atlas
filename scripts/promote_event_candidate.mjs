import { createClient } from '@supabase/supabase-js';

const args = process.argv.slice(2);
const has = (flag) => args.includes(flag);
const valueOf = (flag) => {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : undefined;
};

const execute = has('--execute');
const candidateIdArg = valueOf('--candidate-id');
const candidateNameArg = valueOf('--candidate-name');

if (!candidateIdArg && !candidateNameArg) {
  console.error('Provide --candidate-id <uuid> or --candidate-name "name".');
  process.exit(1);
}

if (candidateIdArg && candidateNameArg) {
  console.error('Use either --candidate-id or --candidate-name, not both.');
  process.exit(1);
}

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

function slugify(input) {
  return String(input ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}

function deriveSlug(candidate) {
  const fromCandidate = candidate.slug_candidate?.trim();
  if (fromCandidate) return slugify(fromCandidate);
  const fromNormalized = candidate.normalized_name?.trim();
  if (fromNormalized) return slugify(fromNormalized);
  return slugify(candidate.candidate_name);
}

function mapCandidateToEvent(candidate, slug) {
  return {
    slug,
    name: candidate.normalized_name || candidate.candidate_name,
    event_type: candidate.event_type || 'other',
    category: candidate.category || null,
    subcategory: candidate.subcategory || null,
    city: candidate.city || null,
    county: candidate.county || null,
    state: candidate.state || 'Michigan',
    country: candidate.country || 'USA',
    venue_name: candidate.venue_name || null,
    official_website: candidate.official_website_candidate || null,
    typical_month: candidate.typical_month || null,
    typical_season: candidate.typical_season || null,
    short_description: candidate.description || null,
    verification_status: 'verified',
    confidence_score: candidate.discovery_confidence ?? null
  };
}

async function resolveCandidate() {
  if (candidateIdArg) {
    const { data, error } = await supabase
      .from('event_candidates')
      .select('*')
      .eq('id', candidateIdArg)
      .limit(1);
    if (error) throw error;
    if (!data?.length) {
      console.error(`No candidate found for id: ${candidateIdArg}`);
      process.exit(1);
    }
    return data[0];
  }

  const { data, error } = await supabase
    .from('event_candidates')
    .select('*')
    .eq('candidate_name', candidateNameArg);
  if (error) throw error;
  if (!data?.length) {
    console.error(`No candidate found for name: ${candidateNameArg}`);
    process.exit(1);
  }
  if (data.length > 1) {
    console.error(`Multiple candidates found for name "${candidateNameArg}". Use --candidate-id.`);
    for (const c of data) console.error(`- ${c.id} | ${c.candidate_name}`);
    process.exit(1);
  }
  return data[0];
}

async function tableExists(tableName) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/`, {
    headers: { apikey: SUPABASE_SERVICE_ROLE_KEY }
  });
  if (!res.ok) return false;
  const openApi = await res.json();
  return Boolean(openApi?.paths?.[`/${tableName}`]);
}

try {
  const candidate = await resolveCandidate();
  const slug = deriveSlug(candidate);
  if (!slug) {
    console.error('Failed to derive slug from candidate.');
    process.exit(1);
  }

  const eventPayload = mapCandidateToEvent(candidate, slug);
  const { data: candidateSources, error: sourceErr } = await supabase
    .from('event_candidate_sources')
    .select('source_name,source_url,source_type,trust_score,last_accessed')
    .eq('candidate_id', candidate.id);
  if (sourceErr) throw sourceErr;

  const hasEventSources = await tableExists('event_sources');

  console.log('Mode:', execute ? 'EXECUTE' : 'DRY-RUN (default)');
  console.log('Candidate:', { id: candidate.id, candidate_name: candidate.candidate_name });
  console.log('Derived slug:', slug);
  console.log('Event upsert payload:', eventPayload);
  console.log('Candidate source rows:', candidateSources?.length ?? 0);
  if (!hasEventSources) {
    console.warn('WARN: public.event_sources is not exposed; lineage writes will be skipped.');
  }

  if (!execute) {
    console.log('Dry-run only. No writes performed. Use --execute to apply promotion.');
    process.exit(0);
  }

  const { data: upsertedEvents, error: upsertErr } = await supabase
    .from('events')
    .upsert([eventPayload], { onConflict: 'slug' })
    .select('id,slug,name');

  if (upsertErr) throw upsertErr;
  const eventRow = upsertedEvents?.[0];
  if (!eventRow?.id) {
    console.error('Upsert completed but no event id returned.');
    process.exit(1);
  }

  if (hasEventSources && candidateSources?.length) {
    const lineageRows = candidateSources.map((s) => ({
      event_id: eventRow.id,
      source_name: s.source_name,
      source_url: s.source_url,
      source_type: s.source_type,
      trust_score: s.trust_score,
      last_accessed: s.last_accessed ?? null,
      source_notes: `Promoted from event_candidate ${candidate.id}`
    }));

    const { error: lineageErr } = await supabase
      .from('event_sources')
      .upsert(lineageRows, { onConflict: 'event_id,source_url' });

    if (lineageErr) {
      console.warn('WARN: event_sources lineage upsert failed. Candidate promotion still succeeded.');
      console.warn(lineageErr.message);
    }
  }

  const { error: candidateUpdateErr } = await supabase
    .from('event_candidates')
    .update({ matched_event_id: eventRow.id, verification_status: 'promoted' })
    .eq('id', candidate.id);

  if (candidateUpdateErr) throw candidateUpdateErr;

  console.log('Promotion complete:', {
    candidate_id: candidate.id,
    event_id: eventRow.id,
    slug: eventRow.slug
  });
} catch (err) {
  console.error('Promotion failed.');
  console.error(err?.message || err);
  process.exit(1);
}
