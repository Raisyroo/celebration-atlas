import Link from 'next/link';
import { GetServerSideProps } from 'next';
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

type Props = { candidates: CandidateRow[]; error?: string };

export const getServerSideProps: GetServerSideProps<Props> = async () => {
  try {
    const { data, error } = await fetchEventCandidatesQueue();
    if (error) return { props: { candidates: [], error: error.message } };
    return { props: { candidates: (data ?? []) as CandidateRow[] } };
  } catch (err) {
    return { props: { candidates: [], error: err instanceof Error ? err.message : 'Unknown error' } };
  }
};

export default function EventCandidatesQueuePage({ candidates, error }: Props) {
  return (
    <main style={{ maxWidth: 1100, margin: '0 auto', padding: 24, fontFamily: 'system-ui, sans-serif' }}>
      <p><Link href="/admin">← Admin Home</Link></p>
      <h1>Event Candidates Review Queue</h1>
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
