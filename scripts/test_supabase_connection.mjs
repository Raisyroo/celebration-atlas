import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const { data, error, status } = await supabase
  .from('discovery_runs')
  .select('id', { count: 'exact', head: false })
  .limit(1);

if (error) {
  console.error('Connection test failed.');
  console.error({ status, error });
  process.exit(1);
}

console.log('Supabase connection successful.');
console.log({ status, rowsReturned: data?.length ?? 0 });
