# Celebration Atlas — Map Readiness MVP Plan (Planning Artifacts Only)

**Date:** May 15, 2026  
**Scope:** Architecture/design only. No schema migration or code implementation in this document.

---

## 1) Minimal geospatial extension plan for `public.events`

### Current-state summary
`public.events` currently supports place text (`city`, `county`, `state`, `venue_name`) but no explicit coordinate storage. This means canonical events can be browsed textually, but not reliably plotted as map pins or used for geospatial heat surfaces.

### Minimal extension intent (future, not applied now)
Add a small set of location and confidence fields on canonical events, then layer geospatial primitives later:

1. **Coordinate primitives (MVP):** latitude/longitude numeric columns.
2. **Readiness/status metadata:** map readiness classification and confidence fields.
3. **Future geometric compatibility:** optional generated/stored point and geospatial indexing once PostGIS is enabled.

This sequence keeps initial risk low and avoids requiring PostGIS in Phase 1.

---

## 2) Recommended exact latitude/longitude field types

### Recommendation
Use:
- `latitude double precision`
- `longitude double precision`

### Why `double precision`
- Standard for map APIs and geocoders.
- Better interoperability than fixed numeric scales for most application stacks.
- Sufficient precision for event-venue scale use cases.

### Data constraints to enforce later (when schema work begins)
- Latitude range: `-90 <= latitude <= 90`
- Longitude range: `-180 <= longitude <= 180`
- Both null or both present (avoid half-defined coordinates)

---

## 3) Future PostGIS compatibility approach

### Recommended compatibility path
1. **Phase 1/2 (no PostGIS dependency):** use `latitude`/`longitude` primitives.
2. **Phase 2.5+ (optional):** enable PostGIS and introduce a derived point representation:
   - `geography(Point, 4326)` (preferred for distance/earth calculations), or
   - `geometry(Point, 4326)` if planar ops are preferred.
3. Backfill point values from existing lat/lng.
4. Add geospatial index (`GIST`) only when query workload justifies it.

### Guiding principle
Keep lat/lng as the durable canonical storage, even after PostGIS adoption. Treat geospatial point columns as computed/optimization-friendly derivatives.

---

## 4) “Map Readiness Queue” admin workflow design

### Purpose
Create an operational queue for canonical events that need location completion, verification, or confidence uplift before map publication.

### Queue inputs
Canonical `events` records prioritized by:
- missing coordinates,
- low geocode confidence,
- missing county/state normalization,
- recently promoted events without location verification.

### Queue views
1. **Needs Coordinates** — no lat/lng yet.
2. **Needs Review** — coordinates exist but low confidence or mismatch signs.
3. **Ready** — coordinates + minimum required location fields.

### Queue actions (admin)
- open event detail
- set/update coordinates manually
- set confidence level and source provenance
- mark location as verified
- defer with reason

### Operational UX minimum
- filters: county, city, status, confidence bucket
- sorting: newest promoted first; then lowest confidence
- bulk tagging (optional later): mark selected rows “reviewed/no change”

---

## 5) Definitions

### `map-ready`
An event is **map-ready** when all are true:
1. latitude and longitude are both present and valid ranges,
2. state is present and normalized (Michigan for current scope),
3. confidence meets threshold (e.g., >= 0.80),
4. location is either manually verified or from trusted geocode source.

### `partially-map-ready`
An event is **partially-map-ready** when:
- city/county/state exist, but coordinates are missing, **or**
- coordinates exist but confidence is below threshold, **or**
- coordinates exist but not yet verification-reviewed.

### `not-map-ready`
An event is **not-map-ready** when:
- missing core location context (state and city/county), **and**
- no usable coordinates.

---

## 6) Lightweight geocode workflow design

### A) Manual entry (MVP first)
Admin enters or corrects lat/lng directly on event detail, plus:
- `location_source` (manual)
- `location_confidence` (admin-scored)
- `location_notes` (free text)
- `location_verified_at/by` (audit metadata)

Manual first is recommended because it is deterministic and low-risk.

### B) Future batch geocode (deferred)
Batch job candidates:
- records with missing coordinates,
- records with low confidence,
- records updated since last geocode pass.

Input composition order:
1. venue + city + state
2. name + city + state
3. county centroid fallback (if still unresolved; flagged as coarse)

### C) Confidence tracking model
Use a simple 3-tier confidence band:
- **High (0.85–1.00):** precise venue-level hit or manual verified.
- **Medium (0.60–0.84):** plausible locality-level hit.
- **Low (<0.60):** weak match; requires admin review.

Any coarse fallback (e.g., county centroid) should be explicitly marked non-pin-precise.

---

## 7) Minimum fields needed by map product type

### A) Map pins (event points)
Minimum:
- event id
- event name
- latitude
- longitude
- city
- county
- state
- map readiness status
- location confidence

### B) County density maps
Minimum:
- event id
- county
- state
- map readiness status (or at least county-valid status)

Notes:
- Can run without precise coordinates if county is complete and normalized.
- Coordinate-backed county assignment is better long term.

### C) Attendance heat maps
Minimum:
- event id
- latitude
- longitude (or county key for county-level choropleth)
- attendance estimate
- attendance estimate confidence
- attendance estimate source
- time period marker (year/season)

---

## 8) Phased rollout plan

## Phase 1 — Map pins
**Objective:** show canonical public events on Michigan map.

Scope:
- adopt readiness definitions and queue operations
- complete manual coordinate workflow
- publish only `map-ready` events

Success metrics:
- % of promoted canonical events map-ready
- median days from promotion to map-ready

## Phase 2 — Density maps
**Objective:** provide event-density visualization by county (and later grid).

Scope:
- enforce county normalization QA in queue
- compute county counts from map-ready + county-valid events
- publish county choropleth and trend snapshots

Success metrics:
- % canonical events with valid county
- density map coverage of Michigan counties

## Phase 3 — Attendance heat maps
**Objective:** add weighted demand/intensity layer.

Scope:
- introduce attendance estimate collection workflow
- add confidence/source governance
- render weighted heat map with confidence-aware filters

Success metrics:
- % map-ready events with attendance estimate
- % attendance-weighted points above confidence threshold

---

## 9) Guardrails / non-goals for this artifact

- No schema migration in this step.
- No application code changes in this step.
- No geocoder provider commitment in this step.
- No automated promotion changes in this step.

---

## 10) Implementation checklist for the next execution PR (reference)

1. Add schema fields for coordinates and location confidence metadata.
2. Add admin Map Readiness Queue page + detail editor actions.
3. Add API endpoints for manual coordinate updates with audit metadata.
4. Add map API response filtering to `map-ready` only.
5. Add county completeness/reporting query.
6. Plan optional PostGIS introduction only after baseline usage metrics.

