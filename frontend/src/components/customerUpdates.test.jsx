import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { jest } from '@jest/globals';
import { fileURLToPath } from 'url';

// The shopper's bell: a parcel moving, or a refund being decided, is news — once.

const url = (file) => fileURLToPath(new URL(file, import.meta.url));

let orders;
let refunds;
const getMyOrders = jest.fn(() => Promise.resolve(orders));
const getMyRefundRequests = jest.fn(() => Promise.resolve(refunds));

jest.unstable_mockModule(url('../api/orderApi.js'), () => ({ getMyOrders }));
jest.unstable_mockModule(url('../api/refundApi.js'), () => ({ getMyRefundRequests }));
jest.unstable_mockModule(url('../utils/localSession.js'), () => ({ isLocalDemoSession: () => false }));

const { MemoryRouter } = await import('react-router-dom');
const { AuthContext } = await import('../context/AuthContext');
const { default: CustomerUpdatesIcon } = await import('./CustomerUpdatesIcon');

const order = (status) => [{ id: 7, shipments: [{ id: 70, storeName: 'Mud', status }] }];

const showBell = () => render(
  <MemoryRouter>
    <AuthContext.Provider value={{ user: { role: 'customer', email: 'shopper@example.com' }, loading: false }}>
      <CustomerUpdatesIcon />
    </AuthContext.Provider>
  </MemoryRouter>,
);

beforeEach(() => {
  localStorage.clear();
  orders = order('placed');
  refunds = [];
  jest.clearAllMocks();
});

describe('The shopper\'s order bell', () => {
  test('the first look treats what is already there as history, not news', async () => {
    showBell();
    await waitFor(() => expect(getMyOrders).toHaveBeenCalled());
    expect(await screen.findByRole('button', { name: 'Order updates' })).toBeInTheDocument();
  });

  test('a parcel that has moved since it was last seen is an update', async () => {
    // Seen while it was being placed…
    localStorage.setItem('zamglam:seen-updates:shopper@example.com', JSON.stringify({ 'parcel:70': 'placed' }));
    // …and now it is out for delivery.
    orders = order('picked_up');
    showBell();

    expect(await screen.findByRole('button', { name: '1 order update' })).toBeInTheDocument();
  });

  test('opening the bell shows the update and stops counting it', async () => {
    localStorage.setItem('zamglam:seen-updates:shopper@example.com', JSON.stringify({ 'parcel:70': 'placed' }));
    orders = order('delivered');
    showBell();

    await userEvent.click(await screen.findByRole('button', { name: '1 order update' }));
    expect(screen.getByText('Order #7 · Mud')).toBeInTheDocument();
    expect(screen.getByText('Delivered')).toBeInTheDocument();
    expect(screen.getByText('Order #7 · Mud').closest('a')).toHaveAttribute('href', '/orders/7');

    // Seen now: remembered, so it is not news again next time.
    const seen = JSON.parse(localStorage.getItem('zamglam:seen-updates:shopper@example.com'));
    expect(seen['parcel:70']).toBe('delivered');
  });

  test('a decided refund is an update; one still under review is not', async () => {
    localStorage.setItem('zamglam:seen-updates:shopper@example.com', JSON.stringify({ 'parcel:70': 'placed' }));
    refunds = [
      { id: 3, order_id: 7, status: 'approved' },
      { id: 4, order_id: 8, status: 'admin_review' },
    ];
    showBell();

    await userEvent.click(await screen.findByRole('button', { name: '1 order update' }));
    expect(screen.getByText('Refund for order #7')).toBeInTheDocument();
    expect(screen.getByText('Approved')).toBeInTheDocument();
    expect(screen.queryByText('Refund for order #8')).not.toBeInTheDocument();
  });
});
