import { locate, haversineKm, DEFAULT_PLACE } from '../../src/services/places.js';
import { zamglamCourier } from '../../src/services/courierProvider.js';

// What a delivery costs is worked out from where the shop is and where the customer is.
// These are the only pieces of that with no database behind them.
describe('Finding a place from a typed address', () => {
  test('a town is recognised by name', () => {
    const kitwe = locate('Kitwe');
    expect(kitwe.matched).toBe(true);
    expect(kitwe.name).toBe('kitwe');
  });

  test('case and surrounding words do not matter', () => {
    expect(locate('Plot 42, NORTHRISE, ndola').matched).toBe(true);
    expect(locate('  kabulonga  ').name).toBe('kabulonga');
  });

  test('a Lusaka neighbourhood is placed more precisely than the city centre', () => {
    const kabulonga = locate('Kabulonga');
    const centre = locate('Lusaka');
    expect(kabulonga.lat).not.toBe(centre.lat);
  });

  test('an address nobody recognises falls back to central Lusaka, and says so', () => {
    const unknown = locate('Somewhere on the moon');
    expect(unknown.matched).toBe(false);
    expect(unknown.lat).toBe(DEFAULT_PLACE.lat);
  });

  test('an empty address is treated the same way', () => {
    expect(locate('').matched).toBe(false);
    expect(locate(undefined).matched).toBe(false);
  });
});

describe('Measuring the distance between two places', () => {
  test('the same place is no distance at all', () => {
    expect(haversineKm(DEFAULT_PLACE, DEFAULT_PLACE)).toBe(0);
  });

  test('Lusaka to Kitwe is roughly the real distance', () => {
    const km = haversineKm(locate('Lusaka'), locate('Kitwe'));
    expect(km).toBeGreaterThan(250);
    expect(km).toBeLessThan(350);
  });

  test('it measures the same in both directions', () => {
    const there = haversineKm(locate('Lusaka'), locate('Ndola'));
    const back = haversineKm(locate('Ndola'), locate('Lusaka'));
    expect(there).toBeCloseTo(back, 6);
  });
});

describe('Pricing a delivery', () => {
  test('a longer trip costs more', async () => {
    const short = await zamglamCourier.quote({ origin: 'Lusaka', destination: 'Kabulonga' });
    const long = await zamglamCourier.quote({ origin: 'Lusaka', destination: 'Kitwe' });
    expect(long.price).toBeGreaterThan(short.price);
    expect(long.distance_km).toBeGreaterThan(short.distance_km);
  });

  test('even a delivery round the corner is charged for the trip', async () => {
    const quote = await zamglamCourier.quote({ origin: 'Lusaka', destination: 'Lusaka' });
    expect(quote.distance_km).toBeGreaterThanOrEqual(1.5);
    expect(quote.price).toBeGreaterThan(0);
  });

  test('a quote comes with an ETA and the courier\'s name', async () => {
    const quote = await zamglamCourier.quote({ origin: 'Lusaka', destination: 'Ndola' });
    expect(quote.eta).toMatch(/\d+-\d+ min/);
    expect(quote.provider).toBe('Zamglam Courier');
  });

  test('a quote built on an address nobody recognised is flagged as an estimate', async () => {
    const guessed = await zamglamCourier.quote({ origin: 'Lusaka', destination: 'Nowhere at all' });
    const measured = await zamglamCourier.quote({ origin: 'Lusaka', destination: 'Ndola' });
    expect(guessed.estimated).toBe(true);
    expect(measured.estimated).toBe(false);
  });

  test('the price is a rounded amount of money, not a long decimal', async () => {
    const quote = await zamglamCourier.quote({ origin: 'Kabulonga', destination: 'Matero' });
    expect(quote.price).toBe(Number(quote.price.toFixed(2)));
  });
});
