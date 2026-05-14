import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAdminApi } from '@/lib/adminAuth';
import { fetchEventCandidatesQueue } from '@/lib/eventCandidatesAdmin';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const needsReview = req.query.needs_review === 'true' ? true : req.query.needs_review === 'false' ? false : undefined;
    const minConfidence = typeof req.query.min_confidence === 'string' ? Number(req.query.min_confidence) : undefined;
    const { data, error } = await fetchEventCandidatesQueue({
      state: typeof req.query.state === 'string' ? req.query.state : undefined,
      county: typeof req.query.county === 'string' ? req.query.county : undefined,
      duplicate_status: typeof req.query.duplicate_status === 'string' ? req.query.duplicate_status : undefined,
      verification_status: typeof req.query.verification_status === 'string' ? req.query.verification_status : undefined,
      created_after: typeof req.query.created_after === 'string' ? req.query.created_after : undefined,
      needs_review: needsReview,
      min_confidence: Number.isFinite(minConfidence) ? minConfidence : undefined,
    });
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ candidates: data ?? [] });
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
}


export default requireAdminApi(handler);
