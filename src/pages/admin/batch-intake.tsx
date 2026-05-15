import { FormEvent, useMemo, useState } from 'react';
import { GetServerSideProps } from 'next';
import { withAdminPageAuth } from '@/lib/adminAuth';
import type { DiscoverySnapshot } from '@/lib/discoveryTypes';
import { validateDiscoverySnapshot } from '@/lib/snapshotValidation';

type ValidationState = {
  errors: string[];
  warnings: string[];
};

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function buildSnapshot(eventNames: string[], state: string, runLabel: string, notes: string): DiscoverySnapshot {
  const today = new Date().toISOString().slice(0, 10);
  const runIdLabel = runLabel.trim() || 'batch-intake';

  return {
    run_metadata: {
      run_id: `run-${slugify(runIdLabel)}-${today}`,
      run_date: today,
      agent_name: 'Michigan Event Discovery Agent',
      state: 'Michigan',
      run_type: runIdLabel,
      notes: notes.trim() || undefined
    },
    discovered_sources: [],
    event_candidates: eventNames.map((name) => ({
      candidate_name: name,
      normalized_name: name,
      slug_candidate: slugify(name),
      event_type: 'unknown',
      category: 'unknown',
      subcategory: 'unknown',
      city: null,
      county: null,
      state,
      country: 'USA',
      venue_name: null,
      start_date: null,
      end_date: null,
      typical_month: null,
      typical_season: null,
      description: null,
      official_website_candidate: null,
      social_links: [],
      source_urls: [],
      source_type: 'manual_batch_intake',
      discovery_confidence: 0.2,
      semantic_notes: 'Placeholder candidate from batch intake. Requires source research and enrichment.',
      duplicate_status: 'needs_review',
      possible_matches: [],
      needs_review: true,
      research_placeholders: {
        primary_source_url: null,
        secondary_source_urls: [],
        date_verification_notes: null,
        location_verification_notes: null,
        organizer_contact: null,
        enrichment_status: 'pending'
      }
    })),
    supplier_discoveries: [],
    duplicate_signals: [],
    raw_discoveries: eventNames.map((name) => ({
      content: `Initial intake for ${name}`,
      source_name: 'Admin Batch Intake',
      source_url: `local://batch-intake/${slugify(name)}`,
      source_type: 'manual_batch_intake',
      potential_value: 'Requires web research to establish official event profile and confidence.',
      notes: 'No external research performed yet.'
    })),
    data_health: {
      strongest_candidates: [],
      weakest_useful_signals: ['All entries are unverified placeholders from manual intake.'],
      possible_duplicates: [],
      missing_regions: ['unknown'],
      missing_event_types: ['unknown'],
      recommended_next_searches: ['Find official event website and trusted local calendar for each candidate.'],
      source_quality_concerns: ['No external sources captured during intake.']
    }
  };
}

export default function BatchIntakePage() {
  const [eventText, setEventText] = useState('');
  const [defaultState, setDefaultState] = useState('Michigan');
  const [runLabel, setRunLabel] = useState('batch_intake_manual');
  const [notes, setNotes] = useState('');
  const [snapshot, setSnapshot] = useState<DiscoverySnapshot | null>(null);
  const [validation, setValidation] = useState<ValidationState | null>(null);

  const parsedEvents = useMemo(
    () => eventText.split('\n').map((line) => line.trim()).filter(Boolean),
    [eventText]
  );

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const nextSnapshot = buildSnapshot(parsedEvents, defaultState.trim() || 'Michigan', runLabel, notes);
    const result = validateDiscoverySnapshot(nextSnapshot);
    setSnapshot(nextSnapshot);
    setValidation(result);
  };

  return (
    <main style={{ maxWidth: 1100, margin: '0 auto', padding: 24, fontFamily: 'system-ui, sans-serif' }}>
      <h1>Batch Event Intake</h1>
      <p>Create a local discovery snapshot draft for review; no import or promotion is performed on this page.</p>

      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12, marginBottom: 20 }}>
        <label>
          Event Names (one per line)
          <textarea
            value={eventText}
            onChange={(e) => setEventText(e.target.value)}
            rows={10}
            style={{ width: '100%', marginTop: 6 }}
            placeholder="Tulip Time Festival\nNational Cherry Festival"
            required
          />
        </label>
        <label>
          Default State
          <input value={defaultState} onChange={(e) => setDefaultState(e.target.value)} style={{ width: '100%', marginTop: 6 }} />
        </label>
        <label>
          Discovery Run Label
          <input value={runLabel} onChange={(e) => setRunLabel(e.target.value)} style={{ width: '100%', marginTop: 6 }} />
        </label>
        <label>
          Notes
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} style={{ width: '100%', marginTop: 6 }} />
        </label>
        <button type="submit" disabled={parsedEvents.length === 0} style={{ width: 220, padding: '10px 12px' }}>
          Generate Snapshot Draft
        </button>
      </form>

      {validation ? (
        <section style={{ marginBottom: 20 }}>
          <h2>Validation</h2>
          <p>{validation.errors.length === 0 ? 'PASS' : 'FAIL'}</p>
          {validation.errors.length > 0 ? <ul>{validation.errors.map((e) => <li key={e}>{e}</li>)}</ul> : null}
          {validation.warnings.length > 0 ? <ul>{validation.warnings.map((w) => <li key={w}>{w}</li>)}</ul> : null}
        </section>
      ) : null}

      {snapshot ? (
        <section>
          <h2>Generated JSON Preview</h2>
          <pre style={{ background: '#111', color: '#ddd', padding: 12, borderRadius: 8, overflowX: 'auto' }}>
            {JSON.stringify(snapshot, null, 2)}
          </pre>
        </section>
      ) : null}
    </main>
  );
}

export const getServerSideProps: GetServerSideProps = withAdminPageAuth(async () => ({ props: {} }));
