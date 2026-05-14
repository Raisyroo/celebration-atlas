import type { NextApiRequest, NextApiResponse } from 'next';
import { hasValidAdminAccess } from '@/lib/adminAuth';
import { fetchEventCandidatesQueue } from '@/lib/eventCandidatesAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!hasValidAdminAccess(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { data, error } = await fetchEventCandidatesQueue();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ candidates: data ?? [] });
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
}
