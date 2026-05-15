import { useState } from 'react';
import { GetServerSideProps } from 'next';
import { withAdminPageAuth } from '@/lib/adminAuth';
import type { DiscoverySnapshot } from '@/lib/discoveryTypes';
import { validateDiscoverySnapshot, type SnapshotValidationResult } from '@/lib/snapshotValidation';

type CandidateSummary = {
  candidate_name: string;
  city: string;
  county: string;
  state: string;
  start_date: string;
  end_date: string;
  duplicate_status: string;
  discovery_confidence: string;
  source_count: number;
};

function toCandidateSummary(candidate: Record<string, unknown>): CandidateSummary {
  return {
    candidate_name: typeof candidate.candidate_name === 'string' ? candidate.candidate_name : 'unknown',
    city: typeof candidate.city === 'string' ? candidate.city : '-',
    county: typeof candidate.county === 'string' ? candidate.county : '-',
    state: typeof candidate.state === 'string' ? candidate.state : '-',
    start_date: typeof candidate.start_date === 'string' ? candidate.start_date : '-',
    end_date: typeof candidate.end_date === 'string' ? candidate.end_date : '-',
    duplicate_status: typeof candidate.duplicate_status === 'string' ? candidate.duplicate_status : '-',
    discovery_confidence:
      typeof candidate.discovery_confidence === 'number'
        ? candidate.discovery_confidence.toFixed(2)
        : typeof candidate.discovery_confidence === 'string'
          ? candidate.discovery_confidence
          : '-',
    source_count: Array.isArray(candidate.source_urls) ? candidate.source_urls.length : 0
  };
}

export default function BatchImportPreviewPage() {
  const [rawInput, setRawInput] = useState('');
  const [parseError, setParseError] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<DiscoverySnapshot | null>(null);
  const [validation, setValidation] = useState<SnapshotValidationResult | null>(null);

  const previewSnapshot = () => {
    try {
      const parsed = JSON.parse(rawInput) as DiscoverySnapshot;
      setSnapshot(parsed);
      setValidation(validateDiscoverySnapshot(parsed));
      setParseError(null);
    } catch (error) {
      setSnapshot(null);
      setValidation(null);
      setParseError(error instanceof Error ? error.message : 'Invalid JSON payload');
    }
  };

  const candidateRows = (snapshot?.event_candidates ?? []).map((candidate) => toCandidateSummary(candidate));

  return (
    <main style={{ maxWidth: 1200, margin: '0 auto', padding: 24, fontFamily: 'system-ui, sans-serif' }}>
      <h1>Batch Import Preview</h1>
      <p>Paste enriched snapshot JSON to validate and preview what would be imported. This page does not import or promote data.</p>

      <label>
        Enriched Snapshot JSON
        <textarea
          value={rawInput}
          onChange={(e) => setRawInput(e.target.value)}
          rows={14}
          style={{ width: '100%', marginTop: 6 }}
          placeholder="Paste DiscoverySnapshot JSON here"
        />
      </label>
      <div style={{ marginTop: 10, marginBottom: 16 }}>
        <button type="button" onClick={previewSnapshot}>Preview Import</button>
      </div>

      {parseError ? <p style={{ color: '#a00', fontWeight: 600 }}>Parse error: {parseError}</p> : null}

      {snapshot ? (
        <>
          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 12, marginBottom: 16 }}>
            <MetricCard label="discovered_sources" value={snapshot.discovered_sources?.length ?? 0} />
            <MetricCard label="event_candidates" value={snapshot.event_candidates?.length ?? 0} />
            <MetricCard label="duplicate_signals" value={snapshot.duplicate_signals?.length ?? 0} />
            <MetricCard label="supplier_discoveries" value={snapshot.supplier_discoveries?.length ?? 0} />
          </section>

          {validation ? (
            <section style={{ marginBottom: 16 }}>
              <h2>Validation</h2>
              <p>Status: {validation.errors.length === 0 ? 'PASS' : 'FAIL'}</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <h3>Errors ({validation.errors.length})</h3>
                  {validation.errors.length > 0 ? <ul>{validation.errors.map((item) => <li key={item}>{item}</li>)}</ul> : <p>None</p>}
                </div>
                <div>
                  <h3>Warnings ({validation.warnings.length})</h3>
                  {validation.warnings.length > 0 ? <ul>{validation.warnings.map((item) => <li key={item}>{item}</li>)}</ul> : <p>None</p>}
                </div>
              </div>
            </section>
          ) : null}

          <section>
            <h2>Candidate Table Summary</h2>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['Candidate', 'City', 'County', 'State', 'Start Date', 'End Date', 'Duplicate Status', 'Confidence', 'Source URLs'].map((col) => (
                      <th key={col} style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 8 }}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {candidateRows.map((row, idx) => (
                    <tr key={`${row.candidate_name}-${idx}`}>
                      <td style={{ borderBottom: '1px solid #f0f0f0', padding: 8 }}>{row.candidate_name}</td>
                      <td style={{ borderBottom: '1px solid #f0f0f0', padding: 8 }}>{row.city}</td>
                      <td style={{ borderBottom: '1px solid #f0f0f0', padding: 8 }}>{row.county}</td>
                      <td style={{ borderBottom: '1px solid #f0f0f0', padding: 8 }}>{row.state}</td>
                      <td style={{ borderBottom: '1px solid #f0f0f0', padding: 8 }}>{row.start_date}</td>
                      <td style={{ borderBottom: '1px solid #f0f0f0', padding: 8 }}>{row.end_date}</td>
                      <td style={{ borderBottom: '1px solid #f0f0f0', padding: 8 }}>{row.duplicate_status}</td>
                      <td style={{ borderBottom: '1px solid #f0f0f0', padding: 8 }}>{row.discovery_confidence}</td>
                      <td style={{ borderBottom: '1px solid #f0f0f0', padding: 8 }}>{row.source_count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : null}
    </main>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ border: '1px solid #e0e0e0', borderRadius: 10, padding: 12, background: '#fff' }}>
      <div style={{ fontSize: 12, color: '#666' }}>{label} count</div>
      <div style={{ fontSize: 28, fontWeight: 700 }}>{value}</div>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = withAdminPageAuth(async () => ({ props: {} }));
