// The shopping basket, shared with every page that needs it.
//
// Held in React state and mirrored into the browser’s storage, so a half-filled basket
// survives a refresh. The server keeps its own copy too (api/cart), which is what lets a
// basket follow somebody to another device.

import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};

const makeLineId = (product) => `${product.id}::${product.selectedSize || 'default'}::${product.selectedColor || 'default'}`;

const toCartItem = (product, quantity, lineId) => ({
  id: product.id,
  lineId,
  name: product.name || product.title,
  title: product.name || product.title,
  price: Number(product.price || product.sale_price || 0),
  quantity,
  image_url: product.image_url || product.image || product.images?.[0] || '',
  selectedSize: product.selectedSize,
  selectedColor: product.selectedColor,
  store_name: product.store_name || product.sellerName || product.shopName,
  sellerName: product.sellerName || product.store_name,
  sellerEmail: product.sellerEmail,
  stock: product.stock,
});

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(() => {
    try {
      const savedCart = localStorage.getItem('cart');
      const parsedCart = savedCart ? JSON.parse(savedCart) : [];
      return Array.isArray(parsedCart) ? parsedCart : [];
    } catch {
      localStorage.removeItem('cart');
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product, quantity = 1) => {
    const lineId = product.lineId || makeLineId(product);
    const stock = Number(product.stock);
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.lineId === lineId || (!item.lineId && item.id === product.id));
      const currentQuantity = existingItem ? Number(existingItem.quantity || 0) : 0;
      const requestedQuantity = Math.max(0, Number(quantity) || 0);
      const nextQuantity = Number.isFinite(stock)
        ? Math.min(stock, currentQuantity + requestedQuantity)
        : currentQuantity + requestedQuantity;

      if (nextQuantity <= currentQuantity) return prevCart;

      if (existingItem) {
        return prevCart.map((item) => (
          (item.lineId || item.id) === (existingItem.lineId || existingItem.id)
            ? { ...item, lineId, quantity: nextQuantity, stock: product.stock }
            : item
        ));
      }
      return [...prevCart, toCartItem(product, nextQuantity, lineId)];
    });
  };

  const removeFromCart = (productId) => {
    setCart((prevCart) => prevCart.filter((item) => item.lineId !== productId && item.id !== productId));
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart((prevCart) => prevCart.map((item) => {
      if (item.lineId !== productId && item.id !== productId) return item;
      const stock = Number(item.stock);
      return { ...item, quantity: Number.isFinite(stock) ? Math.min(quantity, stock) : quantity };
    }));
  };

  const clearCart = () => {
    setCart([]);
  };

  const getTotalItems = () => cart.reduce((total, item) => total + Number(item.quantity || 0), 0);

  const getTotalPrice = () => cart.reduce((total, item) => total + Number(item.price || 0) * Number(item.quantity || 0), 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getTotalItems,
        getTotalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
