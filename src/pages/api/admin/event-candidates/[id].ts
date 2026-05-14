import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAdminApi } from '@/lib/adminAuth';
import { fetchEventCandidateDetail } from '@/lib/eventCandidatesAdmin';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const id = req.query.id;
  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid candidate id' });
  }

  try {
    const { candidate, sources, matches, error } = await fetchEventCandidateDetail(id);
    if (error) return res.status(500).json({ error: error.message });
    if (!candidate) return res.status(404).json({ error: 'Candidate not found' });
    return res.status(200).json({ candidate, sources, matches });
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
}


export default requireAdminApi(handler);
