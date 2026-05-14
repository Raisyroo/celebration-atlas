import fs from 'node:fs';

const allowedEventTypes = new Set([
  'festival','fair','parade','carnival','convention','expo','concert_series','art_fair','market','food_event','music_event','holiday_event','seasonal_event','race','agricultural_event','community_event','unique_event','other','unknown'
]);

const allowedDuplicateStatus = new Set([
  'unique_candidate','possible_duplicate','probable_duplicate','matched_existing_event','needs_review'
]);

const requiredRoot = [
  'run_metadata','discovered_sources','event_candidates','supplier_discoveries','duplicate_signals','raw_discoveries','data_health'
];

const requiredDataHealthArrays = [
  'strongest_candidates',
  'weakest_useful_signals',
  'possible_duplicates',
  'missing_regions',
  'missing_event_types',
  'recommended_next_searches',
  'source_quality_concerns',
];

const errors = [];
const warnings = [];

const metrics = {
  candidatesChecked: 0,
  sourcesChecked: 0,
};

function addError(msg) { errors.push(msg); }
function addWarning(msg) { warnings.push(msg); }

function isConfidence(n) {
  return typeof n === 'number' && Number.isFinite(n) && n >= 0 && n <= 1;
}

function isValidDateOrNull(v) {
  if (v === null) return true;
  if (typeof v !== 'string') return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const d = new Date(`${v}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
}

const file = process.argv[2];
if (!file) {
  console.error('Usage: node scripts/validate-snapshot.mjs <snapshot.json>');
  process.exit(1);
}

let data;
try {
  const raw = fs.readFileSync(file, 'utf8');
  data = JSON.parse(raw);
} catch (err) {
  console.error(`ERROR: Unable to read/parse JSON: ${err.message}`);
  process.exit(1);
}

for (const key of requiredRoot) {
  if (!(key in data)) addError(`Missing root key: ${key}`);
}

if (data.run_metadata?.agent_name !== 'Michigan Event Discovery Agent') addError('run_metadata.agent_name must match contract');
if (data.run_metadata?.state !== 'Michigan') addError('run_metadata.state must be Michigan');

if (!Array.isArray(data.discovered_sources)) {
  addError('discovered_sources must be an array');
} else {
  for (const [i, s] of data.discovered_sources.entries()) {
    metrics.sourcesChecked += 1;
    if (!s?.source_url || typeof s.source_url !== 'string') addError(`discovered_sources[${i}].source_url is required`);
    if (s?.trust_score !== undefined && !isConfidence(s.trust_score)) addError(`discovered_sources[${i}].trust_score must be 0.0-1.0`);
  }
}

if (!Array.isArray(data.raw_discoveries)) {
  addError('raw_discoveries must be an array');
} else {
  for (const [i, r] of data.raw_discoveries.entries()) {
    if (!r?.source_url || typeof r.source_url !== 'string') addError(`raw_discoveries[${i}].source_url is required`);
  }
}

const candidateNames = new Set();
if (!Array.isArray(data.event_candidates)) {
  addError('event_candidates must be an array');
} else {
  for (const [i, c] of data.event_candidates.entries()) {
    metrics.candidatesChecked += 1;
    const label = `event_candidates[${i}]`;
    if (!c?.candidate_name || typeof c.candidate_name !== 'string') {
      addError(`${label}.candidate_name is required`);
    } else {
      candidateNames.add(c.candidate_name);
    }
    if (!allowedEventTypes.has(c?.event_type)) addError(`${label}.event_type is unsupported`);
    if (!allowedDuplicateStatus.has(c?.duplicate_status)) addError(`${label}.duplicate_status is unsupported`);
    if (!isConfidence(c?.discovery_confidence)) addError(`${label}.discovery_confidence must be 0.0-1.0`);
    if (!Array.isArray(c?.source_urls)) addError(`${label}.source_urls must be an array`);
    if (!Array.isArray(c?.social_links)) addError(`${label}.social_links must be an array`);
    if (!isValidDateOrNull(c?.start_date)) addError(`${label}.start_date must be null or YYYY-MM-DD`);
    if (!isValidDateOrNull(c?.end_date)) addError(`${label}.end_date must be null or YYYY-MM-DD`);

    if (!c?.normalized_name && !c?.slug_candidate) addWarning(`${label} should include normalized_name or slug_candidate`);
    if (c?.start_date === null && c?.end_date === null) addWarning(`${label} has no dates`);
    if (!c?.county) addWarning(`${label} has no county`);
    if (!c?.official_website_candidate) addWarning(`${label} has no official website`);
  }
}

if (!Array.isArray(data.supplier_discoveries)) {
  addError('supplier_discoveries must be an array');
} else {
  for (const [i, s] of data.supplier_discoveries.entries()) {
    if (s?.confidence !== undefined && !isConfidence(s.confidence)) addError(`supplier_discoveries[${i}].confidence must be 0.0-1.0`);
  }
}

if (!Array.isArray(data.duplicate_signals)) {
  addError('duplicate_signals must be an array');
} else {
  for (const [i, d] of data.duplicate_signals.entries()) {
    if (!isConfidence(d?.match_score)) addError(`duplicate_signals[${i}].match_score must be 0.0-1.0`);
    const pm = d?.possible_match_name;
    if (typeof pm === 'string' && pm.length > 0 && !candidateNames.has(pm)) {
      addWarning(`duplicate_signals[${i}] possible_match_name not present in event_candidates: ${pm}`);
    }
  }
}

if (!data.data_health || typeof data.data_health !== 'object' || Array.isArray(data.data_health)) {
  addError('data_health must be an object');
} else {
  for (const field of requiredDataHealthArrays) {
    if (!Array.isArray(data.data_health[field])) addError(`data_health.${field} must be an array`);
  }
}

console.log(`Validated snapshot: ${file}`);
console.log(`Errors: ${errors.length}`);
console.log(`Warnings: ${warnings.length}`);
console.log(`Candidates checked: ${metrics.candidatesChecked}`);
console.log(`Sources checked: ${metrics.sourcesChecked}`);

if (errors.length > 0) {
  console.log('Result: FAIL');
  for (const e of errors) console.log(`ERROR: ${e}`);
  for (const w of warnings) console.log(`WARN: ${w}`);
  process.exit(1);
}

console.log('Result: PASS');
for (const w of warnings) console.log(`WARN: ${w}`);
