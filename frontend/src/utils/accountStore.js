const STORAGE_KEY = 'zamglam_managed_accounts';

const seedAccounts = [
  { id: 's-1', role: 'seller', name: 'Mud Fashion', email: 'mud@zamglam.local', phone: '+260 97 111 0001', shopName: 'Mud', location: 'Lusaka, Zambia', status: 'active', joinedAt: '2025-11-04', products: 42 },
  { id: 's-2', role: 'seller', name: 'Jets Apparel', email: 'jets@zamglam.local', phone: '+260 96 222 0002', shopName: 'Jets', location: 'Kitwe, Zambia', status: 'active', joinedAt: '2025-12-18', products: 36 },
  { id: 's-3', role: 'seller', name: 'Bata Zambia', email: 'bata@zamglam.local', phone: '+260 95 333 0003', shopName: 'Bata', location: 'Ndola, Zambia', status: 'active', joinedAt: '2026-01-09', products: 58 },
  { id: 's-4', role: 'seller', name: 'Pep Stores', email: 'pep@zamglam.local', phone: '+260 97 444 0004', shopName: 'Pep', location: 'Lusaka, Zambia', status: 'pending', joinedAt: '2026-07-21', products: 12 },
  { id: 's-5', role: 'seller', name: 'Mr Price Zambia', email: 'mrprice@zamglam.local', phone: '+260 96 555 0005', shopName: 'Mr Price Zambia', location: 'Lusaka, Zambia', status: 'active', joinedAt: '2026-02-14', products: 64 },
  { id: 's-6', role: 'seller', name: 'Fashions Galore', email: 'fashionsgalore@zamglam.local', phone: '+260 95 666 0006', shopName: 'Fashions Galore', location: 'Livingstone, Zambia', status: 'suspended', joinedAt: '2026-03-02', products: 21 },
  { id: 'c-1', role: 'customer', name: 'Chanda Banda', email: 'chanda.banda@email.com', phone: '+260 97 701 1101', address: 'Kabulonga, Lusaka', status: 'active', joinedAt: '2026-01-20', orders: 8 },
  { id: 'c-2', role: 'customer', name: 'Mwansa Tembo', email: 'mwansa.tembo@email.com', phone: '+260 96 702 2202', address: 'Nkana East, Kitwe', status: 'active', joinedAt: '2026-02-08', orders: 4 },
  { id: 'c-3', role: 'customer', name: 'Thandiwe Phiri', email: 'thandiwe.phiri@email.com', phone: '+260 95 703 3303', address: 'Northrise, Ndola', status: 'active', joinedAt: '2026-03-15', orders: 11 },
  { id: 'c-4', role: 'customer', name: 'Mutale Zulu', email: 'mutale.zulu@email.com', phone: '+260 97 704 4404', address: 'Roma, Lusaka', status: 'suspended', joinedAt: '2026-04-03', orders: 2 },
  { id: 'c-5', role: 'customer', name: 'Natasha Mulenga', email: 'natasha.mulenga@email.com', phone: '+260 96 705 5505', address: 'Parklands, Kitwe', status: 'active', joinedAt: '2026-05-19', orders: 6 },
  { id: 'c-6', role: 'customer', name: 'Joseph Mwila', email: 'joseph.mwila@email.com', phone: '+260 95 706 6606', address: 'Woodlands, Lusaka', status: 'pending', joinedAt: '2026-08-11', orders: 0 },
];

function readAccounts() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seedAccounts));
      return seedAccounts.map((account) => ({ ...account }));
    }
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : seedAccounts.map((account) => ({ ...account }));
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return seedAccounts.map((account) => ({ ...account }));
  }
}

function writeAccounts(accounts) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
  return accounts;
}

export function getAccounts() {
  return readAccounts();
}

export function getAccountsByRole(role) {
  return readAccounts().filter((account) => account.role === role);
}

export function createAccount(payload) {
  const accounts = readAccounts();
  const account = {
    ...payload,
    id: `${payload.role === 'seller' ? 's' : 'c'}-${Date.now()}`,
    joinedAt: new Date().toISOString().slice(0, 10),
    products: payload.role === 'seller' ? Number(payload.products || 0) : undefined,
    orders: payload.role === 'customer' ? Number(payload.orders || 0) : undefined,
  };
  return writeAccounts([account, ...accounts]);
}

export function updateAccount(id, updates) {
  const accounts = readAccounts().map((account) => (
    account.id === id ? { ...account, ...updates, id: account.id, role: account.role } : account
  ));
  return writeAccounts(accounts);
}

export function deleteAccount(id) {
  return writeAccounts(readAccounts().filter((account) => account.id !== id));
}

export function getAccountStats(accounts = readAccounts()) {
  const sellers = accounts.filter((account) => account.role === 'seller');
  const customers = accounts.filter((account) => account.role === 'customer');
  return {
    sellers: sellers.length,
    customers: customers.length,
    active: accounts.filter((account) => account.status === 'active').length,
    suspended: accounts.filter((account) => account.status === 'suspended').length,
    pending: accounts.filter((account) => account.status === 'pending').length,
  };
}
