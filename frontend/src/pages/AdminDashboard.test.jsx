import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { jest } from '@jest/globals';
import { fileURLToPath } from 'url';

const openSection = jest.fn();
const setQuery = jest.fn();
const setRoleFilter = jest.fn();
const useAdminConsoleController = jest.fn(() => ({
  active: 'Overview',
  error: '',
  live: {
    subscribers: { customers: 4, sellers: 2, couriers: 1, total: 7 },
    pending: { shops: 1, couriers: 1, total: 2 },
    activity: { orders: 9, products: 8, stores: 2, reviews: 3 },
  },
  openSection,
  query: '',
  roleFilter: 'all',
  setQuery,
  setRoleFilter,
  visible: [{ id: 20, role: 'seller', name: 'Shop Example', email: 'shop@example.test', detail: 'Lusaka' }],
}));

jest.unstable_mockModule(fileURLToPath(new URL('../hooks/useAdminConsoleController.js', import.meta.url)), () => ({
  default: useAdminConsoleController,
}));

jest.unstable_mockModule(fileURLToPath(new URL('../components/Topbar.jsx', import.meta.url)), () => ({
  default: ({ onSearch }) => <input aria-label="Search accounts" onChange={(event) => onSearch(event.target.value)} />,
}));

jest.unstable_mockModule(fileURLToPath(new URL('../components/SellerVerificationQueue.jsx', import.meta.url)), () => ({
  default: () => <p>Seller verification actions</p>,
}));
jest.unstable_mockModule(fileURLToPath(new URL('../components/ReportsQueue.jsx', import.meta.url)), () => ({
  default: () => <p>Report moderation actions</p>,
}));
jest.unstable_mockModule(fileURLToPath(new URL('../components/UnclaimedParcels.jsx', import.meta.url)), () => ({
  default: () => <p>Unclaimed delivery actions</p>,
}));

const { MemoryRouter } = await import('react-router-dom');
const { default: AdminDashboard } = await import('./AdminDashboard.jsx');
const { default: AdminApprovalsIcon } = await import('../components/AdminApprovalsIcon.jsx');

function renderHub() {
  return render(<MemoryRouter><AdminDashboard /></MemoryRouter>);
}

beforeEach(() => {
  openSection.mockClear();
  setQuery.mockClear();
  setRoleFilter.mockClear();
  useAdminConsoleController.mockReturnValue({
    active: 'Overview',
    error: '',
    live: {
      subscribers: { customers: 4, sellers: 2, couriers: 1, total: 7 },
      pending: { shops: 1, couriers: 1, total: 2 },
      activity: { orders: 9, products: 8, stores: 2, reviews: 3 },
    },
    openSection,
    query: '',
    roleFilter: 'all',
    setQuery,
    setRoleFilter,
    visible: [{ id: 20, role: 'seller', name: 'Shop Example', email: 'shop@example.test', detail: 'Lusaka' }],
  });
});

describe('admin console hub actions', () => {
  test('the approval summary opens verification', () => {
    renderHub();
    fireEvent.click(screen.getByRole('button', { name: /Awaiting approval/ }));
    expect(openSection).toHaveBeenCalledWith('Verification');
  });

  test('sidebar account and operational destinations are dispatched', () => {
    renderHub();
    fireEvent.click(screen.getByRole('button', { name: 'Sellers' }));
    fireEvent.click(screen.getByRole('button', { name: 'Attention' }));
    fireEvent.click(screen.getByRole('button', { name: 'Deliveries' }));
    expect(openSection.mock.calls).toEqual([['Sellers'], ['Attention'], ['Deliveries']]);
  });

  test('account filter and search delegate to the controller', () => {
    renderHub();
    fireEvent.change(screen.getByLabelText('Show'), { target: { value: 'seller' } });
    fireEvent.change(screen.getByLabelText('Search accounts'), { target: { value: 'shop' } });
    expect(setRoleFilter).toHaveBeenCalledWith('seller');
    expect(setQuery).toHaveBeenCalledWith('shop');
  });

  test('account rows expose the right group destination', () => {
    renderHub();
    expect(screen.getByRole('link', { name: 'Open' })).toHaveAttribute('href', '/admin/users/sellers');
  });

  test('attention view groups approval and report workflows', () => {
    useAdminConsoleController.mockReturnValue({
      active: 'Attention', error: '', live: {}, openSection, query: '', roleFilter: 'all', setQuery, setRoleFilter, visible: [],
    });
    renderHub();
    expect(screen.getByText('Seller verification actions')).toBeInTheDocument();
    expect(screen.getByText('Report moderation actions')).toBeInTheDocument();
  });

  test('header attention link opens the real Attention section', () => {
    localStorage.setItem('token', 'admin-local-session');
    render(<MemoryRouter><AdminApprovalsIcon /></MemoryRouter>);
    expect(screen.getByRole('link', { name: 'Nothing waiting' })).toHaveAttribute('href', '/admin/dashboard?section=Attention');
    localStorage.removeItem('token');
  });
});
