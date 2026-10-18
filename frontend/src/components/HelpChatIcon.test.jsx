import React from 'react';
import { render, screen } from '@testing-library/react';
import { jest } from '@jest/globals';
import { fileURLToPath } from 'url';

// Where the chat button goes, for each kind of account.

jest.unstable_mockModule(fileURLToPath(new URL('../api/messageApi.js', import.meta.url)), () => ({
  getMessageThreads: jest.fn(() => Promise.resolve([])),
}));

const { MemoryRouter } = await import('react-router-dom');
const { AuthContext } = await import('../context/AuthContext');
const { default: HelpChatIcon } = await import('./HelpChatIcon');

describe('help and chat navigation', () => {
  test.each([
    [{ role: 'customer' }, '/customer/dashboard?section=Messages', 'Chat with sellers'],
    [{ role: 'seller' }, '/seller/dashboard?section=Messages', 'Chat with customers'],
    [{ role: 'courier' }, '/contact', 'Contact Zamglam support'],
    [null, '/contact', 'Contact Zamglam support'],
  ])('routes %s to the right help destination', (user, destination, label) => {
    render(
      <MemoryRouter>
        <AuthContext.Provider value={{ user, loading: false }}>
          <HelpChatIcon user={user} />
        </AuthContext.Provider>
      </MemoryRouter>,
    );
    expect(screen.getByRole('link', { name: label })).toHaveAttribute('href', destination);
  });
});
