import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { jest } from '@jest/globals';
import { fileURLToPath } from 'url';

jest.unstable_mockModule(fileURLToPath(new URL('../context/AuthContext.jsx', import.meta.url)), () => ({
  useAuth: () => ({ user: { role: 'admin' } }),
}));

jest.unstable_mockModule(fileURLToPath(new URL('../api/adminApi.js', import.meta.url)), () => ({
  deleteAdminAccount: jest.fn(),
  editAdminAccount: jest.fn(),
  getPendingRegistrations: jest.fn().mockResolvedValue({ sellers: [], couriers: [] }),
  getAdminStats: jest.fn().mockResolvedValue({ grace_days: 30 }),
  getAdminUsers: jest.fn().mockResolvedValue([]),
  restoreAdminAccount: jest.fn(),
  reviewCourierApproval: jest.fn(),
}));

jest.unstable_mockModule(fileURLToPath(new URL('../api/reportApi.js', import.meta.url)), () => ({
  getReportSummary: jest.fn().mockResolvedValue([]),
  getReportsAgainst: jest.fn().mockResolvedValue([]),
  setAccountStatus: jest.fn(),
}));

const { MemoryRouter, Route, Routes, useLocation } = await import('react-router-dom');
const { default: AdminUsers } = await import('./AdminUsers.jsx');

function RouteSummary() {
  const location = useLocation();
  return <p>{`${location.pathname}${location.search}`}</p>;
}

function renderAdminUsers() {
  return render(
    <MemoryRouter initialEntries={['/admin/users/sellers']}>
      <Routes>
        <Route path="/admin/users/:role" element={<AdminUsers />} />
        <Route path="/admin/dashboard" element={<RouteSummary />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('admin account page navigation', () => {
  test.each([
    ['Overview', '/admin/dashboard'],
    ['Couriers', '/admin/users/couriers'],
    ['Attention', '/admin/dashboard?section=Attention'],
    ['Verification', '/admin/dashboard?section=Verification'],
    ['Reports', '/admin/dashboard?section=Reports'],
    ['Deliveries', '/admin/dashboard?section=Deliveries'],
  ])('%s opens its admin destination', (section, destination) => {
    renderAdminUsers();
    fireEvent.click(screen.getByRole('button', { name: section }));
    if (section === 'Couriers') {
      expect(screen.getByRole('heading', { name: 'Couriers' })).toBeInTheDocument();
    } else {
      expect(screen.getByText(destination)).toBeInTheDocument();
    }
  });
});
