import React from 'react';
import { render, screen, act, renderHook } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { jest } from '@jest/globals';
import { fileURLToPath } from 'url';

// The product page and the basket, driven the way a shopper drives them. The API is
// stood in for, so these run without a backend — the backend has its own tests.

const product = {
  id: 7, name: 'Slim Fit Pants', price: 400, stock: 3, image_url: '/p.jpg', images: ['/p.jpg'],
  store_name: 'Jets', store_seller_id: 2, store_rating: 0, store_rating_count: 0,
};

let productResponse;
// Jest resolves a mocked path from its setup file rather than from here, so name it in full.
jest.unstable_mockModule(fileURLToPath(new URL('../api/axios.js', import.meta.url)), () => ({
  default: {
    get: jest.fn((url) => {
      if (url.startsWith('/products/')) return productResponse();
      return Promise.resolve({ data: { reviews: [] } });
    }),
  },
}));

const { MemoryRouter, Route, Routes } = await import('react-router-dom');
const { AuthProvider } = await import('../context/AuthContext');
const { CartProvider, useCart } = await import('../context/CartContext');
const { default: ProductDetail } = await import('./ProductDetail');

const openProductPage = (id) => render(
  <MemoryRouter initialEntries={[`/product/${id}`]}>
    <AuthProvider>
      <CartProvider>
        <Routes><Route path="/product/:id" element={<ProductDetail />} /></Routes>
      </CartProvider>
    </AuthProvider>
  </MemoryRouter>,
);

const basket = () => renderHook(() => useCart(), { wrapper: CartProvider });

beforeEach(() => {
  localStorage.clear();
  productResponse = () => Promise.resolve({ data: product });
});

describe('The product page', () => {
  test('a real product loads after the loading message without crashing', async () => {
    openProductPage(7);
    expect(await screen.findByRole('heading', { name: 'Slim Fit Pants' })).toBeInTheDocument();
    expect(screen.getByText('3 in stock')).toBeInTheDocument();
  });

  test('a product that does not exist says so', async () => {
    productResponse = () => Promise.reject(new Error('404'));
    openProductPage(99999);
    expect(await screen.findByText('Product not found.')).toBeInTheDocument();
  });

  test('the quantity cannot be set above the stock', async () => {
    openProductPage(7);
    const quantity = await screen.findByLabelText(/Quantity/);
    await userEvent.clear(quantity);
    await userEvent.type(quantity, '9');
    expect(quantity).toHaveValue(3);
  });
});

describe('The basket', () => {
  test('adding more than is in stock stops at the stock', () => {
    const { result } = basket();
    act(() => result.current.addToCart(product, 2));
    act(() => result.current.addToCart(product, 5));
    expect(result.current.getTotalItems()).toBe(3);
  });

  test('raising the quantity in the basket stops at the stock', () => {
    const { result } = basket();
    act(() => result.current.addToCart(product, 1));
    const line = result.current.cart[0].lineId;
    act(() => result.current.updateQuantity(line, 10));
    expect(result.current.cart[0].quantity).toBe(3);
  });

  test('something whose stock is not known can still be added', () => {
    const { result } = basket();
    act(() => result.current.addToCart({ ...product, id: 8, stock: undefined }, 2));
    act(() => result.current.addToCart({ ...product, id: 9, stock: null }, 1));
    expect(result.current.getTotalItems()).toBe(3);
  });

  test('a sold-out product is not added', () => {
    const { result } = basket();
    act(() => result.current.addToCart({ ...product, stock: 0 }, 1));
    expect(result.current.cart).toHaveLength(0);
  });
});
