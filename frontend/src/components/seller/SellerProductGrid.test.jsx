import { fireEvent, render, screen } from '@testing-library/react';
import { jest } from '@jest/globals';
import SellerProductGrid from './SellerProductGrid';

describe('seller product grid', () => {
  test('shows inventory, restock, sales, and promotion status on product cards', () => {
    const onPromote = jest.fn();
    render(
      <SellerProductGrid
        products={[
          { id: 1, name: 'Wrap Dress', price: 450, stock: 0, restock_expected_at: '2026-11-20', image_url: '/dress.jpg' },
          { id: 2, name: 'Cotton Shirt', price: 220, stock: 3, image_url: '/shirt.jpg' },
        ]}
        promotions={[{ product_id: 2, discount_percent: 20, starts_at: new Date(Date.now() - 60_000).toISOString(), ends_at: new Date(Date.now() + 60_000).toISOString() }]}
        soldUnits={{ 'Cotton Shirt': 12 }}
        onAdd={() => {}}
        onEdit={() => {}}
        onPromote={onPromote}
      />,
    );

    expect(screen.getByText('Out of stock')).toBeInTheDocument();
    expect(screen.getByText(/^Restock expected /)).toBeInTheDocument();
    expect(screen.getByText('Low stock · 3')).toBeInTheDocument();
    expect(screen.getByText('12 sold')).toBeInTheDocument();
    expect(screen.getByText('-20% Sale')).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole('button', { name: 'Promote' })[0]);
    expect(onPromote).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }));
  });
});
