import React from 'react';
import { render, screen } from '@testing-library/react';
import { jest } from '@jest/globals';
import { fileURLToPath } from 'url';

let currentUser;
jest.unstable_mockModule(fileURLToPath(new URL('../context/AuthContext.jsx', import.meta.url)), () => ({
  useAuth: () => ({ user: currentUser, loading: false }),
}));

const { MemoryRouter, Route, Routes } = await import('react-router-dom');
const { default: ProtectedRoute } = await import('./ProtectedRoute');

function renderSellerRoute() {
  return render(
    <MemoryRouter initialEntries={['/seller/dashboard']}>
      <Routes>
        <Route element={<ProtectedRoute role="seller" />}>
          <Route path="/seller/dashboard" element={<p>Seller dashboard</p>} />
        </Route>
        <Route path="/courier/dashboard" element={<p>Courier dashboard</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('seller dashboard role access', () => {
  test('allows a seller account', () => {
    currentUser = { role: 'seller' };
    renderSellerRoute();
    expect(screen.getByText('Seller dashboard')).toBeInTheDocument();
  });

  test('redirects a courier account to its own dashboard', () => {
    currentUser = { role: 'courier' };
    renderSellerRoute();
    expect(screen.getByText('Courier dashboard')).toBeInTheDocument();
    expect(screen.queryByText('Seller dashboard')).not.toBeInTheDocument();
  });
});