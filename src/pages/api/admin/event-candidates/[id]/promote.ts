import type { NextApiRequest, NextApiResponse } from 'next';
import { hasValidAdminAccess } from '@/lib/adminAuth';
import { getSupabaseAdminClient } from '@/lib/supabaseAdmin';

function slugify(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}

function deriveSlug(candidate: any) {
  const a = candidate.slug_candidate?.trim();
  if (a) return slugify(a);
  const b = candidate.normalized_name?.trim();
  if (b) return slugify(b);
  return slugify(candidate.candidate_name || '');
}

function mapCandidateToEvent(candidate: any, slug: string) {
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

async function tableExposed(url: string, key: string, tableName: string) {
  const res = await fetch(`${url}/rest/v1/`, { headers: { apikey: key } });
  if (!res.ok) return false;
  const openApi = await res.json();
  return Boolean(openApi?.paths?.[`/${tableName}`]);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!hasValidAdminAccess(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const id = req.query.id;
  if (typeof id !== 'string' || !id) {
    return res.status(400).json({ error: 'Invalid candidate id' });
  }

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return res.status(500).json({ error: 'Missing Supabase environment variables.' });
  }

  try {
    const supabase = getSupabaseAdminClient();

    const { data: candidate, error: candidateErr } = await supabase
      .from('event_candidates')
      .select('*')
      .eq('id', id)
      .single();

    if (candidateErr || !candidate) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    const slug = deriveSlug(candidate);
    if (!slug) {
      return res.status(400).json({ error: 'Unable to derive slug from candidate.' });
    }

    const eventPayload = mapCandidateToEvent(candidate, slug);

    const { data: upsertedEvents, error: upsertErr } = await supabase
      .from('events')
      .upsert([eventPayload], { onConflict: 'slug' })
      .select('id,slug,name')
      .limit(1);

    if (upsertErr) {
      return res.status(500).json({ error: upsertErr.message });
    }

    const eventRow = upsertedEvents?.[0];
    if (!eventRow?.id) {
      return res.status(500).json({ error: 'Event upsert succeeded but returned no id.' });
    }

    const { data: candidateSources } = await supabase
      .from('event_candidate_sources')
      .select('source_name,source_url,source_type,trust_score,last_accessed')
      .eq('candidate_id', id);

    let lineageSkipped = false;
    let lineageWarning: string | null = null;

    const hasEventSources = await tableExposed(url, key, 'event_sources');
    if (hasEventSources && (candidateSources?.length ?? 0) > 0) {
      const rows = (candidateSources ?? []).map((s) => ({
        event_id: eventRow.id,
        source_name: s.source_name,
        source_url: s.source_url,
        source_type: s.source_type,
        trust_score: s.trust_score,
        last_accessed: s.last_accessed ?? null,
        source_notes: `Promoted from event_candidate ${id}`
      }));
      const { error: lineageErr } = await supabase
        .from('event_sources')
        .upsert(rows, { onConflict: 'event_id,source_url' });

      if (lineageErr) {
        lineageSkipped = true;
        lineageWarning = `event_sources upsert skipped: ${lineageErr.message}`;
      }
    } else {
      lineageSkipped = true;
      lineageWarning = 'event_sources not exposed; lineage skipped';
    }

    const { data: updatedCandidate, error: updateErr } = await supabase
      .from('event_candidates')
      .update({ matched_event_id: eventRow.id, verification_status: 'promoted', needs_review: false })
      .eq('id', id)
      .select('*')
      .single();

    if (updateErr) {
      return res.status(500).json({ error: updateErr.message });
    }

    return res.status(200).json({
      promoted_event: eventRow,
      candidate: updatedCandidate,
      slug,
      lineage_skipped: lineageSkipped,
      lineage_warning: lineageWarning
    });
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
}
