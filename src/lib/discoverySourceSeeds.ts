export type SourceCategory =
  | 'county_fairs'
  | 'tourism_boards'
  | 'chambers_of_commerce'
  | 'festival_directories'
  | 'city_event_pages'
  | 'state_fair_associations';

export interface DiscoverySeedSourceDefinition {
  source_name: string;
  source_url: string;
  source_type: 'fair_association' | 'tourism_board' | 'chamber_of_commerce' | 'festival_directory' | 'city_events' | 'industry_association';
  category: SourceCategory;
  region: string;
  state: 'Michigan';
  priority: 'high' | 'medium' | 'low';
  trust_score: number;
  ingestion_target: {
    listing_hint: string;
    extraction_strategy: 'calendar_index' | 'directory_page' | 'events_landing' | 'county_listing';
  };
  notes?: string;
}

export const michiganStatewideSeedSources: DiscoverySeedSourceDefinition[] = [
  {
    source_name: 'Michigan Festivals & Events Association Directory',
    source_url: 'https://mfea.org/festivals/',
    source_type: 'festival_directory',
    category: 'festival_directories',
    region: 'Michigan - statewide',
    state: 'Michigan',
    priority: 'high',
    trust_score: 0.92,
    ingestion_target: { listing_hint: 'Member festival pages and annual event listings', extraction_strategy: 'directory_page' },
  },
  {
    source_name: 'Michigan Association of Fairs & Exhibitions',
    source_url: 'https://michiganfairs.org/fairs/',
    source_type: 'fair_association',
    category: 'state_fair_associations',
    region: 'Michigan - statewide',
    state: 'Michigan',
    priority: 'high',
    trust_score: 0.95,
    ingestion_target: { listing_hint: 'County fair listing and member fair links', extraction_strategy: 'directory_page' },
  },
  {
    source_name: 'Pure Michigan Events',
    source_url: 'https://www.michigan.org/events',
    source_type: 'tourism_board',
    category: 'tourism_boards',
    region: 'Michigan - statewide',
    state: 'Michigan',
    priority: 'high',
    trust_score: 0.9,
    ingestion_target: { listing_hint: 'Statewide event calendar and regional filters', extraction_strategy: 'calendar_index' },
  },
  {
    source_name: 'Lansing Event Calendar',
    source_url: 'https://www.lansingmi.gov/calendar.aspx',
    source_type: 'city_events',
    category: 'city_event_pages',
    region: 'Lansing',
    state: 'Michigan',
    priority: 'medium',
    trust_score: 0.85,
    ingestion_target: { listing_hint: 'Official city calendar entries', extraction_strategy: 'events_landing' },
  },
  {
    source_name: 'Detroit Regional Chamber Events',
    source_url: 'https://www.detroitchamber.com/events/',
    source_type: 'chamber_of_commerce',
    category: 'chambers_of_commerce',
    region: 'Detroit Metro',
    state: 'Michigan',
    priority: 'medium',
    trust_score: 0.82,
    ingestion_target: { listing_hint: 'Chamber-hosted and partner events', extraction_strategy: 'calendar_index' },
  },
  {
    source_name: 'Allegan County Fair',
    source_url: 'https://www.allegancountyfair.com/',
    source_type: 'fair_association',
    category: 'county_fairs',
    region: 'Allegan County',
    state: 'Michigan',
    priority: 'high',
    trust_score: 0.9,
    ingestion_target: { listing_hint: 'County fair schedule and attractions', extraction_strategy: 'events_landing' },
  },
];
