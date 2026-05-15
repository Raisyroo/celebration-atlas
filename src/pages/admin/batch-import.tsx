import { useMemo, useState } from 'react';
import { GetServerSideProps } from 'next';
import { withAdminPageAuth } from '@/lib/adminAuth';
import type { DiscoverySnapshot } from '@/lib/discoveryTypes';
import { validateDiscoverySnapshot } from '@/lib/snapshotValidation';

export default function BatchImportPage() {
  const [rawInput, setRawInput] = useState('');
  const [snapshot, setSnapshot] = useState<DiscoverySnapshot | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [submitResult, setSubmitResult] = useState<unknown>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const validation = useMemo(() => (snapshot ? validateDiscoverySnapshot(snapshot) : null), [snapshot]);
  const hasErrors = (validation?.errors.length ?? 0) > 0;

  const onPreview = () => {
    try {
      const parsed = JSON.parse(rawInput) as DiscoverySnapshot;
      setSnapshot(parsed);
      setParseError(null);
      setSubmitResult(null);
      setSubmitError(null);
    } catch (error) {
      setSnapshot(null);
      setParseError(error instanceof Error ? error.message : 'Invalid JSON payload');
    }
  };

  const onImport = async () => {
    if (!snapshot || hasErrors || !confirmed) return;
    setSubmitting(true);
    setSubmitError(null);
    setSubmitResult(null);
    try {
      const response = await fetch('/api/admin/batch-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ snapshot, confirmed: true })
      });
      const payload = await response.json();
      if (!response.ok) {
        setSubmitError(payload?.error ?? 'Import failed');
      } else {
        setSubmitResult(payload);
      }
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Import failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main style={{ maxWidth: 1200, margin: '0 auto', padding: 24, fontFamily: 'system-ui, sans-serif' }}>
      <h1>Controlled Batch Import</h1>
      <p>Paste a validated snapshot JSON, review preview summary, then explicitly confirm before writing candidates to Supabase.</p>

      <textarea rows={14} style={{ width: '100%' }} value={rawInput} onChange={(e) => setRawInput(e.target.value)} placeholder="Paste DiscoverySnapshot JSON" />
      <div style={{ marginTop: 12 }}>
        <button type="button" onClick={onPreview}>Preview Summary</button>
      </div>

      {parseError ? <p style={{ color: '#a00' }}>Parse error: {parseError}</p> : null}

      {snapshot ? (
        <section style={{ marginTop: 20 }}>
          <h2>Preview Summary</h2>
          <ul>
            <li>discovered_sources: {snapshot.discovered_sources?.length ?? 0}</li>
            <li>event_candidates: {snapshot.event_candidates?.length ?? 0}</li>
            <li>duplicate_signals: {snapshot.duplicate_signals?.length ?? 0}</li>
            <li>supplier_discoveries: {snapshot.supplier_discoveries?.length ?? 0}</li>
          </ul>

          {validation ? (
            <>
              <p>Validation: {hasErrors ? 'FAIL' : 'PASS'}</p>
              {validation.errors.length > 0 ? <ul>{validation.errors.map((e) => <li key={e} style={{ color: '#a00' }}>{e}</li>)}</ul> : <p>No validation errors.</p>}
            </>
          ) : null}

          <label style={{ display: 'block', marginTop: 16 }}>
            <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} /> I understand this will write candidates to Supabase
          </label>

          <button type="button" disabled={!confirmed || hasErrors || submitting} onClick={onImport} style={{ marginTop: 12 }}>
            {submitting ? 'Importing…' : 'Import Snapshot'}
          </button>
          {!confirmed ? <p style={{ color: '#666' }}>Check the confirmation box to enable import.</p> : null}
          {hasErrors ? <p style={{ color: '#a00' }}>Import blocked until validation errors are resolved.</p> : null}
        </section>
      ) : null}

      {submitError ? <p style={{ color: '#a00', marginTop: 16 }}>Import error: {submitError}</p> : null}
      {submitResult ? <pre style={{ marginTop: 16, background: '#f7f7f7', padding: 12 }}>{JSON.stringify(submitResult, null, 2)}</pre> : null}
    </main>
  );
}

export const getServerSideProps: GetServerSideProps = withAdminPageAuth(async () => ({ props: {} }));
