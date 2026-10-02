import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { jest } from '@jest/globals';
import { OrderTracker } from './SellerSections.jsx';

describe('seller order tracker actions', () => {
  test('offers only the next valid packing or courier-release action', () => {
    const onAdvance = jest.fn();
    render(<OrderTracker
      orders={[
        { id: 11, shipmentId: 101, fulfillmentStatus: 'placed', status: 'pending', sellerTotal: 320, items: [{ name: 'Wrap dress', quantity: 1 }] },
        { id: 12, shipmentId: 102, fulfillmentStatus: 'processing', status: 'pending', sellerTotal: 240, items: [{ name: 'Sandals', quantity: 1 }] },
        { id: 13, shipmentId: 103, fulfillmentStatus: 'shipped', status: 'pending', sellerTotal: 180, items: [{ name: 'Shirt', quantity: 1 }] },
      ]}
      onAdvance={onAdvance}
      busyId={null}
    />);

    fireEvent.click(screen.getByRole('button', { name: 'Start packing' }));
    fireEvent.click(screen.getByRole('button', { name: 'Release to courier' }));

    expect(onAdvance).toHaveBeenNthCalledWith(1, expect.objectContaining({ id: 11, shipmentId: 101 }), 'processing');
    expect(onAdvance).toHaveBeenNthCalledWith(2, expect.objectContaining({ id: 12, shipmentId: 102 }), 'shipped');
    expect(screen.getAllByText('Ready for courier')).toHaveLength(1);
    expect(screen.getAllByRole('button', { name: 'Release to courier' })).toHaveLength(1);
  });
});
