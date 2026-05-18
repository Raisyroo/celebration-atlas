import { getSupabaseAdminClient } from './supabaseAdmin';

export interface MapReadinessFilters {
  missingCoordinates?: boolean;
  verifiedOnly?: boolean;
  lowConfidence?: boolean;
  lowConfidenceThreshold?: number;
  limit?: number;
}

export interface MapReadinessUpdateInput {
  id: string;
  latitude: number | null;
  longitude: number | null;
  location_confidence: number | null;
  location_source: string | null;
  location_verified: boolean;
}

export async function fetchMapReadinessQueue(filters: MapReadinessFilters = {}) {
  const supabase = getSupabaseAdminClient();
  const limit = filters.limit ?? 300;
  const lowConfidenceThreshold = filters.lowConfidenceThreshold ?? 0.6;

  let query = supabase
    .from('events')
    .select('id,name,city,county,state,latitude,longitude,location_confidence,location_source,location_verified,verification_status,status,updated_at')
    .eq('status', 'active')
    .eq('verification_status', 'verified')
    .order('updated_at', { ascending: false })
    .limit(limit);

  if (filters.missingCoordinates) {
    query = query.or('latitude.is.null,longitude.is.null');
  }

  if (filters.verifiedOnly) {
    query = query.eq('location_verified', true);
  }

  if (filters.lowConfidence) {
    query = query.or(`location_confidence.is.null,location_confidence.lt.${lowConfidenceThreshold}`);
  }

  return query;
}

export async function updateMapReadinessRow(input: MapReadinessUpdateInput) {
  const supabase = getSupabaseAdminClient();

  return supabase
    .from('events')
    .update({
      latitude: input.latitude,
      longitude: input.longitude,
      location_confidence: input.location_confidence,
      location_source: input.location_source,
      location_verified: input.location_verified,
    })
    .eq('id', input.id)
    .eq('status', 'active')
    .eq('verification_status', 'verified')
    .select('id,name,city,county,state,latitude,longitude,location_confidence,location_source,location_verified')
    .single();
}
