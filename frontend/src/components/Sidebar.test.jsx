import { fireEvent, render, screen } from '@testing-library/react';
import { jest } from '@jest/globals';
import { MemoryRouter } from 'react-router-dom';
import Sidebar from './Sidebar';

describe('customer dashboard navigation', () => {
  test('shows shopping and account sections with working dashboard actions', () => {
    const onSelect = jest.fn();
    const items = ['Overview', 'Orders', 'Products', 'Messages', 'Cart', 'Collections', 'Profile', 'Wishlist'];

    render(
      <MemoryRouter>
        <Sidebar items={items} active="Overview" onSelect={onSelect} role="customer" />
      </MemoryRouter>,
    );

    expect(screen.getByText('Discover')).toBeInTheDocument();
    expect(screen.getByText('Account')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Products' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Orders' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Messages' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Products' }));

    expect(onSelect).toHaveBeenCalledWith('Products');
  });
});
