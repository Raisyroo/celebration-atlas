import { getSupabaseAdminClient } from './supabaseAdmin';

export async function fetchEventCandidatesQueue(limit = 200) {
  const supabase = getSupabaseAdminClient();
  return supabase
    .from('event_candidates')
    .select('id,candidate_name,event_type,city,county,state,discovery_confidence,verification_status,duplicate_status,needs_review,created_at')
    .order('created_at', { ascending: false })
    .limit(limit);
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
