import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAdminApi } from '@/lib/adminAuth';
import { updateMapReadinessRow } from '@/lib/mapReadinessAdmin';

function parseNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id, latitude, longitude, location_confidence, location_source, location_verified } = req.body ?? {};

  if (typeof id !== 'string' || !id) {
    return res.status(400).json({ error: 'id is required' });
  }

  const lat = parseNullableNumber(latitude);
  const lon = parseNullableNumber(longitude);
  const confidence = parseNullableNumber(location_confidence);

  if (Number.isNaN(lat) || Number.isNaN(lon) || Number.isNaN(confidence)) {
    return res.status(400).json({ error: 'latitude, longitude, and location_confidence must be numbers or null' });
  }

  if (lat !== null && (lat < -90 || lat > 90)) {
    return res.status(400).json({ error: 'latitude must be between -90 and 90' });
  }

  if (lon !== null && (lon < -180 || lon > 180)) {
    return res.status(400).json({ error: 'longitude must be between -180 and 180' });
  }

  if (confidence !== null && (confidence < 0 || confidence > 1)) {
    return res.status(400).json({ error: 'location_confidence must be between 0 and 1' });
  }

  try {
    const { data, error } = await updateMapReadinessRow({
      id,
      latitude: lat,
      longitude: lon,
      location_confidence: confidence,
      location_source: typeof location_source === 'string' ? location_source : null,
      location_verified: Boolean(location_verified),
    });

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ event: data });
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
}

export default requireAdminApi(handler);
