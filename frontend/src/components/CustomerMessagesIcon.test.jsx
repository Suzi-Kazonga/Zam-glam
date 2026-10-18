import React from 'react';
import { render, screen } from '@testing-library/react';
import { jest } from '@jest/globals';
import { fileURLToPath } from 'url';

// The shopper's chat button counts unread messages, across every conversation.

const getMessageThreads = jest.fn();
jest.unstable_mockModule(fileURLToPath(new URL('../api/messageApi.js', import.meta.url)), () => ({ getMessageThreads }));
jest.unstable_mockModule(fileURLToPath(new URL('../utils/localSession.js', import.meta.url)), () => ({ isLocalDemoSession: () => false }));

const { MemoryRouter } = await import('react-router-dom');
const { AuthContext } = await import('../context/AuthContext');
const { default: CustomerMessagesIcon } = await import('./CustomerMessagesIcon.jsx');

const asCustomer = (ui) => render(
  <MemoryRouter>
    <AuthContext.Provider value={{ user: { role: 'customer', email: 'c@example.com' }, loading: false }}>{ui}</AuthContext.Provider>
  </MemoryRouter>,
);

describe('the shopper\'s chat button', () => {
  beforeEach(() => {
    getMessageThreads.mockReset().mockResolvedValue([
      { store_id: 12, store_name: 'Mud', last_sender_role: 'seller', last_message: 'Yes, it is available.', unread_count: 2 },
      { store_id: 13, store_name: 'Jets', last_sender_role: 'seller', last_message: 'On its way.', unread_count: 1 },
      { store_id: 14, store_name: 'Bata', last_sender_role: 'customer', last_message: 'Thanks', unread_count: 0 },
    ]);
  });

  test('carries the number of unread messages, and opens the inbox', async () => {
    asCustomer(<CustomerMessagesIcon />);
    const link = await screen.findByRole('link', { name: '3 unread messages' });
    expect(link).toHaveAttribute('href', '/customer/dashboard?section=Messages');
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  test('shows no number when everything has been read', async () => {
    getMessageThreads.mockResolvedValue([{ store_id: 14, store_name: 'Bata', unread_count: 0 }]);
    asCustomer(<CustomerMessagesIcon />);
    expect(await screen.findByRole('link', { name: 'Messages with shops' })).toBeInTheDocument();
  });
});
