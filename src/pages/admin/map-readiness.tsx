import Link from 'next/link';
import { GetServerSideProps } from 'next';
import { FormEvent, useMemo, useState } from 'react';
import { withAdminPageAuth } from '@/lib/adminAuth';
import { fetchMapReadinessQueue } from '@/lib/mapReadinessAdmin';

type EventRow = {
  id: string;
  name: string;
  city: string | null;
  county: string | null;
  state: string;
  latitude: number | null;
  longitude: number | null;
  location_confidence: number | null;
  location_source: string | null;
  location_verified: boolean;
};

type Props = {
  rows: EventRow[];
  filters: { missing_coordinates: boolean; verified_only: boolean; low_confidence: boolean };
  error?: string;
};

export const getServerSideProps: GetServerSideProps<Props> = withAdminPageAuth(async (ctx) => {
  const missingCoordinates = ctx.query.missing_coordinates === 'true';
  const verifiedOnly = ctx.query.verified_only === 'true';
  const lowConfidence = ctx.query.low_confidence === 'true';

  const { data, error } = await fetchMapReadinessQueue({ missingCoordinates, verifiedOnly, lowConfidence });

  return {
    props: {
      rows: ((data ?? []) as EventRow[]),
      error: error?.message,
      filters: {
        missing_coordinates: missingCoordinates,
        verified_only: verifiedOnly,
        low_confidence: lowConfidence,
      },
    },
  };
});

export default function MapReadinessPage({ rows, filters, error }: Props) {
  const [items, setItems] = useState(rows);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string>('');
  const querySummary = useMemo(() => JSON.stringify(filters), [filters]);

  function updateField(id: string, field: keyof EventRow, value: string | boolean) {
    setItems((prev) =>
      prev.map((row) => {
        if (row.id !== id) return row;
        if (field === 'location_verified') return { ...row, location_verified: Boolean(value) };
        if (field === 'latitude' || field === 'longitude' || field === 'location_confidence') {
          const parsed = value === '' ? null : Number(value);
          return { ...row, [field]: Number.isFinite(parsed) || parsed === null ? parsed : row[field] };
        }
        return { ...row, [field]: value as string };
      })
    );
  }

  async function saveRow(e: FormEvent, row: EventRow) {
    e.preventDefault();
    setSavingId(row.id);
    setMessage('');
    try {
      const res = await fetch('/api/admin/map-readiness/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(row),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error ?? 'Save failed');
      setMessage(`Saved ${row.name}`);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Unknown save error');
    } finally {
      setSavingId(null);
    }
  }

  return (
    <main style={{ maxWidth: 1300, margin: '0 auto', padding: 24, fontFamily: 'system-ui, sans-serif' }}>
      <p><Link href="/admin">← Admin Home</Link></p>
      <h1>Map Readiness Queue (MVP)</h1>
      <p>Canonical public.events queue for manual location quality review and updates.</p>
      <p>Active filters: {querySummary}</p>
      <p>{message}</p>
      {error ? <p>Load error: {error}</p> : null}

      <form method="get" style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
        <label><input type="checkbox" name="missing_coordinates" value="true" defaultChecked={filters.missing_coordinates} /> missing coordinates</label>
        <label><input type="checkbox" name="verified_only" value="true" defaultChecked={filters.verified_only} /> verified only</label>
        <label><input type="checkbox" name="low_confidence" value="true" defaultChecked={filters.low_confidence} /> low confidence</label>
        <button type="submit">Apply filters</button>
      </form>

      <table cellPadding={6} style={{ width: '100%', borderCollapse: 'collapse', background: '#fff' }}>
        <thead>
          <tr>
            <th>Event</th><th>City</th><th>County</th><th>State</th>
            <th>Latitude</th><th>Longitude</th><th>Confidence</th><th>Verified</th><th>Source</th><th>Save</th>
          </tr>
        </thead>
        <tbody>
          {items.map((row) => (
            <tr key={row.id}>
              <td>{row.name}</td><td>{row.city ?? '—'}</td><td>{row.county ?? '—'}</td><td>{row.state}</td>
              <td><input value={row.latitude ?? ''} onChange={(e) => updateField(row.id, 'latitude', e.target.value)} /></td>
              <td><input value={row.longitude ?? ''} onChange={(e) => updateField(row.id, 'longitude', e.target.value)} /></td>
              <td><input value={row.location_confidence ?? ''} onChange={(e) => updateField(row.id, 'location_confidence', e.target.value)} /></td>
              <td><input type="checkbox" checked={row.location_verified} onChange={(e) => updateField(row.id, 'location_verified', e.target.checked)} /></td>
              <td><input value={row.location_source ?? ''} onChange={(e) => updateField(row.id, 'location_source', e.target.value)} /></td>
              <td>
                <form onSubmit={(e) => saveRow(e, row)}>
                  <button type="submit" disabled={savingId === row.id}>{savingId === row.id ? 'Saving...' : 'Save'}</button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
