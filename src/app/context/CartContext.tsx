'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';

interface CartItem {
  addedAt: number; // unique key
  product_id: number;
  name: string;
  price: number;
  image: string | null;
  quantity: number;
  base_price?: number;
  selectedAttributes: Record<string, string>;
  attributeOptions?: Record<string, any[]>;
}

interface CartContextProps {
  cart: CartItem[];
  cartCount: number;
  cartTotal: number;
  addToCart: (item: Omit<CartItem, 'addedAt'>) => void;
  updateItem: (addedAt: number, changes: Partial<CartItem>) => void;
  removeFromCart: (addedAt: number) => void;
}

const CartContext = createContext<CartContextProps | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('cart');
    if (stored) setCart(JSON.parse(stored));
  }, []);

  // Save to localStorage on update
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  // Calculate count and total
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cart.reduce((sum, item) => sum + item.quantity * item.price, 0);

  // Add new item
  const addToCart = (item: Omit<CartItem, 'addedAt'>) => {
    const newItem: CartItem = {
      ...item,
      addedAt: Date.now(),
    };
    setCart((prev) => [...prev, newItem]);
  };

  // Update existing item
  const updateItem = (addedAt: number, changes: Partial<CartItem>) => {
    setCart((prev) =>
      prev.map((item) =>
        item.addedAt === addedAt ? { ...item, ...changes } : item
      )
    );
  };

  // Remove item
  const removeFromCart = (addedAt: number) => {
    setCart((prev) => prev.filter((item) => item.addedAt !== addedAt));
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        cartCount,
        cartTotal,
        addToCart,
        updateItem,
        removeFromCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

// Hook to use cart context
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
};
