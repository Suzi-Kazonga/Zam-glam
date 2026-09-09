import { locate, haversineKm } from './places.js';

/**
 * Courier providers.
 *
 * Every delivery quote in the system goes through one of these, so the rest of the code
 * never knows which company is carrying the parcel. A provider takes a pickup and a
 * dropoff and answers with a distance, a price and an ETA:
 *
 *   quote({ origin, destination }) -> { distance_km, price, eta, provider, driver_name? }
 *
 * Three implementations live here:
 *
 *   - `zamglamCourier` (default): our own riders. Distance comes from matching the
 *     free-text address against services/places.js and measuring between the two points.
 *   - `httpCourier`: any provider exposing a quote endpoint, including the bundled
 *     courier-service/ Flask app. Enabled by setting COURIER_SERVICE_URL.
 *   - `yangoCourier`: **not implemented**. Yango's delivery API is a commercial B2B
 *     integration — it needs a registered business, an agreement and issued credentials,
 *     which this project does not have. The adapter below documents exactly what such an
 *     integration has to return; filling in the request/response mapping is all that
 *     would be needed once credentials exist. It is never selected unless both
 *     YANGO_API_URL and YANGO_API_KEY are set, so the platform runs on its own couriers.
 */

const BASE_PRICE = Number(process.env.DELIVERY_BASE_PRICE) || 20; // ZMW
const PRICE_PER_KM = Number(process.env.DELIVERY_PRICE_PER_KM) || 5; // ZMW/km
const MIN_DISTANCE_KM = 1.5; // even a short hop costs a rider a trip

function priceFor(distanceKm) {
  return Number((BASE_PRICE + distanceKm * PRICE_PER_KM).toFixed(2));
}

function etaFor(distanceKm) {
  const low = Math.max(20, Math.ceil(distanceKm * 4));
  const high = Math.max(35, Math.ceil(distanceKm * 6));
  return `${low}-${high} min`;
}

// Our own riders: measure between the two places we can identify.
export const zamglamCourier = {
  name: 'Zamglam Courier',
  async quote({ origin, destination }) {
    const from = locate(origin);
    const to = locate(destination);
    const distanceKm = Math.max(MIN_DISTANCE_KM, haversineKm(from, to));

    return {
      provider: this.name,
      distance_km: Number(distanceKm.toFixed(1)),
      price: priceFor(distanceKm),
      eta: etaFor(distanceKm),
      // Flagged so callers know the addresses were not recognised and the distance is a
      // default rather than a measurement.
      estimated: !from.matched || !to.matched,
    };
  },
};

// Any courier exposing a JSON quote endpoint — the bundled Flask service speaks this, and
// so would most third-party APIs behind a thin mapping.
export const httpCourier = (baseUrl) => ({
  name: process.env.COURIER_SERVICE_NAME || 'Courier service',
  async quote({ origin, destination }) {
    const from = locate(origin);
    const to = locate(destination);

    const response = await fetch(`${baseUrl.replace(/\/$/, '')}/api/courier/quote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pickup: { lat: from.lat, lng: from.lng }, dropoff: { lat: to.lat, lng: to.lng } }),
      signal: AbortSignal.timeout(Number(process.env.COURIER_SERVICE_TIMEOUT_MS) || 2500),
    });
    if (!response.ok) throw new Error(`Courier service returned ${response.status}`);

    const data = await response.json();
    return {
      provider: data.provider || this.name,
      distance_km: Number(data.distance_km),
      price: Number(data.total_price ?? data.price),
      eta: data.eta || etaFor(Number(data.distance_km) || MIN_DISTANCE_KM),
      estimated: !from.matched || !to.matched,
    };
  },
});

// Placeholder for a commercial integration. See the note at the top of this file: this is
// deliberately not implemented, because it cannot be without issued credentials.
export const yangoCourier = () => ({
  name: 'Yango',
  async quote() {
    throw new Error('Yango integration is not implemented — no commercial credentials for this project');
  },
});

// Which provider is in use. Falls back to our own riders whenever a configured provider
// is unavailable, so a courier outage can never stop someone checking out.
export function getCourierProvider() {
  if (process.env.YANGO_API_URL && process.env.YANGO_API_KEY) return yangoCourier();
  if (process.env.COURIER_SERVICE_URL) return httpCourier(process.env.COURIER_SERVICE_URL);
  return zamglamCourier;
}

export async function quoteDelivery({ origin, destination }) {
  const provider = getCourierProvider();
  try {
    return await provider.quote({ origin, destination });
  } catch (error) {
    if (provider !== zamglamCourier) {
      console.warn(`Courier provider "${provider.name}" failed (${error.message}); using Zamglam Courier.`);
      return zamglamCourier.quote({ origin, destination });
    }
    throw error;
  }
}
