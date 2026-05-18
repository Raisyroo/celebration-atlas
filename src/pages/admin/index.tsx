import Link from 'next/link';
import { GetServerSideProps, GetServerSidePropsResult } from 'next';
import { withAdminPageAuth } from '@/lib/adminAuth';
import { createClient } from '@supabase/supabase-js';

type Stats = {
  needsReview: number;
  promoted: number;
  rejected: number;
  canonicalEvents: number;
};

type Props = {
  stats: Stats;
  error?: string;
};

const cards = [
  { href: '/admin/event-candidates', label: 'Event Candidates', description: 'Review, reject, and promote candidate events.' },
  { href: '/admin/verified-events', label: 'Verified Events', description: 'Browse canonical promoted event records.' },
  { href: '/admin/map-readiness', label: 'Map Readiness Queue', description: 'Review and update canonical event location fields for map prep.' },
  { href: '/admin/discovery-runs', label: 'Discovery Runs', description: 'Track discovery execution history and status.' },
  { href: '/admin/discovery-sources', label: 'Discovery Sources', description: 'Manage trusted discovery sources.' },
  { href: '/admin/snapshot-imports', label: 'Snapshot Imports', description: 'Review import workflow and ingestion outcomes.' },
  { href: '/admin/batch-intake', label: 'Batch Intake', description: 'Generate review-ready snapshot drafts from a pasted event list.' },
  { href: '/admin/batch-enrichment', label: 'Batch Enrichment', description: 'Enrich pasted intake snapshot candidates and generate validated preview JSON.' },
  { href: '/admin/batch-import-preview', label: 'Batch Import Preview', description: 'Preview import counts, validation output, and candidate summaries before any write.' }
];

export const getServerSideProps: GetServerSideProps<Props> = withAdminPageAuth(async (): Promise<GetServerSidePropsResult<Props>> => {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const defaultStats: Stats = { needsReview: 0, promoted: 0, rejected: 0, canonicalEvents: 0 };

  if (!url || !key) return { props: { stats: defaultStats, error: 'Missing Supabase environment variables.' } };

  const supabase = createClient(url, key);

  const [needsReview, promoted, rejected, eventsCount] = await Promise.all([
    supabase.from('event_candidates').select('*', { count: 'exact', head: true }).eq('verification_status', 'needs_review'),
    supabase.from('event_candidates').select('*', { count: 'exact', head: true }).eq('verification_status', 'promoted'),
    supabase.from('event_candidates').select('*', { count: 'exact', head: true }).eq('verification_status', 'rejected'),
    supabase.from('events').select('*', { count: 'exact', head: true })
  ]);

  const firstError = needsReview.error || promoted.error || rejected.error || eventsCount.error;
  if (firstError) return { props: { stats: defaultStats, error: firstError.message } };

  return {
    props: {
      stats: {
        needsReview: needsReview.count ?? 0,
        promoted: promoted.count ?? 0,
        rejected: rejected.count ?? 0,
        canonicalEvents: eventsCount.count ?? 0
      }
    }
  };
});

export default function AdminIndexPage({ stats, error }: Props) {
  return (
    <main style={{ maxWidth: 1100, margin: '0 auto', padding: 24, fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ marginBottom: 8 }}>Celebration Atlas Admin</h1>
      <p style={{ color: '#444', marginTop: 0 }}>Internal review and operations console for Agent 1 discovery workflows.</p>

      {error ? (
        <p style={{ background: '#fff3cd', color: '#664d03', padding: 10, borderRadius: 8 }}>Stats load warning: {error}</p>
      ) : null}

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 12, margin: '18px 0 26px' }}>
        <StatCard label="Needs Review" value={stats.needsReview} />
        <StatCard label="Promoted Candidates" value={stats.promoted} />
        <StatCard label="Rejected Candidates" value={stats.rejected} />
        <StatCard label="Canonical Events" value={stats.canonicalEvents} />
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
        {cards.map((card) => (
          <Link key={card.href} href={card.href} style={{ textDecoration: 'none', color: 'inherit' }}>
            <article style={{ border: '1px solid #ddd', borderRadius: 10, padding: 16, background: '#fafafa', minHeight: 120 }}>
              <h2 style={{ marginTop: 0, marginBottom: 8, fontSize: 18 }}>{card.label}</h2>
              <p style={{ margin: 0, color: '#555', fontSize: 14 }}>{card.description}</p>
            </article>
          </Link>
        ))}
      </section>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ border: '1px solid #e0e0e0', borderRadius: 10, padding: 12, background: '#fff' }}>
      <div style={{ fontSize: 12, color: '#666' }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700 }}>{value}</div>
    </div>
  );
}
