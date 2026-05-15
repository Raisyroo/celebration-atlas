import type { DiscoverySnapshot } from '@/lib/discoveryTypes';
import { getSupabaseAdminClient } from '@/lib/supabaseAdmin';
import crypto from 'crypto';

export type BatchImportSummary = {
  discovery_run_id: string;
  discovered_sources: number;
  event_candidates: number;
  event_candidate_sources: number;
  duplicate_matches: number;
  supplier_discoveries: number;
  snapshot_import_errors: number;
};

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function asNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

export async function importDiscoverySnapshot(snapshot: DiscoverySnapshot): Promise<BatchImportSummary> {
  const supabase = getSupabaseAdminClient();

  const { data: runData, error: runError } = await supabase
    .from('discovery_runs')
    .insert({
      run_type: asString(snapshot.run_metadata.run_type) ?? 'batch_import',
      status: 'completed',
      started_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
      items_found: snapshot.event_candidates.length,
      candidates_created: snapshot.event_candidates.length,
      duplicates_flagged: snapshot.duplicate_signals.length,
      notes: asString(snapshot.run_metadata.notes),
      run_metadata: snapshot.run_metadata,
    })
    .select('id')
    .single();

  if (runError || !runData) throw new Error(`Failed to create discovery run: ${runError?.message ?? 'unknown error'}`);
  const discoveryRunId = runData.id as string;

  let importedSources = 0;
  let importedCandidates = 0;
  let importedCandidateSources = 0;
  let importedSupplierDiscoveries = 0;
  let importedDuplicateMatches = 0;
  let importedErrors = 0;

  const persistImportError = async (stage: string, recordType: string, payload: unknown, errorMessage: string) => {
    importedErrors += 1;
    await supabase.from('snapshot_import_errors').insert({
      discovery_run_id: discoveryRunId,
      stage,
      record_type: recordType,
      payload,
      error_message: errorMessage,
    });
  };

  for (const source of snapshot.discovered_sources) {
    const row = source as Record<string, unknown>;
    const { error } = await supabase.from('discovery_sources').upsert({
      name: asString(row.name) ?? asString(row.source_name) ?? 'Unknown source',
      source_url: asString(row.source_url) ?? asString(row.url) ?? `unknown://${crypto.randomUUID()}`,
      source_type: asString(row.source_type) ?? 'unknown',
      city: asString(row.city),
      county: asString(row.county),
      state: asString(row.state) ?? 'Michigan',
      region: asString(row.region),
      priority: asString(row.priority) ?? 'medium',
      trust_score: asNumber(row.trust_score) ?? 0.5,
      notes: asString(row.notes),
    }, { onConflict: 'source_url' });

    if (error) {
      await persistImportError('discovery_sources', 'discovered_source', source, error.message);
      continue;
    }
    importedSources += 1;
  }

  for (const candidate of snapshot.event_candidates) {
    const row = candidate as Record<string, unknown>;
    const { data, error } = await supabase.from('event_candidates').insert({
      discovery_run_id: discoveryRunId,
      candidate_name: asString(row.candidate_name) ?? 'Unnamed candidate',
      normalized_name: asString(row.normalized_name),
      slug_candidate: asString(row.slug_candidate),
      event_type: asString(row.event_type) ?? 'unknown',
      category: asString(row.category),
      subcategory: asString(row.subcategory),
      city: asString(row.city),
      county: asString(row.county),
      state: asString(row.state) ?? 'Michigan',
      country: asString(row.country) ?? 'USA',
      venue_name: asString(row.venue_name),
      start_date: asString(row.start_date),
      end_date: asString(row.end_date),
      typical_month: asString(row.typical_month),
      typical_season: asString(row.typical_season),
      probable_recurrence: asString(row.probable_recurrence),
      description: asString(row.description),
      official_website_candidate: asString(row.official_website_candidate),
      social_links: asArray(row.social_links),
      source_urls: asArray(row.source_urls),
      discovery_confidence: asNumber(row.discovery_confidence) ?? 0.5,
      duplicate_status: asString(row.duplicate_status) ?? 'unique_candidate',
      semantic_notes: asString(row.semantic_notes),
      raw_payload: row,
    }).select('id').single();

    if (error || !data) {
      await persistImportError('event_candidates', 'event_candidate', candidate, error?.message ?? 'insert failed');
      continue;
    }

    importedCandidates += 1;
    const candidateId = data.id as string;

    const sourceUrls = asArray(row.source_urls).filter((v) => typeof v === 'string') as string[];
    for (const sourceUrl of sourceUrls) {
      const { error: sourceError } = await supabase.from('event_candidate_sources').insert({
        candidate_id: candidateId,
        source_url: sourceUrl,
        source_type: 'snapshot_source_url',
      });
      if (sourceError) {
        await persistImportError('event_candidate_sources', 'candidate_source', { candidate_id: candidateId, source_url: sourceUrl }, sourceError.message);
      } else {
        importedCandidateSources += 1;
      }
    }
  }

  for (const supplier of snapshot.supplier_discoveries) {
    const row = supplier as Record<string, unknown>;
    const { error } = await supabase.from('supplier_discoveries').insert({
      discovery_run_id: discoveryRunId,
      supplier_name: asString(row.supplier_name) ?? 'Unknown supplier',
      supplier_type: asString(row.supplier_type),
      website: asString(row.website),
      source_url: asString(row.source_url),
      events_found: asArray(row.events_found),
      relationship_types: asArray(row.relationship_types),
      confidence: asNumber(row.confidence),
      notes: asString(row.notes),
    });

    if (error) {
      await persistImportError('supplier_discoveries', 'supplier_discovery', supplier, error.message);
    } else {
      importedSupplierDiscoveries += 1;
    }
  }

  for (const signal of snapshot.duplicate_signals) {
    const row = signal as Record<string, unknown>;
    const { error } = await supabase.from('event_candidate_matches').insert({
      candidate_id: asString(row.candidate_id),
      possible_candidate_id: asString(row.possible_candidate_id),
      possible_event_id: asString(row.possible_event_id),
      match_score: asNumber(row.match_score) ?? 0.5,
      match_reason: asString(row.match_reason) ?? 'Imported from snapshot duplicate_signals',
      recommended_action: asString(row.recommended_action) ?? 'review',
      status: asString(row.status) ?? 'pending_review',
    });

    if (error) {
      await persistImportError('duplicate_matches', 'duplicate_signal', signal, error.message);
    } else {
      importedDuplicateMatches += 1;
    }
  }

  return {
    discovery_run_id: discoveryRunId,
    discovered_sources: importedSources,
    event_candidates: importedCandidates,
    event_candidate_sources: importedCandidateSources,
    duplicate_matches: importedDuplicateMatches,
    supplier_discoveries: importedSupplierDiscoveries,
    snapshot_import_errors: importedErrors,
  };
}
