import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getAdminStats, getAdminUsers } from '../api/adminApi';
import { isLocalDemoSession } from '../utils/localSession';

const EMPTY_STATS = { subscribers: { customers: 0, sellers: 0, couriers: 0, admins: 0, total: 0 }, pending: { shops: 0, couriers: 0, total: 0 }, activity: { orders: 0, products: 0, stores: 0, reviews: 0 }, grace_days: 30 };
const HUB_SECTIONS = ['Overview', 'Sellers', 'Customers', 'Couriers', 'Attention', 'Verification', 'Reports', 'Deliveries'];
const SECTION_ROUTES = {
  Sellers: '/admin/users/sellers',
  Customers: '/admin/users/customers',
  Couriers: '/admin/users/couriers',
};

function sectionFromSearch(search) {
  const params = new URLSearchParams(search);
  const requested = params.get('section') || (params.get('tab') === 'approvals' ? 'Attention' : null);
  return HUB_SECTIONS.includes(requested) ? requested : 'Overview';
}

export default function useAdminConsoleController() {
  const navigate = useNavigate();
  const location = useLocation();
  const [live, setLive] = useState(EMPTY_STATS);
  const [recent, setRecent] = useState([]);
  const [active, setActive] = useState(() => sectionFromSearch(location.search));
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [error, setError] = useState('');

  useEffect(() => setActive(sectionFromSearch(location.search)), [location.search]);

  useEffect(() => {
    if (isLocalDemoSession()) return undefined;
    const load = () => getAdminStats().then(setLive).catch((failure) => {
      setError(failure?.error || 'Could not load admin summary.');
    });
    load();
    const poll = window.setInterval(load, 15000);
    return () => window.clearInterval(poll);
  }, []);

  useEffect(() => {
    if (isLocalDemoSession()) return;
    Promise.all([getAdminUsers('sellers'), getAdminUsers('customers'), getAdminUsers('couriers')])
      .then(([sellers, customers, couriers]) => {
        const merged = [
          ...sellers.map((seller) => ({ ...seller, role: 'seller', detail: [seller.store_name, seller.location].filter(Boolean).join(' · ') })),
          ...customers.map((customer) => ({ ...customer, role: 'customer', detail: customer.address || customer.location || '' })),
          ...couriers.map((courier) => ({ ...courier, role: 'courier', detail: Number(courier.on_shift) === 1 ? 'On duty' : 'Off duty' })),
        ];
        setRecent(merged);
      })
      .catch((failure) => setError(failure?.error || 'Could not load marketplace accounts.'));
  }, []);

  const visible = useMemo(() => {
    const needle = query.toLowerCase();
    return recent
      .filter((account) => roleFilter === 'all' || account.role === roleFilter)
      .filter((account) => `${account.name || ''} ${account.email || ''} ${account.phone || ''} ${account.detail || ''}`.toLowerCase().includes(needle))
      .sort((first, second) => new Date(second.created_at || 0) - new Date(first.created_at || 0));
  }, [recent, query, roleFilter]);

  const openSection = (section) => {
    if (SECTION_ROUTES[section]) {
      navigate(SECTION_ROUTES[section]);
      return;
    }
    if (!HUB_SECTIONS.includes(section)) return;
    setActive(section);
    navigate(section === 'Overview' ? '/admin/dashboard' : `/admin/dashboard?section=${encodeURIComponent(section)}`, { replace: true });
  };

  return { active, error, live, openSection, query, roleFilter, setQuery, setRoleFilter, visible };
}
