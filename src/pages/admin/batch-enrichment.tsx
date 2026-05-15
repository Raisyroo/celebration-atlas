import { FormEvent, useMemo, useState } from 'react';
import { GetServerSideProps } from 'next';
import { withAdminPageAuth } from '@/lib/adminAuth';
import type { DiscoverySnapshot } from '@/lib/discoveryTypes';
import { validateDiscoverySnapshot } from '@/lib/snapshotValidation';

type ValidationState = { errors: string[]; warnings: string[] };

type ChecklistMetadata = {
  officialWebsiteVerified: boolean;
  datesVerified: boolean;
  locationVerified: boolean;
  taxonomyAssigned: boolean;
  descriptionDrafted: boolean;
  reviewedBy: string;
  reviewNotes: string;
  reviewedAt: string | null;
};

type Candidate = Record<string, unknown>;

const defaultChecklist: ChecklistMetadata = {
  officialWebsiteVerified: false,
  datesVerified: false,
  locationVerified: false,
  taxonomyAssigned: false,
  descriptionDrafted: false,
  reviewedBy: '',
  reviewNotes: '',
  reviewedAt: null
};

function asString(v: unknown): string { return typeof v === 'string' ? v : ''; }
function asStringArray(v: unknown): string[] { return Array.isArray(v) ? v.filter((x) => typeof x === 'string') : []; }

function enrichCandidate(candidate: Candidate, checklist: ChecklistMetadata): Candidate {
  const sourceUrls = asStringArray(candidate.source_urls);
  const researchChecklist = {
    official_website_verified: checklist.officialWebsiteVerified,
    dates_verified: checklist.datesVerified,
    location_verified: checklist.locationVerified,
    taxonomy_assigned: checklist.taxonomyAssigned,
    description_drafted: checklist.descriptionDrafted,
    reviewed_by: checklist.reviewedBy || null,
    review_notes: checklist.reviewNotes || null,
    reviewed_at: checklist.reviewedAt
  };

  return {
    ...candidate,
    official_website_candidate: asString(candidate.official_website_candidate) || null,
    source_urls: sourceUrls,
    city: asString(candidate.city) || null,
    county: asString(candidate.county) || null,
    event_type: asString(candidate.event_type) || 'unknown',
    category: asString(candidate.category) || 'unknown',
    subcategory: asString(candidate.subcategory) || 'unknown',
    typical_month: asString(candidate.typical_month) || null,
    typical_season: asString(candidate.typical_season) || null,
    description: asString(candidate.description) || null,
    discovery_confidence: Number(candidate.discovery_confidence ?? 0.2),
    research_checklist: researchChecklist
  };
}

