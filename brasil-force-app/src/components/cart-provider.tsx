"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  addItem,
  CART_STORAGE_KEY,
  cartCount,
  emptyCart,
  parseCart,
  removeItem,
  setPostalCode,
  setQty,
  type Cart,
  type CartItem,
} from "@/lib/cart";

type CartApi = {
  cart: Cart;
  ready: boolean;
  count: number;
  add: (product: Omit<CartItem, "qty">, qty?: number) => void;
  update: (id: string, qty: number) => void;
  remove: (id: string) => void;
  clear: () => void;
  postal: (value: string) => void;
  replace: (cart: Cart) => void;
};

const CartContext = createContext<CartApi | null>(null);

function read() {
  try {
    return parseCart(window.localStorage.getItem(CART_STORAGE_KEY));
  } catch {
    return emptyCart;
  }
}

function write(cart: Cart) {
  try {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  } catch {
    // Private mode or blocked storage: the cart still works for this visit.
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<Cart>(emptyCart);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setCart(read());
    setReady(true);
    // Keep several open tabs in sync.
    const onStorage = (event: StorageEvent) => {
      if (event.key === CART_STORAGE_KEY) setCart(parseCart(event.newValue));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const commit = useCallback((next: (current: Cart) => Cart) => {
    setCart((current) => {
      const value = next(current);
      write(value);
      return value;
    });
  }, []);

  const api = useMemo<CartApi>(
    () => ({
      cart,
      ready,
      count: cartCount(cart),
      add: (product, qty = 1) => commit((c) => addItem(c, product, qty)),
      update: (id, qty) => commit((c) => setQty(c, id, qty)),
      remove: (id) => commit((c) => removeItem(c, id)),
      clear: () => commit((c) => ({ ...emptyCart, postalCode: c.postalCode })),
      postal: (value) => commit((c) => setPostalCode(c, value)),
      replace: (value) => commit(() => value),
    }),
    [cart, ready, commit],
  );

  return <CartContext.Provider value={api}>{children}</CartContext.Provider>;
}

export function useCart() {
  const value = useContext(CartContext);
  if (!value) throw new Error("useCart fora do CartProvider");
  return value;
}
