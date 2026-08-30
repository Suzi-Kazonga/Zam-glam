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
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.lineId === lineId || (!item.lineId && item.id === product.id));
      if (existingItem) {
        return prevCart.map((item) => (
          (item.lineId || item.id) === (existingItem.lineId || existingItem.id)
            ? { ...item, lineId, quantity: item.quantity + quantity }
            : item
        ));
      }
      return [...prevCart, toCartItem(product, quantity, lineId)];
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

    setCart((prevCart) =>
      prevCart.map((item) =>
        item.lineId === productId || item.id === productId ? { ...item, quantity } : item,
      ),
    );
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
