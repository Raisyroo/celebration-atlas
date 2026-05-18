import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAdminApi } from '@/lib/adminAuth';
import { fetchMapReadinessQueue } from '@/lib/mapReadinessAdmin';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const missingCoordinates = req.query.missing_coordinates === 'true';
    const verifiedOnly = req.query.verified_only === 'true';
    const lowConfidence = req.query.low_confidence === 'true';
    const threshold = typeof req.query.low_confidence_threshold === 'string' ? Number(req.query.low_confidence_threshold) : undefined;

    const { data, error } = await fetchMapReadinessQueue({
      missingCoordinates,
      verifiedOnly,
      lowConfidence,
      lowConfidenceThreshold: Number.isFinite(threshold) ? threshold : undefined,
    });

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ events: data ?? [] });
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
}

export default requireAdminApi(handler);
