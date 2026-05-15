import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function tableExposed(tableName) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/`, {
    headers: { apikey: SUPABASE_SERVICE_ROLE_KEY }
  });
  if (!res.ok) return false;
  const openApi = await res.json();
  return Boolean(openApi?.paths?.[`/${tableName}`]);
}
(async function main() {
  try {
    const probe = await supabase
      .from('event_sources')
      .select('id')
      .limit(1);

    const exists = !probe.error;
    const exposed = await tableExposed('event_sources');

    console.log(JSON.stringify({
      event_sources_exists_via_rest: exists,
      event_sources_rest_probe_error: probe.error?.message ?? null,
      event_sources_exposed_in_openapi: exposed,
      unique_index_verification_note: 'Verify via SQL: select indexname, indexdef from pg_indexes where schemaname=\'public\' and tablename=\'event_sources\';',
      dry_run_expectation: exists
        ? 'Dry-run promotions should no longer warn that event_sources is unavailable.'
        : 'Dry-run promotions may still warn that event_sources is unavailable.',
      openapi_diagnostic: exposed
        ? 'OpenAPI lists event_sources.'
        : 'OpenAPI does not list event_sources (diagnostic only).'    }, null, 2));
  } catch (err) {
    console.error(err?.message || err);
    process.exit(1);
  }
})();
