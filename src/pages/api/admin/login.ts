import type { NextApiRequest, NextApiResponse } from 'next';
import { ADMIN_COOKIE_NAME } from '@/lib/adminAuth';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const expected = process.env.ADMIN_ACCESS_TOKEN;
  if (!expected) return res.status(500).json({ error: 'Admin access token is not configured.' });

  const token = req.body?.token;
  if (typeof token !== 'string' || token !== expected) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.setHeader('Set-Cookie', `${ADMIN_COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=28800${secure}`);

  return res.status(200).json({ ok: true });
}
