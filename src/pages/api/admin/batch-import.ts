import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAdminApi } from '@/lib/adminAuth';
import type { DiscoverySnapshot } from '@/lib/discoveryTypes';
import { validateDiscoverySnapshot } from '@/lib/snapshotValidation';
import { importDiscoverySnapshot } from '@/lib/batchImport';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { snapshot, confirmed } = req.body ?? {};
  if (!confirmed) {
    return res.status(400).json({ error: 'Explicit confirmation is required before import.' });
  }

  if (!snapshot || typeof snapshot !== 'object') {
    return res.status(400).json({ error: 'snapshot object is required.' });
  }

  const validation = validateDiscoverySnapshot(snapshot as DiscoverySnapshot);
  if (validation.errors.length > 0) {
    return res.status(400).json({ error: 'Validation failed.', validation });
  }

  try {
    const summary = await importDiscoverySnapshot(snapshot as DiscoverySnapshot);
    return res.status(200).json({ ok: true, validation, summary });
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Batch import failed.' });
  }
}

export default requireAdminApi(handler);
