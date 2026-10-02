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

  test('seller sees customer messages and can open the Messages section', async () => {
    messageApi.getMessageThreads.mockResolvedValue([{
      store_id: 9,
      customer_id: 12,
      customer_name: 'Ama',
      last_message: 'Do you have this in medium?',
      last_sender_role: 'customer',
    }]);

    render(<MemoryRouter><SellerOrderIcon /></MemoryRouter>);
    fireEvent.click(await screen.findByRole('button', { name: /1 customer message/ }));

    expect(screen.getByText('New customer message · Ama')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /New customer message · Ama Do you have this in medium\? Reply in Messages/ })).toHaveAttribute('href', '/seller/dashboard?section=Messages');
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
