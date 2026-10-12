import { useCallback, useEffect, useState } from 'react';

import {
  addItem,
  clearCart,
  loadCart,
  removeItem,
  saveCart,
  setQuantity,
  toggleChecked,
  type StorageLike,
} from '../lib/cart.ts';
import type { Cart } from '../types/cart.ts';

const storage: StorageLike = {
  getItem: (key) => window.localStorage.getItem(key),
  setItem: (key, value) => window.localStorage.setItem(key, value),
};

/** The cart is a set persisted to localStorage, written through on mutation. */
export function useCart() {
  const [cart, setCart] = useState<Cart>(() => loadCart(storage));

  useEffect(() => {
    saveCart(storage, cart);
  }, [cart]);

  const add = useCallback((productId: number) => setCart((c) => addItem(c, productId)), []);
  const remove = useCallback((productId: number) => setCart((c) => removeItem(c, productId)), []);
  const toggle = useCallback((productId: number) => setCart((c) => toggleChecked(c, productId)), []);
  const clear = useCallback(() => setCart(() => clearCart()), []);
  const quantity = useCallback(
    (productId: number, value: number) => setCart((c) => setQuantity(c, productId, value)),
    [],
  );

  // Wholesale replacement, for the one caller that has a whole list rather than an edit:
  // a shared list arriving, or being left. Every other mutation stays a small function,
  // so a caller cannot accidentally hand over a cart it built by hand.
  const replace = useCallback((next: Cart) => setCart(next), []);

  return { cart, add, remove, toggle, clear, quantity, replace };
}