export default function BatchEnrichmentPage() {
  const [rawInput, setRawInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<DiscoverySnapshot | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [validation, setValidation] = useState<ValidationState | null>(null);

  const selected = useMemo(() => (snapshot?.event_candidates?.[selectedIndex] ?? null) as Candidate | null, [snapshot, selectedIndex]);

  const [checklist, setChecklist] = useState<ChecklistMetadata>(defaultChecklist);

  const parseSnapshot = () => {
    try {
      const parsed = JSON.parse(rawInput) as DiscoverySnapshot;
      if (!Array.isArray(parsed.event_candidates)) throw new Error('Snapshot is missing event_candidates array.');
      setSnapshot(parsed);
      setSelectedIndex(0);
      setChecklist(defaultChecklist);
      setValidation(validateDiscoverySnapshot(parsed));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid JSON');
    }
  };

  const applyEnrichment = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!snapshot) return;

    const nextCandidates = snapshot.event_candidates.map((candidate, idx) =>
      idx === selectedIndex ? enrichCandidate(candidate, checklist) : candidate
    );

    const nextSnapshot: DiscoverySnapshot = { ...snapshot, event_candidates: nextCandidates };
    setSnapshot(nextSnapshot);
    setValidation(validateDiscoverySnapshot(nextSnapshot));
  };

  const updateSelectedField = (key: string, value: unknown) => {
    if (!snapshot) return;
    const nextCandidates = [...snapshot.event_candidates];
    nextCandidates[selectedIndex] = { ...(nextCandidates[selectedIndex] as Candidate), [key]: value };
    setSnapshot({ ...snapshot, event_candidates: nextCandidates });
  };

  return (
    <main style={{ maxWidth: 1200, margin: '0 auto', padding: 24, fontFamily: 'system-ui, sans-serif' }}>
      <h1>Batch Enrichment</h1>
      <p>Paste a Batch Intake snapshot JSON, enrich candidate fields, validate, and export preview JSON. No auto-import or promotion occurs here.</p>

      <label>
        Snapshot JSON Input
        <textarea value={rawInput} onChange={(e) => setRawInput(e.target.value)} rows={12} style={{ width: '100%', marginTop: 6 }} />
      </label>
      <div style={{ marginTop: 8, marginBottom: 16 }}>
        <button type="button" onClick={parseSnapshot}>Load Snapshot</button>
      </div>
      {error ? <p style={{ color: '#a00' }}>{error}</p> : null}

      {snapshot ? (
        <>
          <label>
            Candidate
            <select value={selectedIndex} onChange={(e) => setSelectedIndex(Number(e.target.value))} style={{ marginLeft: 8 }}>
              {snapshot.event_candidates.map((candidate, idx) => (
                <option key={`${idx}-${String((candidate as Candidate).slug_candidate ?? idx)}`} value={idx}>
                  {String((candidate as Candidate).candidate_name ?? `Candidate ${idx + 1}`)}
                </option>
              ))}
            </select>
          </label>

          {selected ? (
            <form onSubmit={applyEnrichment} style={{ display: 'grid', gap: 8, marginTop: 16 }}>
              {['official_website_candidate','city','county','event_type','category','subcategory','typical_month','typical_season','description','discovery_confidence'].map((key) => (
                <label key={key}>
                  {key}
                  <input
                    value={String((selected[key] as string | number | null) ?? '')}
                    onChange={(e) => updateSelectedField(key, key === 'discovery_confidence' ? Number(e.target.value) : e.target.value)}
                    style={{ width: '100%', marginTop: 4 }}
                  />
                </label>
              ))}
              <label>
                source_urls (one per line)
                <textarea
                  value={asStringArray(selected.source_urls).join('\n')}
                  onChange={(e) => updateSelectedField('source_urls', e.target.value.split('\n').map((x) => x.trim()).filter(Boolean))}
                  rows={4}
                  style={{ width: '100%', marginTop: 4 }}
                />
              </label>

              <fieldset style={{ border: '1px solid #ccc', padding: 12 }}>
                <legend>Structured Research Checklist Metadata</legend>
                {[
                  ['officialWebsiteVerified', 'Official website verified'],
                  ['datesVerified', 'Dates verified'],
                  ['locationVerified', 'Location verified'],
                  ['taxonomyAssigned', 'Taxonomy assigned'],
                  ['descriptionDrafted', 'Description drafted']
                ].map(([key, label]) => (
                  <label key={key} style={{ display: 'block' }}>
                    <input
                      type="checkbox"
                      checked={Boolean(checklist[key as keyof ChecklistMetadata])}
                      onChange={(e) => setChecklist((prev) => ({ ...prev, [key]: e.target.checked }))}
                    /> {label}
                  </label>
                ))}
                <label>Reviewed by
                  <input value={checklist.reviewedBy} onChange={(e) => setChecklist((p) => ({ ...p, reviewedBy: e.target.value }))} style={{ width: '100%' }} />
                </label>
                <label>Review notes
                  <textarea value={checklist.reviewNotes} onChange={(e) => setChecklist((p) => ({ ...p, reviewNotes: e.target.value }))} rows={3} style={{ width: '100%' }} />
                </label>
              </fieldset>
              <button type="submit" style={{ width: 220, padding: '8px 10px' }}>Generate Enriched Preview</button>
            </form>
          ) : null}

          {validation ? (
            <section style={{ marginTop: 16 }}>
              <h2>Validation</h2>
              <p>{validation.errors.length === 0 ? 'PASS' : 'FAIL'}</p>
              {validation.errors.length > 0 ? <ul>{validation.errors.map((x) => <li key={x}>{x}</li>)}</ul> : null}
              {validation.warnings.length > 0 ? <ul>{validation.warnings.map((x) => <li key={x}>{x}</li>)}</ul> : null}
            </section>
          ) : null}

          <section style={{ marginTop: 16 }}>
            <h2>Enriched Snapshot Preview JSON</h2>
            <pre style={{ background: '#111', color: '#ddd', padding: 12, borderRadius: 8, overflowX: 'auto' }}>{JSON.stringify(snapshot, null, 2)}</pre>
          </section>
        </>
      ) : null}
    </main>
  );
}

export const getServerSideProps: GetServerSideProps = withAdminPageAuth(async () => ({ props: {} }));
