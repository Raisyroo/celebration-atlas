import { createClient } from '@supabase/supabase-js';
import { spawnSync } from 'node:child_process';

const decisions = [
  {
    candidateId: '9999f667-fd6f-45de-b881-5459138c3d32',
    decision: 'same_event_alias',
    alias: 'Tulip Time',
    promote: true,
    note: null
  },
  {
    candidateId: '158fa589-85f3-48c1-8a6e-79cd6a7c9af3',
    decision: 'same_event_alias',
    alias: 'Traverse City Cherry Festival',
    promote: true,
    note: null
  },
  {
    candidateId: '48a5ddb0-dde9-4155-98e6-f90508c56548',
    decision: 'same_event_alias',
    alias: 'Lilac Festival Mackinac Island',
    promote: true,
    note: null
  },
  {
    candidateId: '76dc9cd8-b8a4-408d-bd03-7f64cc96a9fd',
    decision: 'related_but_distinct',
    alias: null,
    promote: true,
    note: 'Michigan State Fair LLC is organizer/legal entity naming, not consumer-facing event alias. Promote canonical event name only.'
  }
];

const execute = process.argv.includes('--execute');
const reviewer = process.env.REVIEWED_BY || 'codex-alias-review';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

function appendSemanticNote(existing, addition) {
  const base = (existing || '').trim();
  if (!base) return addition;
  if (base.includes(addition)) return base;
  return `${base}\n${addition}`;
}

async function checkSchema() {
  const { data: candidatesCols, error: cErr } = await supabase.from('event_candidates').select('id,semantic_notes,verification_status,needs_review').limit(1);
  if (cErr) throw new Error(`Missing/invalid public.event_candidates access: ${cErr.message}`);
  const { data: matchesCols, error: mErr } = await supabase.from('event_candidate_matches').select('id,candidate_id,status,recommended_action,reviewed_by,possible_event_id').limit(1);
  if (mErr) throw new Error(`Missing/invalid public.event_candidate_matches access: ${mErr.message}`);
  void candidatesCols;
  void matchesCols;
}

async function applyDecision(d) {
  const { data: candidate, error: cErr } = await supabase.from('event_candidates').select('*').eq('id', d.candidateId).maybeSingle();
  if (cErr) throw cErr;
  if (!candidate) throw new Error(`Candidate not found: ${d.candidateId}`);

  const { data: matches, error: mErr } = await supabase
    .from('event_candidate_matches')
    .select('id,status,recommended_action,match_reason')
    .eq('candidate_id', d.candidateId)
    .order('created_at', { ascending: true });
  if (mErr) throw mErr;

  const reviewTrail = d.decision === 'same_event_alias'
    ? `Alias review: ${d.decision}; alias="${d.alias}"; reviewer=${reviewer}`
    : `Alias review: ${d.decision}; related_name="Michigan State Fair LLC"; reviewer=${reviewer}; note=${d.note}`;

  const candidatePatch = {
    semantic_notes: appendSemanticNote(candidate.semantic_notes, reviewTrail),
    needs_review: false,
    duplicate_status: d.decision === 'same_event_alias' ? 'possible_duplicate' : 'needs_review'
  };

  if (!execute) {
    return { candidate, matches: matches || [], candidatePatch, reviewTrail };
  }

  const { error: updateCandidateErr } = await supabase.from('event_candidates').update(candidatePatch).eq('id', d.candidateId);
  if (updateCandidateErr) throw updateCandidateErr;

  if (matches?.length) {
    const { error: closeErr } = await supabase
      .from('event_candidate_matches')
      .update({
        status: d.decision === 'same_event_alias' ? 'reviewed_same_event_alias' : 'reviewed_related_distinct',
        recommended_action: d.decision === 'same_event_alias' ? 'merge_after_review' : 'review',
        reviewed_by: reviewer
      })
      .eq('candidate_id', d.candidateId);
    if (closeErr) throw closeErr;
  }

  if (d.promote) {
    const r = spawnSync('node', ['--env-file=.env', 'scripts/promote_event_candidate.mjs', '--candidate-id', d.candidateId, '--execute'], {
      stdio: 'inherit',
      env: process.env
    });
    if (r.status !== 0) throw new Error(`Promotion failed for candidate ${d.candidateId}`);
  }

  return { candidate, matches: matches || [], candidatePatch, reviewTrail };
}

(async function main() {
  try {
    await checkSchema();
    console.log(`Mode: ${execute ? 'EXECUTE' : 'DRY-RUN'}`);
    for (const d of decisions) {
      const result = await applyDecision(d);
      console.log(JSON.stringify({ candidateId: d.candidateId, decision: d.decision, patch: result.candidatePatch, matches: result.matches.length }, null, 2));
    }
    console.log('Alias-resolution review step complete.');
  } catch (err) {
    console.error(err.message || err);
    process.exit(1);
  }
})();
