import type { DiscoverySnapshot } from './discoveryTypes';

const requiredRootKeys: Array<keyof DiscoverySnapshot> = [
  'run_metadata',
  'discovered_sources',
  'event_candidates',
  'supplier_discoveries',
  'duplicate_signals',
  'raw_discoveries',
  'data_health',
];

export function validateSnapshotShape(payload: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!payload || typeof payload !== 'object') {
    return { valid: false, errors: ['Snapshot payload must be an object.'] };
  }

  const asRecord = payload as Record<string, unknown>;
  for (const key of requiredRootKeys) {
    if (!(key in asRecord)) errors.push(`Missing root key: ${key}`);
  }

  if (!Array.isArray(asRecord.discovered_sources)) errors.push('discovered_sources must be an array');
  if (!Array.isArray(asRecord.event_candidates)) errors.push('event_candidates must be an array');
  if (!Array.isArray(asRecord.supplier_discoveries)) errors.push('supplier_discoveries must be an array');
  if (!Array.isArray(asRecord.duplicate_signals)) errors.push('duplicate_signals must be an array');

  return { valid: errors.length === 0, errors };
}

export const snapshotImportWorkflow = [
  'Upload JSON',
  'Validate structure',
  'Create discovery run',
  'Import sources',
  'Import event candidates',
  'Import candidate source evidence',
  'Import supplier discoveries',
  'Create duplicate signals',
  'Persist snapshot import errors',
] as const;
