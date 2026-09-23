// Shop logos and storefront links for the seeded demo shops.
//
// Only the picture is looked up by name. The link to a storefront comes from the real
// store id (see api/storeApi.js getMyStore) — guessing it from the name sent every newly
// registered shop to somebody else’s page.

const storeLogos = [
  { match: ['mud'], src: '/logos/mud.png', background: 'bg-black', path: '/stores/1' },
  { match: ['jet'], src: '/logos/jet_logo.png', background: 'bg-black', path: '/stores/2' },
  { match: ['bata'], src: '/logos/bata_logo.png', background: 'bg-[#c8102e]', path: '/stores/3' },
  { match: ['pep'], src: '/logos/pep_logo.jfif', background: 'bg-[#1d4ed8]', path: '/stores/4' },
  { match: ['mr price', 'mrprice', 'mrp'], src: '/logos/mr_price_logo.png', background: 'bg-white', path: '/stores/5' },
  { match: ['fashion', 'galore'], src: '/logos/fashion_galore_logo.jfif', background: 'bg-[#cbb896]', path: '/stores/6' },
];

function normalizeName(name) {
  return String(name || '').toLowerCase();
}

function findStoreLogo(name) {
  const normalized = normalizeName(name);
  return storeLogos.find((entry) => entry.match.some((token) => normalized.includes(token))) || storeLogos[0];
}

export function getStoreLogo(name) {
  return findStoreLogo(name).src;
}

export function getStoreLogoTheme(name) {
  return findStoreLogo(name);
}

export function getStorefrontPath(name) {
  return findStoreLogo(name).path || '/products';
}

export function withStoreLogos(stores = []) {
  return stores.map((store) => ({
    ...store,
    logo_url: getStoreLogo(store.name),
  }));
}
