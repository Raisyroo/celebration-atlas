const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('STATUS: MISSING_ENV_VARS');
  console.error('Missing required environment variables: SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

let host;
try {
  host = new URL(SUPABASE_URL).host;
} catch {
  console.error('STATUS: INVALID_SUPABASE_URL');
  console.error('SUPABASE_URL is not a valid URL.');
  process.exit(1);
}

console.log(`Supabase host: ${host}`);

const endpoint = `${SUPABASE_URL}/rest/v1/discovery_runs?select=id&limit=1`;

try {
  const res = await fetch(endpoint, {
    method: 'GET',
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
    },
  });

  const body = await res.text();

  if (res.ok) {
    console.log('STATUS: SUCCESS');
    console.log('Connected to Supabase and read discovery_runs successfully (limit 1).');
    process.exit(0);
  }

  if (res.status === 401 || res.status === 403) {
    console.error('STATUS: AUTH_FAILURE');
    console.error('Authentication failed. Check SUPABASE_SERVICE_ROLE_KEY permissions and value.');
    process.exit(1);
  }

  if (res.status === 404 || body.includes('relation') || body.includes('discovery_runs') || body.includes('schema cache')) {
    console.error('STATUS: TABLE_MISSING_OR_MIGRATION_NOT_APPLIED');
    console.error('Could not query discovery_runs. Table may be missing or migrations may not be applied.');
    process.exit(1);
  }

  console.error('STATUS: UNKNOWN_HTTP_ERROR');
  console.error(`Unexpected HTTP ${res.status} response from Supabase.`);
  process.exit(1);
} catch (err) {
  console.error('STATUS: NETWORK_OR_FETCH_FAILURE');
  console.error(`Network/fetch failure while contacting Supabase: ${err.message}`);
  process.exit(1);
}
