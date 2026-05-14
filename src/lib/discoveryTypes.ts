export type DuplicateStatus =
  | 'unique_candidate'
  | 'possible_duplicate'
  | 'probable_duplicate'
  | 'matched_existing_event'
  | 'needs_review';

export interface DiscoverySnapshot {
  run_metadata: {
    run_id: string;
    run_date: string;
    agent_name: 'Michigan Event Discovery Agent';
    state: 'Michigan';
    run_type: string;
    notes?: string;
  };
  discovered_sources: Array<Record<string, unknown>>;
  event_candidates: Array<Record<string, unknown>>;
  supplier_discoveries: Array<Record<string, unknown>>;
  duplicate_signals: Array<Record<string, unknown>>;
  raw_discoveries: Array<Record<string, unknown>>;
  data_health: Record<string, unknown>;
}
