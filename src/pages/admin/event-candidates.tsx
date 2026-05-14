import Link from 'next/link';
import { GetServerSideProps, GetServerSidePropsResult } from 'next';
import { withAdminPageAuth } from '@/lib/adminAuth';
import { fetchEventCandidatesQueue } from '@/lib/eventCandidatesAdmin';

type CandidateRow = {
  id: string;
  candidate_name: string;
  event_type: string | null;
  city: string | null;
  county: string | null;
  state: string | null;
  discovery_confidence: number | null;
  verification_status: string | null;
  duplicate_status: string | null;
  needs_review: boolean | null;
  created_at: string;
};

type Props = {
  candidates: CandidateRow[];
  error?: string;
  filters: Record<string, string>;
};

export const getServerSideProps: GetServerSideProps<Props> = withAdminPageAuth(async (ctx): Promise<GetServerSidePropsResult<Props>> => {
  try {
    const query = ctx.query;
    const needsReview = query.needs_review === 'true' ? true : query.needs_review === 'false' ? false : undefined;
    const minConfidence = typeof query.min_confidence === 'string' ? Number(query.min_confidence) : undefined;

    const { data, error } = await fetchEventCandidatesQueue({
      state: typeof query.state === 'string' ? query.state : 'Michigan',
      county: typeof query.county === 'string' ? query.county : undefined,
      duplicate_status: typeof query.duplicate_status === 'string' ? query.duplicate_status : undefined,
      verification_status: typeof query.verification_status === 'string' ? query.verification_status : undefined,
      created_after: typeof query.created_after === 'string' ? query.created_after : undefined,
      needs_review: needsReview ?? true,
      min_confidence: Number.isFinite(minConfidence) ? minConfidence : undefined,
    });

    if (error) return { props: { candidates: [], error: error.message, filters: {} } };
    return { props: { candidates: (data ?? []) as CandidateRow[], filters: Object.fromEntries(Object.entries(query).map(([k, v]) => [k, String(v)])) } };
  } catch (err) {
    return { props: { candidates: [], error: err instanceof Error ? err.message : 'Unknown error', filters: {} } };
  }
});

export default function EventCandidatesQueuePage({ candidates, error, filters }: Props) {
  return (
    <main style={{ maxWidth: 1100, margin: '0 auto', padding: 24, fontFamily: 'system-ui, sans-serif' }}>
      <p><Link href="/admin">← Admin Home</Link></p>
      <h1>Event Candidates Review Queue</h1>
      <p>Statewide triage defaults to Michigan + needs review only. Use querystring filters for high-volume review.</p>
      <code>/admin/event-candidates?state=Michigan&needs_review=true&min_confidence=0.7&duplicate_status=possible_duplicate</code>
      <p>Active filters: {JSON.stringify(filters)}</p>
      {error ? <p>Load error: {error}</p> : null}
      {!error && candidates.length === 0 ? <p>No candidates found.</p> : null}
      {candidates.length > 0 ? (
        <table cellPadding={8} style={{ borderCollapse: 'collapse', width: '100%', background: '#fff' }}>
          <thead>
            <tr><th>Name</th><th>Type</th><th>City</th><th>County</th><th>State</th><th>Confidence</th><th>Verification</th><th>Duplicate</th><th>Needs Review</th><th>Created</th></tr>
          </thead>
          <tbody>
            {candidates.map((candidate) => (
              <tr key={candidate.id}>
                <td><Link href={`/admin/event-candidates/${candidate.id}`}>{candidate.candidate_name}</Link></td>
                <td>{candidate.event_type ?? '—'}</td><td>{candidate.city ?? '—'}</td><td>{candidate.county ?? '—'}</td><td>{candidate.state ?? '—'}</td>
                <td>{candidate.discovery_confidence ?? '—'}</td><td>{candidate.verification_status ?? '—'}</td><td>{candidate.duplicate_status ?? '—'}</td><td>{String(candidate.needs_review ?? false)}</td><td>{candidate.created_at}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
    </main>
  );
}
