import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import HelpChatIcon from './HelpChatIcon';

describe('help and chat navigation', () => {
  test.each([
    [{ role: 'customer' }, '/customer/dashboard?section=Messages', 'Chat with sellers'],
    [{ role: 'seller' }, '/seller/dashboard?section=Messages', 'Chat with customers'],
    [{ role: 'courier' }, '/contact', 'Contact Zamglam support'],
    [null, '/contact', 'Contact Zamglam support'],
  ])('routes %s to the right help destination', (user, destination, label) => {
    render(<MemoryRouter><HelpChatIcon user={user} /></MemoryRouter>);
    expect(screen.getByRole('link', { name: label })).toHaveAttribute('href', destination);
  });
});
