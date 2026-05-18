export type AtlasEvent = {
  id: string;
  name: string;
  category: 'festival' | 'fair' | 'music';
  x: number;
  y: number;
  blurb: string;
};

export const ATLAS_EVENTS: AtlasEvent[] = [
  { id: 'romeo-peach', name: 'Romeo Peach Festival', category: 'festival', x: 83, y: 74, blurb: 'Peach-season celebration in Romeo with rides, parade, and hometown traditions.' },
  { id: 'armada-fair', name: 'Armada Fair', category: 'fair', x: 84, y: 72, blurb: 'Classic county-fair atmosphere with exhibits, midway lights, and grandstand nights.' },
  { id: 'tulip-time', name: 'Tulip Time', category: 'festival', x: 35, y: 64, blurb: 'Spring color and Dutch heritage festivities across Holland, Michigan.' },
  { id: 'national-cherry', name: 'National Cherry Festival', category: 'festival', x: 53, y: 37, blurb: 'Lakefront summer festival in Traverse City celebrating the cherry harvest.' },
  { id: 'electric-forest', name: 'Electric Forest', category: 'music', x: 39, y: 55, blurb: 'Immersive electronic and jam music experience in Rothbury.' },
  { id: 'mackinac-lilac', name: 'Mackinac Island Lilac Festival', category: 'festival', x: 57, y: 15, blurb: 'Fragrant lilac blooms and island elegance at the Straits.' },
  { id: 'detroit-jazz', name: 'Detroit Jazz Festival', category: 'music', x: 87, y: 79, blurb: 'Major Labor Day weekend jazz gathering in downtown Detroit.' },
];
