import type { DiscoverySnapshot } from '@/lib/discoveryTypes';

export type SnapshotValidationResult = {
  errors: string[];
  warnings: string[];
};

const requiredRoot: Array<keyof DiscoverySnapshot> = [
  'run_metadata',
  'discovered_sources',
  'event_candidates',
  'supplier_discoveries',
  'duplicate_signals',
  'raw_discoveries',
  'data_health'
];

export function validateDiscoverySnapshot(snapshot: DiscoverySnapshot): SnapshotValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const key of requiredRoot) {
    if (!(key in snapshot)) errors.push(`Missing root key: ${key}`);
  }

  if (snapshot.run_metadata.agent_name !== 'Michigan Event Discovery Agent') {
    errors.push('run_metadata.agent_name must match contract');
  }

  if (snapshot.run_metadata.state !== 'Michigan') {
    errors.push('run_metadata.state must be Michigan');
  }

  if (!Array.isArray(snapshot.event_candidates) || snapshot.event_candidates.length === 0) {
    errors.push('event_candidates must include at least one candidate');
  }

  snapshot.event_candidates.forEach((candidate, index) => {
    const label = `event_candidates[${index}]`;
    if (typeof candidate.candidate_name !== 'string' || candidate.candidate_name.trim().length === 0) {
      errors.push(`${label}.candidate_name is required`);
    }
    if (!Array.isArray(candidate.source_urls)) errors.push(`${label}.source_urls must be an array`);
    if (!Array.isArray(candidate.social_links)) errors.push(`${label}.social_links must be an array`);

    if (!candidate.official_website_candidate) warnings.push(`${label} has no official website candidate`);
    if (!candidate.city) warnings.push(`${label} has no city`);
    if (!candidate.county) warnings.push(`${label} has no county`);
  });

  return { errors, warnings };
}
