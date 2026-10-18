import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { jest } from '@jest/globals';
import { fileURLToPath } from 'url';

// The chat as a list of folded conversations: who each is with and the last message,
// opened one at a time.

const api = {
  getMessageThreads: jest.fn(),
  getThreadMessages: jest.fn(),
  sendThreadMessage: jest.fn(),
};

jest.unstable_mockModule(fileURLToPath(new URL('../api/messageApi.js', import.meta.url)), () => api);

const { default: StoreMessages } = await import('./StoreMessages.jsx');

const now = () => new Date().toISOString();

const sellerThreads = [
  { store_id: 9, store_name: 'Mud', customer_id: 12, customer_name: 'Chanda Banda', last_message: 'Does medium fit?', last_sender_role: 'customer', unread_count: 2, updated_at: now() },
  { store_id: 9, store_name: 'Mud', customer_id: 13, customer_name: 'Mwila Tembo', last_message: 'Thank you!', last_sender_role: 'seller', unread_count: 0, updated_at: now() },
];

describe('store messages', () => {
  beforeEach(() => {
    Object.values(api).forEach((mock) => mock.mockReset());
    api.getMessageThreads.mockResolvedValue([]);
    api.getThreadMessages.mockResolvedValue([]);
    api.sendThreadMessage.mockResolvedValue({ id: 1, sender_role: 'customer', body: 'Does medium fit?', created_at: now() });
  });

  test('every conversation starts folded, showing who it is with and the last message', async () => {
    api.getMessageThreads.mockResolvedValue(sellerThreads);
    render(<StoreMessages role="seller" />);

    expect(await screen.findByText('Chanda Banda')).toBeInTheDocument();
    expect(screen.getByText('Mwila Tembo')).toBeInTheDocument();
    expect(screen.getByText('Does medium fit?')).toBeInTheDocument();
    // Nothing is opened on its own, so nothing is read on its own.
    expect(screen.queryByLabelText('Reply message')).not.toBeInTheDocument();
    expect(api.getThreadMessages).not.toHaveBeenCalled();
  });

  test('a shop sees the customer\'s name, a shopper sees the shop\'s', async () => {
    api.getMessageThreads.mockResolvedValue([{ ...sellerThreads[0] }]);
    const { unmount } = render(<StoreMessages role="customer" />);
    expect(await screen.findByText('Mud')).toBeInTheDocument();
    expect(screen.queryByText('Chanda Banda')).not.toBeInTheDocument();
    unmount();
  });

  test('marks the last message as one\'s own', async () => {
    api.getMessageThreads.mockResolvedValue(sellerThreads);
    render(<StoreMessages role="seller" />);
    expect(await screen.findByText(/You: Thank you!/)).toBeInTheDocument();
  });

  test('shows how many messages are unread, per conversation and in all', async () => {
    api.getMessageThreads.mockResolvedValue(sellerThreads);
    render(<StoreMessages role="seller" />);
    expect(await screen.findByLabelText('2 unread')).toBeInTheDocument();
    expect(screen.getByText('2 unread')).toBeInTheDocument();
  });

  test('opening a conversation shows it, reads it, and lets a reply be written', async () => {
    api.getMessageThreads.mockResolvedValue(sellerThreads);
    api.getThreadMessages.mockResolvedValue([
      { id: 1, sender_role: 'customer', body: 'Does medium fit?', created_at: now() },
      { id: 2, sender_role: 'customer', body: 'And large?', created_at: now() },
    ]);
    api.sendThreadMessage.mockResolvedValue({ id: 3, sender_role: 'seller', body: 'Yes, both.', created_at: now() });
    render(<StoreMessages role="seller" />);

    fireEvent.click(await screen.findByRole('button', { name: /Chanda Banda/ }));

    expect(await screen.findByText('And large?')).toBeInTheDocument();
    expect(api.getThreadMessages).toHaveBeenCalledWith(9, 12);
    // Read now: the conversation's badge is gone.
    await waitFor(() => expect(screen.queryByLabelText('2 unread')).not.toBeInTheDocument());

    fireEvent.change(screen.getByLabelText('Reply message'), { target: { value: 'Yes, both.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));
    await waitFor(() => expect(api.sendThreadMessage).toHaveBeenCalledWith(9, 'Yes, both.', 12));
  });

  test('only one conversation is open at a time, and opening it again folds it', async () => {
    api.getMessageThreads.mockResolvedValue(sellerThreads);
    render(<StoreMessages role="seller" />);

    const first = await screen.findByRole('button', { name: /Chanda Banda/ });
    fireEvent.click(first);
    expect(first).toHaveAttribute('aria-expanded', 'true');

    const second = screen.getByRole('button', { name: /Mwila Tembo/ });
    fireEvent.click(second);
    expect(second).toHaveAttribute('aria-expanded', 'true');
    expect(first).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(second);
    expect(second).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByLabelText('Reply message')).not.toBeInTheDocument();
  });

  test('a shopper starts a conversation with a chosen shop', async () => {
    render(<StoreMessages role="customer" stores={[{ id: 9, name: 'Mud' }]} />);
    fireEvent.change(screen.getByLabelText('Message a shop'), { target: { value: '9' } });
    fireEvent.change(screen.getByLabelText('New message'), { target: { value: 'Does medium fit?' } });
    fireEvent.click(screen.getByRole('button', { name: 'Start conversation' }));

    await waitFor(() => expect(api.sendThreadMessage).toHaveBeenCalledWith(9, 'Does medium fit?'));
    const row = await screen.findByRole('button', { name: /Mud/ });
    expect(within(row).getByText(/You: Does medium fit\?/)).toBeInTheDocument();
  });
});
