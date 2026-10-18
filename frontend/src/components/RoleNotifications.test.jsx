import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';
import { fileURLToPath } from 'url';

const api = {
  confirmPickup: jest.fn(),
  denyPickup: jest.fn(),
  getAvailableParcels: jest.fn(),
  getMyOrders: jest.fn(),
  requestPickup: jest.fn(),
};
const messageApi = { getMessageThreads: jest.fn() };

jest.unstable_mockModule(fileURLToPath(new URL('../api/orderApi.js', import.meta.url)), () => api);
jest.unstable_mockModule(fileURLToPath(new URL('../api/messageApi.js', import.meta.url)), () => messageApi);
jest.unstable_mockModule(fileURLToPath(new URL('../utils/localSession.js', import.meta.url)), () => ({
  isLocalDemoSession: () => false,
}));

const { MemoryRouter } = await import('react-router-dom');
const { default: SellerOrderIcon } = await import('./SellerOrderIcon.jsx');
const { default: DeliveryIcon } = await import('./DeliveryIcon.jsx');
const { default: HelpChatIcon } = await import('./HelpChatIcon.jsx');
const { AuthContext } = await import('../context/AuthContext');

describe('seller and courier header notifications', () => {
  beforeEach(() => {
    Object.values(api).forEach((mock) => mock.mockReset());
    messageApi.getMessageThreads.mockReset().mockResolvedValue([]);
    api.confirmPickup.mockResolvedValue({});
    api.denyPickup.mockResolvedValue({});
    api.requestPickup.mockResolvedValue({});
    api.getAvailableParcels.mockResolvedValue([]);
    api.getMyOrders.mockResolvedValue([]);
  });

  test('seller sees new order alerts and opens the Orders section from the panel', async () => {
    api.getMyOrders.mockResolvedValue([
      { id: 70, status: 'placed', shipmentId: 170, items: [{ name: 'Dress' }] },
      { id: 71, status: 'processing', shipmentId: 171, items: [{ name: 'Shoes' }] },
    ]);

    render(<MemoryRouter><SellerOrderIcon /></MemoryRouter>);
    const bell = await screen.findByRole('button', { name: /2 orders to pack or release/ });
    fireEvent.click(bell);

    expect(await screen.findByText('2 parcels to pack and release')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '2 parcels to pack and release Open the dashboard →' })).toHaveAttribute('href', '/seller/dashboard?section=Orders');
  });

  // Unread customer messages are counted beside the shop's chat button — the one place —
  // so the order bell does not announce the same message a second time.
  test('seller sees unread customer messages on the chat button, which opens Messages', async () => {
    messageApi.getMessageThreads.mockResolvedValue([{
      store_id: 9,
      customer_id: 12,
      customer_name: 'Ama',
      last_message: 'Do you have this in medium?',
      last_sender_role: 'customer',
      unread_count: 1,
    }]);

    render(
      <MemoryRouter>
        <AuthContext.Provider value={{ user: { role: 'seller', email: 's@example.com' }, loading: false }}>
          <HelpChatIcon user={{ role: 'seller' }} />
        </AuthContext.Provider>
      </MemoryRouter>,
    );

    const chat = await screen.findByRole('link', { name: '1 unread message from customers' });
    expect(chat).toHaveAttribute('href', '/seller/dashboard?section=Messages');
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  test('the order bell does not repeat customer messages', async () => {
    messageApi.getMessageThreads.mockResolvedValue([{
      store_id: 9, customer_id: 12, customer_name: 'Ama', last_message: 'Medium?', last_sender_role: 'customer', unread_count: 1,
    }]);

    render(<MemoryRouter><SellerOrderIcon /></MemoryRouter>);
    await waitFor(() => expect(api.getMyOrders).toHaveBeenCalled());
    expect(screen.queryByText(/customer message/i)).not.toBeInTheDocument();
  });

  test('courier can request pickup and open delivery details after handover', async () => {
    api.getAvailableParcels.mockResolvedValue([
      { id: 80, shipmentId: 180, storeName: 'Mud', status: 'shipped', assignedToMe: true },
    ]);
    api.getMyOrders.mockResolvedValue([
      { id: 81, shipmentId: 181, storeName: 'Jets', status: 'pickup_requested' },
      { id: 82, shipmentId: 182, storeName: 'Bata', status: 'picked_up' },
    ]);

    render(<MemoryRouter><DeliveryIcon /></MemoryRouter>);
    const bell = await screen.findByRole('button', { name: /3 courier updates/ });
    fireEvent.click(bell);

    expect(screen.getByText('Waiting for Jets to confirm pickup.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Request pickup' }));
    await waitFor(() => expect(api.requestPickup).toHaveBeenCalledWith(180));

    expect(screen.getByRole('link', { name: 'Open delivery details' })).toHaveAttribute('href', '/courier/dashboard?section=Deliveries');
    expect(screen.queryByRole('button', { name: 'Mark delivered' })).not.toBeInTheDocument();
    expect(screen.queryByText(/Deliver to/)).not.toBeInTheDocument();
  });
});
