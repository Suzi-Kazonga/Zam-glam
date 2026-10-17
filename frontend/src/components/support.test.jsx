import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { jest } from '@jest/globals';
import { fileURLToPath } from 'url';

// Reporting a problem to the administrators, and the queue they clear it from.

const reportProblem = jest.fn(() => Promise.resolve({ id: 1, status: 'open' }));
const getProblems = jest.fn(() => Promise.resolve({
  reports: [
    { id: 7, reporter_role: 'courier', reporter_name: 'Mwansa Phiri', reporter_email: 'mwansa@zamglamcourier.local', message: 'The parcel list does not refresh.', status: 'open', created_at: '2026-10-16T09:00:00Z' },
    { id: 8, reporter_role: 'seller', reporter_name: 'Mud', reporter_email: 'mud@zamglam.local', message: 'A fourth photograph fails.', status: 'open', created_at: '2026-10-16T08:00:00Z' },
  ],
  open: 2,
}));
const getMyProblems = jest.fn(() => Promise.resolve([]));
const markProblemDone = jest.fn(() => Promise.resolve({ id: 7, status: 'done', open: 1 }));

// Jest resolves a mocked path from its setup file rather than from here, so name it in full.
jest.unstable_mockModule(fileURLToPath(new URL('../api/supportApi.js', import.meta.url)), () => ({
  reportProblem,
  getProblems,
  getMyProblems,
  markProblemDone,
  getOpenProblemCount: jest.fn(() => Promise.resolve(2)),
  reopenProblem: jest.fn(),
}));

const { MemoryRouter } = await import('react-router-dom');
const { default: ReportProblemButton } = await import('./ReportProblemButton');
const { default: CustomerServicePanel } = await import('./CustomerServicePanel');
const { AuthContext } = await import('../context/AuthContext');

// A signed-in account of whichever kind the test needs.
const asRole = (role, ui) => render(
  <MemoryRouter>
    <AuthContext.Provider value={{ user: role ? { name: 'Test', email: 't@example.com', role } : null, loading: false, login: jest.fn(), register: jest.fn(), logout: jest.fn() }}>
      {ui}
    </AuthContext.Provider>
  </MemoryRouter>,
);

beforeEach(() => {
  reportProblem.mockClear();
  markProblemDone.mockClear();
});

describe('The report a problem button', () => {
  test.each(['customer', 'seller', 'courier'])('is offered to a %s', (role) => {
    asRole(role, <ReportProblemButton />);
    expect(screen.getByRole('button', { name: /report a problem/i })).toBeInTheDocument();
  });

  test('is not offered to an administrator — they receive these', () => {
    asRole('admin', <ReportProblemButton />);
    expect(screen.queryByRole('button', { name: /report a problem/i })).not.toBeInTheDocument();
  });

  test('is not offered to somebody signed out', () => {
    asRole(null, <ReportProblemButton />);
    expect(screen.queryByRole('button', { name: /report a problem/i })).not.toBeInTheDocument();
  });

  test('sends what was typed, and says it went to the administrators', async () => {
    asRole('courier', <ReportProblemButton />);
    await userEvent.click(screen.getByRole('button', { name: /report a problem/i }));
    await userEvent.type(screen.getByRole('textbox'), 'The parcel list does not refresh.');
    await userEvent.click(screen.getByRole('button', { name: /send to the administrators/i }));

    await waitFor(() => expect(reportProblem).toHaveBeenCalledWith('The parcel list does not refresh.'));
    expect(await screen.findByText(/an administrator will see this/i)).toBeInTheDocument();
  });

  test('an empty message is not sent', async () => {
    asRole('customer', <ReportProblemButton />);
    await userEvent.click(screen.getByRole('button', { name: /report a problem/i }));
    await userEvent.click(screen.getByRole('button', { name: /send to the administrators/i }));

    expect(await screen.findByText(/describe the problem/i)).toBeInTheDocument();
    expect(reportProblem).not.toHaveBeenCalled();
  });

  test('the box says which kind of account is reporting', async () => {
    asRole('seller', <ReportProblemButton />);
    await userEvent.click(screen.getByRole('button', { name: /report a problem/i }));
    expect(screen.getByText(/you are a seller/i)).toBeInTheDocument();
  });
});

describe('The administrator\'s customer service queue', () => {
  test('lists every reported problem with the reporter and their role', async () => {
    asRole('admin', <CustomerServicePanel />);

    expect(await screen.findByText('The parcel list does not refresh.')).toBeInTheDocument();
    expect(screen.getByText('A fourth photograph fails.')).toBeInTheDocument();
    expect(screen.getByText('courier')).toBeInTheDocument();
    expect(screen.getByText('seller')).toBeInTheDocument();
    expect(screen.getByText('Mwansa Phiri')).toBeInTheDocument();
  });

  test('says how many are waiting', async () => {
    asRole('admin', <CustomerServicePanel />);
    expect(await screen.findByText(/2 problems waiting/i)).toBeInTheDocument();
  });

  test('marking one done clears it and reports the new count', async () => {
    const onCountChange = jest.fn();
    asRole('admin', <CustomerServicePanel onCountChange={onCountChange} />);

    const [first] = await screen.findAllByRole('button', { name: /mark done/i });
    await userEvent.click(first);

    await waitFor(() => expect(markProblemDone).toHaveBeenCalledWith(7));
    await waitFor(() => expect(onCountChange).toHaveBeenCalledWith(1));
  });

  test('a shopper sees only their own reports, and no way to clear them', async () => {
    asRole('customer', <CustomerServicePanel />);
    await waitFor(() => expect(getMyProblems).toHaveBeenCalled());
    expect(screen.queryByRole('button', { name: /mark done/i })).not.toBeInTheDocument();
  });
});
