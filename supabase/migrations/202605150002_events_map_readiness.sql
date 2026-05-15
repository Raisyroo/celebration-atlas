-- Map-readiness fields for canonical events.
-- Non-destructive: add columns/constraints/index only; no backfill.

alter table public.events
  add column if not exists latitude double precision,
  add column if not exists longitude double precision,
  add column if not exists location_confidence numeric(3,2),
  add column if not exists location_source text,
  add column if not exists geocoded_at timestamptz,
  add column if not exists location_verified boolean not null default false;

alter table public.events
  add constraint events_latitude_range_check
    check (latitude is null or (latitude >= -90 and latitude <= 90));

alter table public.events
  add constraint events_longitude_range_check
    check (longitude is null or (longitude >= -180 and longitude <= 180));

alter table public.events
  add constraint events_location_confidence_range_check
    check (
      location_confidence is null
      or (location_confidence >= 0 and location_confidence <= 1)
    );

create index if not exists idx_events_map_coordinates
  on public.events (latitude, longitude)
  where latitude is not null and longitude is not null;
