// Coarse coordinates for Zambian towns and Lusaka neighbourhoods.
//
// Addresses in this system are free text ("Kabulonga, Lusaka"), and there is no geocoding
// service wired up. Matching that text against this table gives a real distance between
// two places instead of inventing one, which is enough to price a delivery sensibly.
// A proper geocoder (or a courier provider that does its own routing) would replace this.
const PLACES = [
  // Lusaka and its areas
  { match: ['kabulonga'], lat: -15.4167, lng: 28.3333 },
  { match: ['woodlands'], lat: -15.4333, lng: 28.3000 },
  { match: ['chelston'], lat: -15.3833, lng: 28.4000 },
  { match: ['matero'], lat: -15.3833, lng: 28.2667 },
  { match: ['chilenje'], lat: -15.4333, lng: 28.3167 },
  { match: ['kalingalinga'], lat: -15.4000, lng: 28.3500 },
  { match: ['libala'], lat: -15.4500, lng: 28.3000 },
  { match: ['roma'], lat: -15.3667, lng: 28.3167 },
  { match: ['avondale'], lat: -15.3833, lng: 28.3667 },
  { match: ['great east'], lat: -15.3900, lng: 28.3600 },
  { match: ['kafue road', 'kafue rd'], lat: -15.4600, lng: 28.2700 },
  { match: ['lusaka', 'cbd'], lat: -15.3875, lng: 28.3228 },

  // Other towns
  { match: ['kitwe'], lat: -12.8024, lng: 28.2132 },
  { match: ['ndola'], lat: -12.9587, lng: 28.6366 },
  { match: ['livingstone'], lat: -17.8419, lng: 25.8544 },
  { match: ['kabwe'], lat: -14.4469, lng: 28.4464 },
  { match: ['chingola'], lat: -12.5289, lng: 27.8494 },
  { match: ['mufulira'], lat: -12.5500, lng: 28.2400 },
  { match: ['luanshya'], lat: -13.1367, lng: 28.4166 },
  { match: ['chipata'], lat: -13.6333, lng: 32.6500 },
  { match: ['solwezi'], lat: -12.1686, lng: 26.3844 },
  { match: ['mongu'], lat: -15.2543, lng: 23.1275 },
  { match: ['kasama'], lat: -10.2129, lng: 31.1808 },
  { match: ['choma'], lat: -16.8000, lng: 26.9833 },
];

// Default when nothing matches: central Lusaka, where most of the marketplace operates.
export const DEFAULT_PLACE = { lat: -15.3875, lng: 28.3228, name: 'Lusaka' };

export function locate(text) {
  const normalized = String(text || '').toLowerCase();
  if (!normalized.trim()) return { ...DEFAULT_PLACE, matched: false };

  const hit = PLACES.find((place) => place.match.some((token) => normalized.includes(token)));
  return hit
    ? { lat: hit.lat, lng: hit.lng, name: hit.match[0], matched: true }
    : { ...DEFAULT_PLACE, matched: false };
}

// Straight-line distance in kilometres.
export function haversineKm(from, to) {
  const toRad = (value) => (value * Math.PI) / 180;
  const dLat = toRad(to.lat - from.lat);
  const dLng = toRad(to.lng - from.lng);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(toRad(from.lat)) * Math.cos(toRad(to.lat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(a));
}
