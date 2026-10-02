import React from 'react';
import { render, screen } from '@testing-library/react';
import { jest } from '@jest/globals';
import { fileURLToPath } from 'url';

const getMessageThreads = jest.fn();
jest.unstable_mockModule(fileURLToPath(new URL('../api/messageApi.js', import.meta.url)), () => ({ getMessageThreads }));
jest.unstable_mockModule(fileURLToPath(new URL('../utils/localSession.js', import.meta.url)), () => ({ isLocalDemoSession: () => false }));

const { MemoryRouter } = await import('react-router-dom');
const { default: CustomerMessagesIcon } = await import('./CustomerMessagesIcon.jsx');

describe('customer seller-reply notification', () => {
  beforeEach(() => {
    getMessageThreads.mockReset().mockResolvedValue([
      { store_id: 12, store_name: 'Mud', last_sender_role: 'seller', last_message: 'Yes, it is available.' },
    ]);
  });

  test('shows a seller reply badge linked to the customer inbox', async () => {
    render(<MemoryRouter><CustomerMessagesIcon /></MemoryRouter>);
    const link = await screen.findByRole('link', { name: '1 seller reply waiting' });
    expect(link).toHaveAttribute('href', '/customer/dashboard?section=Messages');
    expect(screen.getByText('1')).toBeInTheDocument();
  });
});
