import { GetServerSideProps } from 'next';
import Link from 'next/link';
import { useState } from 'react';
import { fetchEventCandidateDetail } from '@/lib/eventCandidatesAdmin';
import { requireAdminPageAuth } from '@/lib/adminAuth';

type Candidate = Record<string, unknown> & { id: string; candidate_name: string; matched_event_id?: string | null; raw_payload?: unknown; verification_status?: string; needs_review?: boolean };
type CandidateSource = { source_name: string | null; source_url: string; source_type: string | null; trust_score: number | null; last_accessed: string | null };
type CandidateMatch = { match_score: number; match_reason: string; recommended_action: string; status: string; possible_event_id: string | null; possible_candidate_id: string | null };

type Props = { candidate: Candidate | null; sources: CandidateSource[]; matches: CandidateMatch[]; error?: string };

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const id = ctx.params?.id;
  if (typeof id !== 'string') return { props: { candidate: null, sources: [], matches: [], error: 'Invalid candidate id.' } };

  try {
    const { candidate, sources, matches, error } = await fetchEventCandidateDetail(id);
    if (error) return { props: { candidate: null, sources: [], matches: [], error: error.message } };
    return { props: { candidate: (candidate ?? null) as Candidate | null, sources: (sources ?? []) as CandidateSource[], matches: (matches ?? []) as CandidateMatch[] } };
  } catch (err) {
    return { props: { candidate: null, sources: [], matches: [], error: err instanceof Error ? err.message : 'Unknown error' } };
  }
};

export default function CandidateDetailPage({ candidate, sources, matches, error }: Props) {
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function runAction(action: 'reject' | 'needs_review' | 'promote') {
    if (!candidate) return;
    setBusy(true);
    setActionError(null);
    setActionMessage(null);
    try {
      const res = await fetch(action === 'promote' ? `/api/admin/event-candidates/${candidate.id}/promote` : `/api/admin/event-candidates/${candidate.id}/review-action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      const body = await res.json();
      if (!res.ok) {
        setActionError(body?.error ?? 'Action failed');
      } else {
        setActionMessage(action === 'promote' ? 'Promotion completed.' : `Soft state change applied: ${action}`);
      }
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={{ maxWidth: 1000, margin: '0 auto', padding: 24, fontFamily: 'system-ui, sans-serif' }}>
      <p><Link href="/admin">← Admin Home</Link></p>
      <p><Link href="/admin/event-candidates">← Back to queue</Link></p>
      <h1>Event Candidate Detail</h1>
      {error ? <p>Load error: {error}</p> : null}
      {!candidate ? <p>Candidate not found.</p> : null}
      {candidate ? (
        <>
          <h2>{candidate.candidate_name}</h2>
          <p><strong>Matched event id:</strong> {candidate.matched_event_id ?? 'None'}</p>
          <p><strong>Verification status:</strong> {candidate.verification_status ?? '—'}</p>
          <p><strong>Needs review:</strong> {String(candidate.needs_review ?? false)}</p>

          <h3>Review actions (soft state changes only)</h3>
          <p>Soft actions update candidate status fields only. Promotion writes to canonical events. No deletes.</p>
          <button onClick={() => runAction('reject')} disabled={busy}>Reject candidate (soft)</button>{' '}
          <button onClick={() => runAction('needs_review')} disabled={busy}>Mark needs_review (soft)</button>{' '}
          <button onClick={() => runAction('promote')} disabled={busy}>Promote to Event (writes canonical event)</button>
          {actionMessage ? <p>{actionMessage}</p> : null}
          {actionError ? <p>Action error: {actionError}</p> : null}

          <h3>Candidate fields</h3><pre>{JSON.stringify(candidate, null, 2)}</pre>
          <h3>Raw payload</h3><pre>{JSON.stringify(candidate.raw_payload ?? null, null, 2)}</pre>
          <h3>Source lineage (event_candidate_sources)</h3>
          {sources.length === 0 ? <p>No source rows.</p> : <ul>{sources.map((source) => <li key={source.source_url}>{source.source_name ?? 'Unnamed source'} — {source.source_url} ({source.source_type ?? 'unknown'})</li>)}</ul>}
          <h3>Duplicate / possible matches (event_candidate_matches)</h3>
          {matches.length === 0 ? <p>No match rows.</p> : <ul>{matches.map((match, idx) => <li key={idx}>score={match.match_score}, status={match.status}, action={match.recommended_action}, reason={match.match_reason}</li>)}</ul>}
        </>
      ) : null}
    </main>
  );
}
