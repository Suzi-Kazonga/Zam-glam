import { fireEvent, render, screen } from '@testing-library/react';
import { jest } from '@jest/globals';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import Topbar from './Topbar';

const sections = ['Overview', 'Products', 'Orders', 'Messages', 'Analytics', 'Promotions', 'Store profile', 'Notifications', 'Reviews', 'Verification'];

function renderSellerTopbar(onNavigationSelect = jest.fn()) {
  localStorage.setItem('user', JSON.stringify({ name: 'Seller One', role: 'seller' }));
  return {
    onNavigationSelect,
    ...render(
      <MemoryRouter>
        <AuthProvider>
          <Topbar onSearch={() => {}} navigationItems={sections} activeNavigation="Overview" onNavigationSelect={onNavigationSelect} />
        </AuthProvider>
      </MemoryRouter>,
    ),
  };
}

describe('seller dashboard navigation', () => {
  beforeEach(() => localStorage.clear());

  test('opens the grouped menu and selects a dashboard section', async () => {
    const { onNavigationSelect } = renderSellerTopbar();
    const toggle = await screen.findByRole('button', { name: 'Open seller navigation' });

    fireEvent.click(toggle);

    const menu = screen.getByRole('navigation', { name: 'Seller dashboard navigation' });
    expect(menu).toHaveTextContent('Overview');
    expect(menu).toHaveTextContent('Products');
    expect(menu).toHaveTextContent('Analytics');
    expect(menu).toHaveTextContent('Store profile');
    fireEvent.click(screen.getByRole('button', { name: 'Analytics' }));

    expect(onNavigationSelect).toHaveBeenCalledWith('Analytics');
    expect(screen.queryByRole('navigation', { name: 'Seller dashboard navigation' })).not.toBeInTheDocument();
  });

  test('closes the seller menu on Escape', async () => {
    renderSellerTopbar();
    fireEvent.click(await screen.findByRole('button', { name: 'Open seller navigation' }));

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(screen.queryByRole('navigation', { name: 'Seller dashboard navigation' })).not.toBeInTheDocument();
  });
});
