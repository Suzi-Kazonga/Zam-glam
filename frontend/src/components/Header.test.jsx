import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { CartProvider } from '../context/CartContext';
import Header from './Header';

function renderHeader() {
  return render(
    <MemoryRouter initialEntries={['/products']}>
      <AuthProvider>
        <CartProvider>
          <Header />
        </CartProvider>
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe('signed-out header account menu', () => {
  beforeEach(() => localStorage.clear());

  test('opens login and sign-up choices from the account icon', async () => {
    renderHeader();

    const accountButton = await screen.findByRole('button', { name: 'Account options' });
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();

    fireEvent.click(accountButton);

    expect(screen.getByRole('menuitem', { name: 'Log in' })).toHaveAttribute('href', '/login');
    expect(screen.getByRole('menuitem', { name: 'Sign up' })).toHaveAttribute('href', '/signup');
  });

  test('closes the menu on Escape', async () => {
    renderHeader();
    fireEvent.click(await screen.findByRole('button', { name: 'Account options' }));
    expect(screen.getByRole('menu')).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });
});

describe('customer header navigation', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('user', JSON.stringify({ name: 'Customer One', role: 'customer' }));
  });

  test('shows a white header and puts dashboard and collections in the menu', async () => {
    renderHeader();

    const header = await screen.findByRole('banner');
    expect(header).toHaveClass('bg-white');
    expect(screen.queryByText('Customer', { exact: true })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open navigation menu' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Open navigation menu' }));

    const menu = screen.getByRole('navigation', { name: 'Customer and shopping navigation' });
    expect(menu).toHaveTextContent('Dashboard');
    expect(menu).toHaveTextContent('Collections');
  });
});
