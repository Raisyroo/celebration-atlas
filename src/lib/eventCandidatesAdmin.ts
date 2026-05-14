import { getSupabaseAdminClient } from './supabaseAdmin';

export interface CandidateQueueFilters {
  limit?: number;
  state?: string;
  county?: string;
  duplicate_status?: string;
  verification_status?: string;
  needs_review?: boolean;
  min_confidence?: number;
  created_after?: string;
}

export async function fetchEventCandidatesQueue(filters: CandidateQueueFilters = {}) {
  const supabase = getSupabaseAdminClient();
  const limit = filters.limit ?? 200;

  let query = supabase
    .from('event_candidates')
    .select('id,candidate_name,event_type,city,county,state,discovery_confidence,verification_status,duplicate_status,needs_review,created_at')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (filters.state) query = query.eq('state', filters.state);
  if (filters.county) query = query.eq('county', filters.county);
  if (filters.duplicate_status) query = query.eq('duplicate_status', filters.duplicate_status);
  if (filters.verification_status) query = query.eq('verification_status', filters.verification_status);
  if (typeof filters.needs_review === 'boolean') query = query.eq('needs_review', filters.needs_review);
  if (typeof filters.min_confidence === 'number') query = query.gte('discovery_confidence', filters.min_confidence);
  if (filters.created_after) query = query.gte('created_at', filters.created_after);

  return query;
}

export async function fetchEventCandidateDetail(id: string) {
  const supabase = getSupabaseAdminClient();
  const [{ data: candidate, error: candidateErr }, { data: sources, error: sourcesErr }, { data: matches, error: matchesErr }] = await Promise.all([
    supabase.from('event_candidates').select('*').eq('id', id).single(),
    supabase.from('event_candidate_sources').select('source_name,source_url,source_type,trust_score,last_accessed').eq('candidate_id', id),
    supabase.from('event_candidate_matches').select('match_score,match_reason,recommended_action,status,possible_event_id,possible_candidate_id').eq('candidate_id', id)
  ]);

  return {
    candidate,
    sources: sources ?? [],
    matches: matches ?? [],
    error: candidateErr || sourcesErr || matchesErr || null
  };
}
