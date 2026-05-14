import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const { data, error } = await supabase
  .from('events')
  .insert({
    slug: 'test-codex-event-write',
    name: 'Codex Event Write Test',
    event_type: 'other'
  })
  .select();

if (error) {
  console.error('Insert into events failed.');
  console.error(error);
  process.exit(1);
}

console.log('Insert into events succeeded.');
console.log({ data });
