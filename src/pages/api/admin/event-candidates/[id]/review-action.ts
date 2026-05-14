import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAdminApi } from '@/lib/adminAuth';
import { getSupabaseAdminClient } from '@/lib/supabaseAdmin';

const allowedActions = new Set(['reject', 'needs_review']);

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const id = req.query.id;
  if (typeof id !== 'string' || !id) {
    return res.status(400).json({ error: 'Invalid candidate id' });
  }

  const action = req.body?.action;
  if (typeof action !== 'string' || !allowedActions.has(action)) {
    return res.status(400).json({ error: 'Invalid action. Use reject or needs_review.' });
  }

  const updatePayload =
    action === 'reject'
      ? { verification_status: 'rejected', needs_review: false }
      : { verification_status: 'needs_review', needs_review: true };

  try {
    const supabase = getSupabaseAdminClient();

    const { data: existing, error: existingErr } = await supabase
      .from('event_candidates')
      .select('id')
      .eq('id', id)
      .single();

    if (existingErr || !existing) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    const { data, error } = await supabase
      .from('event_candidates')
      .update(updatePayload)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ candidate: data, action, soft_state_change: true });
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
}


export default requireAdminApi(handler);
