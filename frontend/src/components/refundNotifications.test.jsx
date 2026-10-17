import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { jest } from '@jest/globals';
import { fileURLToPath } from 'url';

// A refund case waiting on somebody is work, and work is announced. Before this, a case
// sat silent until a shop or an administrator happened to open the Refunds section.

const url = (file) => fileURLToPath(new URL(file, import.meta.url));

const getMyRefundRequests = jest.fn(() => Promise.resolve([
  { id: 1, order_id: 42, status: 'seller_review', reason: 'Wrong size delivered' },
  { id: 2, order_id: 43, status: 'approved', reason: 'Already decided' },
]));
const getAdminRefundRequests = jest.fn(() => Promise.resolve([
  { id: 3, order_id: 44, status: 'admin_review' },
  { id: 4, order_id: 45, status: 'seller_review' },
  { id: 5, order_id: 46, status: 'rejected' },
]));

jest.unstable_mockModule(url('../api/refundApi.js'), () => ({
  getMyRefundRequests,
  getAdminRefundRequests,
  getRefundForShipment: jest.fn(),
  createRefundRequest: jest.fn(),
  getRefundRequest: jest.fn(),
  sendRefundMessage: jest.fn(),
  submitRefundRecommendation: jest.fn(),
  decideRefundRequest: jest.fn(),
}));
jest.unstable_mockModule(url('../api/orderApi.js'), () => ({
  getMyOrders: jest.fn(() => Promise.resolve([])),
  confirmPickup: jest.fn(),
  denyPickup: jest.fn(),
}));
jest.unstable_mockModule(url('../api/messageApi.js'), () => ({
  getMessageThreads: jest.fn(() => Promise.resolve([])),
}));
jest.unstable_mockModule(url('../api/adminApi.js'), () => ({
  getPendingRegistrations: jest.fn(() => Promise.resolve({ shops: [], couriers: [], total: 0 })),
}));
jest.unstable_mockModule(url('../api/reportApi.js'), () => ({
  getReportSummary: jest.fn(() => Promise.resolve([])),
}));

const { MemoryRouter } = await import('react-router-dom');
const { default: SellerOrderIcon } = await import('./SellerOrderIcon');
const { default: AdminApprovalsIcon } = await import('./AdminApprovalsIcon');

const show = (ui) => render(<MemoryRouter>{ui}</MemoryRouter>);

describe('A shop with a refund case waiting', () => {
  test('is told, and only about the case that needs them', async () => {
    show(<SellerOrderIcon />);
    await waitFor(() => expect(getMyRefundRequests).toHaveBeenCalled());
    // One of the two is still waiting on the shop; the decided one is not counted.
    expect(await screen.findByText('1')).toBeInTheDocument();
  });

  test('can open the case from the notification', async () => {
    show(<SellerOrderIcon />);
    // The panel is closed until the bell is opened.
    await userEvent.click(await screen.findByRole('button'));
    const link = await screen.findByText(/refund request · order #42/i);
    expect(link.closest('a')).toHaveAttribute('href', '/seller/dashboard?section=Refunds');
  });
});

describe('An administrator with a refund case to decide', () => {
  test('counts only the ones waiting on a decision', async () => {
    show(<AdminApprovalsIcon />);
    await waitFor(() => expect(getAdminRefundRequests).toHaveBeenCalled());
    // Of the three, one is at admin_review; the others belong to the shop or are closed.
    expect(await screen.findByText('1')).toBeInTheDocument();
  });

  test('says so in the label', async () => {
    show(<AdminApprovalsIcon />);
    expect(await screen.findByLabelText(/1 refund case\(s\) to decide/i)).toBeInTheDocument();
  });
});
