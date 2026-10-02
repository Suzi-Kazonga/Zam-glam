import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';
import { fileURLToPath } from 'url';

const login = jest.fn();
jest.unstable_mockModule(fileURLToPath(new URL('../context/AuthContext.jsx', import.meta.url)), () => ({
  useAuth: () => ({ login, user: null }),
}));
jest.unstable_mockModule(fileURLToPath(new URL('../context/CartContext.jsx', import.meta.url)), () => ({
  useCart: () => ({ getTotalItems: () => 0 }),
}));

const { MemoryRouter, Route, Routes, useLocation } = await import('react-router-dom');
const { default: LoginPage } = await import('./LoginPage.jsx');

function CurrentPath() {
  const location = useLocation();
  return <p>{location.pathname}</p>;
}

function renderLogin() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<CurrentPath />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('role-specific login page', () => {
  beforeEach(() => login.mockReset());

  test.each([
    ['Admin', 'admin', '/admin/dashboard'],
    ['Seller', 'seller', '/seller/dashboard'],
    ['Courier', 'courier', '/courier/dashboard'],
    ['Customer', 'customer', '/'],
  ])('%s selection authenticates for that role and routes to its home', async (label, role, path) => {
    login.mockResolvedValue({ user: { role } });
    renderLogin();

    expect(screen.getByRole('group', { name: 'Choose account type' })).toBeInTheDocument();
    const roleButton = screen.getByRole('button', { name: label });
    fireEvent.click(roleButton);
    expect(roleButton).toHaveAttribute('aria-pressed', 'true');

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: `${role}@zamglam.test` } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'correct-password' } });
    fireEvent.click(screen.getByRole('button', { name: `Sign in as ${role}` }));

    await waitFor(() => expect(login).toHaveBeenCalledWith(`${role}@zamglam.test`, 'correct-password', role));
    expect(await screen.findByText(path)).toBeInTheDocument();
  });
});
