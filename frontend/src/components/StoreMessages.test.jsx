import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';
import { fileURLToPath } from 'url';

const api = {
  getMessageThreads: jest.fn(),
  getThreadMessages: jest.fn(),
  sendThreadMessage: jest.fn(),
};

jest.unstable_mockModule(fileURLToPath(new URL('../api/messageApi.js', import.meta.url)), () => api);

const { default: StoreMessages } = await import('./StoreMessages.jsx');

describe('store messages', () => {
  beforeEach(() => {
    Object.values(api).forEach((mock) => mock.mockReset());
    api.getMessageThreads.mockResolvedValue([]);
    api.getThreadMessages.mockResolvedValue([]);
    api.sendThreadMessage.mockResolvedValue({ id: 1, sender_role: 'customer', body: 'Does medium fit?', created_at: new Date().toISOString() });
  });

  test('customer starts a message thread with a selected shop', async () => {
    render(<StoreMessages role="customer" stores={[{ id: 9, name: 'Mud' }]} />);
    fireEvent.change(screen.getByLabelText('Message a shop'), { target: { value: '9' } });
    fireEvent.change(screen.getByLabelText('New message'), { target: { value: 'Does medium fit?' } });
    fireEvent.click(screen.getByRole('button', { name: 'Start conversation' }));

    await waitFor(() => expect(api.sendThreadMessage).toHaveBeenCalledWith(9, 'Does medium fit?'));
    expect(await screen.findByText('Does medium fit?')).toBeInTheDocument();
  });

  test('seller replies within the selected existing customer thread', async () => {
    api.getMessageThreads.mockResolvedValue([{
      store_id: 9,
      store_name: 'Mud',
      customer_id: 12,
      customer_name: 'Customer Name',
      last_message: 'Does medium fit?',
      last_sender_role: 'customer',
    }]);
    api.getThreadMessages.mockResolvedValue([
      { id: 1, sender_role: 'customer', body: 'Does medium fit?', created_at: new Date().toISOString() },
    ]);
    api.sendThreadMessage.mockResolvedValue({ id: 2, sender_role: 'seller', body: 'Yes, it does.', created_at: new Date().toISOString() });
    render(<StoreMessages role="seller" />);

    expect(await screen.findByText('Does medium fit?')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Reply message'), { target: { value: 'Yes, it does.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));

    await waitFor(() => expect(api.sendThreadMessage).toHaveBeenCalledWith(9, 'Yes, it does.', 12));
    await waitFor(() => expect(screen.getAllByText('Yes, it does.').length).toBeGreaterThan(0));
  });
});