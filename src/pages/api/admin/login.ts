import type { NextApiRequest, NextApiResponse } from 'next';
import { isValidAdminToken, setAdminCookie } from '@/lib/adminAuth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!isValidAdminToken(req.body?.token)) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  setAdminCookie(res, req.body.token);
  return res.status(200).json({ ok: true });
}
