import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';
import { fileURLToPath } from 'url';

const catalogue = [
  { id: 701, name: 'Canvas Shoes', category_name: 'Shoes', audience: 'men', price: 320, stock: 5, store_name: 'Test Shop' },
  { id: 702, name: 'Linen Shirt', category_name: 'Shirts', audience: 'men', price: 180, stock: 5, store_name: 'Test Shop' },
  { id: 703, name: 'Wrap Dress', category_name: 'Dresses', audience: 'women', price: 450, stock: 5, store_name: 'Test Shop' },
];

jest.unstable_mockModule(fileURLToPath(new URL('../api/axios.js', import.meta.url)), () => ({
  default: { get: jest.fn(() => Promise.resolve({ data: catalogue })) },
}));

const { MemoryRouter, Route, Routes } = await import('react-router-dom');
const { AuthProvider } = await import('../context/AuthContext');
const { CartProvider } = await import('../context/CartContext');
const { default: Products } = await import('./Products');

function openCatalogue(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <CartProvider>
          <Routes><Route path="/products" element={<Products />} /></Routes>
        </CartProvider>
      </AuthProvider>
    </MemoryRouter>,
  );
}

beforeEach(() => localStorage.clear());

describe('Catalogue URL filters', () => {
  test('the shoe category link target filters to shoes', async () => {
    openCatalogue('/products?category=shoes');

    expect(await screen.findByRole('heading', { name: 'Canvas Shoes' })).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: 'Linen Shirt' })).not.toBeInTheDocument();
      expect(screen.queryByRole('heading', { name: 'Wrap Dress' })).not.toBeInTheDocument();
    });
  });

  test('the women audience link target filters to women’s products', async () => {
    openCatalogue('/products?audience=women');

    expect(await screen.findByRole('heading', { name: 'Wrap Dress' })).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: 'Canvas Shoes' })).not.toBeInTheDocument();
      expect(screen.queryByRole('heading', { name: 'Linen Shirt' })).not.toBeInTheDocument();
    });
  });
});
