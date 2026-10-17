import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { jest } from '@jest/globals';
import { fileURLToPath } from 'url';

// The administrator's queue of applications: shops asking to be verified and couriers
// asking to be let in, together, and what happens to one once it has been decided.

const url = (file) => fileURLToPath(new URL(file, import.meta.url));

// The state the server would hold, so a decision really changes what loads next.
let sellers;
let couriers;

const getSellersForReview = jest.fn(() => Promise.resolve(sellers));
const reviewSeller = jest.fn((id, status) => {
  sellers = sellers.map((seller) => (seller.id === id ? { ...seller, verification_status: status } : seller));
  return Promise.resolve({ ok: true });
});
const getAdminUsers = jest.fn(() => Promise.resolve(couriers));
const reviewCourierApproval = jest.fn((id, status) => {
  couriers = couriers.map((courier) => (courier.id === id ? { ...courier, approval_status: status } : courier));
  return Promise.resolve({ ok: true });
});

jest.unstable_mockModule(url('../api/storeApi.js'), () => ({ getSellersForReview, reviewSeller }));
jest.unstable_mockModule(url('../api/adminApi.js'), () => ({ getAdminUsers, reviewCourierApproval }));

const { default: ApprovalsQueue } = await import('./ApprovalsQueue');

beforeEach(() => {
  sellers = [
    { id: 1, shop_name: 'Mud', email: 'mud@zamglam.local', verification_status: 'pending', document_count: 2, product_count: 3 },
    { id: 2, shop_name: 'Jets', email: 'jets@zamglam.local', verification_status: 'verified', document_count: 1, product_count: 5 },
  ];
  couriers = [
    { id: 11, name: 'Mwansa Phiri', email: 'mwansa@zamglamcourier.local', approval_status: 'pending' },
    { id: 12, name: 'Thandiwe Zulu', email: 'thandiwe@zamglamcourier.local', approval_status: 'rejected' },
  ];
  jest.clearAllMocks();
});

const openQueue = (props = {}) => render(<ApprovalsQueue {...props} />);
const filterTo = (label) => userEvent.selectOptions(screen.getByLabelText('Show'), label);

describe('Applications waiting on the administrator', () => {
  test('shows courier registrations beside shop applications', async () => {
    openQueue();
    expect(await screen.findByText('Mud')).toBeInTheDocument();
    expect(screen.getByText('Mwansa Phiri')).toBeInTheDocument();
    expect(screen.getByText('2 application(s) waiting on you')).toBeInTheDocument();
  });

  test('a decided application is not in the waiting list', async () => {
    openQueue();
    await screen.findByText('Mud');
    // Jets is already verified and Thandiwe already rejected.
    expect(screen.queryByText('Jets')).not.toBeInTheDocument();
    expect(screen.queryByText('Thandiwe Zulu')).not.toBeInTheDocument();
  });

  test('the filter isolates couriers from shops', async () => {
    openQueue();
    await screen.findByText('Mud');

    await filterTo('courier');
    expect(screen.getByText('Mwansa Phiri')).toBeInTheDocument();
    expect(screen.queryByText('Mud')).not.toBeInTheDocument();

    await filterTo('shop');
    expect(screen.getByText('Mud')).toBeInTheDocument();
    expect(screen.queryByText('Mwansa Phiri')).not.toBeInTheDocument();
  });

  test('approving a courier takes it off the list', async () => {
    openQueue();
    await screen.findByText('Mwansa Phiri');

    const row = screen.getByText('Mwansa Phiri').closest('li');
    await userEvent.click(within(row).getByRole('button', { name: 'Approve' }));

    await waitFor(() => expect(reviewCourierApproval).toHaveBeenCalledWith(11, 'approved'));
    await waitFor(() => expect(screen.queryByText('Mwansa Phiri')).not.toBeInTheDocument());
  });

  test('rejecting a shop takes it off the list too', async () => {
    openQueue();
    await screen.findByText('Mud');

    const row = screen.getByText('Mud').closest('li');
    await userEvent.click(within(row).getByRole('button', { name: 'Reject' }));

    await waitFor(() => expect(reviewSeller).toHaveBeenCalledWith(1, 'rejected'));
    await waitFor(() => expect(screen.queryByText('Mud')).not.toBeInTheDocument());
  });

  test('the bottom button opens the marketplace accounts overview', async () => {
    const onOpenSection = jest.fn();
    openQueue({ onOpenSection });
    await screen.findByText('Mud');

    await userEvent.click(screen.getByRole('button', { name: /marketplace accounts/i }));
    expect(onOpenSection).toHaveBeenCalledWith('Overview');
  });
});

describe('Applications already decided', () => {
  test('are listed on their own, each carrying its tag', async () => {
    openQueue();
    await screen.findByText('Mud');

    await userEvent.click(screen.getByRole('button', { name: /decided applications/i }));

    expect(await screen.findByText('Jets')).toBeInTheDocument();
    expect(screen.getByText('Thandiwe Zulu')).toBeInTheDocument();
    expect(screen.getByText('Approved')).toBeInTheDocument();
    expect(screen.getByText('Rejected')).toBeInTheDocument();
    // The ones still waiting are not mixed in.
    expect(screen.queryByText('Mud')).not.toBeInTheDocument();
  });

  test('a settled decision cannot be changed without pressing Review first', async () => {
    openQueue();
    await screen.findByText('Mud');
    await userEvent.click(screen.getByRole('button', { name: /decided applications/i }));

    const row = (await screen.findByText('Thandiwe Zulu')).closest('li');
    expect(within(row).queryByRole('button', { name: 'Approve' })).not.toBeInTheDocument();
    expect(within(row).getByRole('button', { name: /review again/i })).toBeInTheDocument();
  });

  test('a wrongly rejected courier can be approved on review', async () => {
    openQueue();
    await screen.findByText('Mud');
    await userEvent.click(screen.getByRole('button', { name: /decided applications/i }));

    const row = (await screen.findByText('Thandiwe Zulu')).closest('li');
    await userEvent.click(within(row).getByRole('button', { name: /review again/i }));
    await userEvent.click(within(row).getByRole('button', { name: 'Approve' }));

    await waitFor(() => expect(reviewCourierApproval).toHaveBeenCalledWith(12, 'approved'));
  });

  test('a wrongly approved shop can be rejected on review', async () => {
    openQueue();
    await screen.findByText('Mud');
    await userEvent.click(screen.getByRole('button', { name: /decided applications/i }));

    const row = (await screen.findByText('Jets')).closest('li');
    await userEvent.click(within(row).getByRole('button', { name: /review again/i }));
    await userEvent.click(within(row).getByRole('button', { name: 'Reject' }));

    await waitFor(() => expect(reviewSeller).toHaveBeenCalledWith(2, 'rejected'));
  });

  test('the filter works on decided applications as well', async () => {
    openQueue();
    await screen.findByText('Mud');
    await userEvent.click(screen.getByRole('button', { name: /decided applications/i }));

    await filterTo('shop');
    expect(await screen.findByText('Jets')).toBeInTheDocument();
    expect(screen.queryByText('Thandiwe Zulu')).not.toBeInTheDocument();
  });
});
