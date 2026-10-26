import { z } from "zod";

/**
 * Cart state, kept in the visitor's browser (no account needed). Prices here
 * are a snapshot for display only: the cart page re-reads every listing from
 * the server, and any future checkout must price from the database.
 */
export const CART_STORAGE_KEY = "bf-cart-v1";
export const MAX_QTY = 10;
export const MAX_LINES = 30;

const item = z.object({
  id: z.uuid(),
  title: z.string().min(1).max(160),
  priceCents: z.number().int().positive().max(100_000_000),
  qty: z.number().int().min(1).max(MAX_QTY),
  stock: z.number().int().min(0).max(2_147_483_647).optional(),
  category: z.string().max(80).optional(),
});
export type CartItem = z.infer<typeof item>;
export type Cart = { items: CartItem[]; postalCode?: string };

export const emptyCart: Cart = { items: [] };

function limit(qty: number, stock?: number) {
  const cap = Math.min(MAX_QTY, stock ?? MAX_QTY);
  return Math.max(1, Math.min(cap, Math.floor(qty)));
}

/** Parse untrusted storage content; anything invalid is dropped, never thrown. */
export function parseCart(raw: string | null): Cart {
  if (!raw) return emptyCart;
  try {
    const data = JSON.parse(raw) as { items?: unknown[]; postalCode?: unknown };
    const items = Array.isArray(data.items)
      ? data.items.flatMap((entry) => {
          const parsed = item.safeParse(entry);
          return parsed.success ? [parsed.data] : [];
        })
      : [];
    const unique = items.filter((i, index) => items.findIndex((j) => j.id === i.id) === index);
    const postalCode =
      typeof data.postalCode === "string" && /^\d{8}$/.test(data.postalCode) ? data.postalCode : undefined;
    return { items: unique.slice(0, MAX_LINES), postalCode };
  } catch {
    return emptyCart;
  }
}

export function addItem(cart: Cart, product: Omit<CartItem, "qty">, qty = 1): Cart {
  const existing = cart.items.find((i) => i.id === product.id);
  if (existing)
    return {
      ...cart,
      items: cart.items.map((i) =>
        i.id === product.id ? { ...i, ...product, qty: limit(i.qty + qty, product.stock ?? i.stock) } : i,
      ),
    };
  if (cart.items.length >= MAX_LINES) return cart;
  return { ...cart, items: [...cart.items, { ...product, qty: limit(qty, product.stock) }] };
}

export function setQty(cart: Cart, id: string, qty: number): Cart {
  return { ...cart, items: cart.items.map((i) => (i.id === id ? { ...i, qty: limit(qty, i.stock) } : i)) };
}

export function removeItem(cart: Cart, id: string): Cart {
  return { ...cart, items: cart.items.filter((i) => i.id !== id) };
}

export function setPostalCode(cart: Cart, value: string): Cart {
  const digits = value.replace(/\D/g, "");
  return { ...cart, postalCode: digits.length === 8 ? digits : undefined };
}

export function cartCount(cart: Cart) {
  return cart.items.reduce((sum, i) => sum + i.qty, 0);
}

export function cartSubtotal(cart: Cart) {
  return cart.items.reduce((sum, i) => sum + i.priceCents * i.qty, 0);
}

export type ListingSnapshot = { id: string; title: string; price_cents: number; stock: number };
export type ReconcileNote = { id: string; kind: "price" | "stock" | "unavailable"; title: string };

/** Apply the server's current data: update price/title, clamp to stock, drop what is gone. */
export function reconcile(cart: Cart, live: ListingSnapshot[]): { cart: Cart; notes: ReconcileNote[] } {
  const notes: ReconcileNote[] = [];
  const byId = new Map(live.map((l) => [l.id, l]));
  const items = cart.items.flatMap((i) => {
    const current = byId.get(i.id);
    if (!current || current.stock < 1) {
      notes.push({ id: i.id, kind: "unavailable", title: i.title });
      return [];
    }
    if (current.price_cents !== i.priceCents) notes.push({ id: i.id, kind: "price", title: current.title });
    const qty = limit(i.qty, current.stock);
    if (qty < i.qty) notes.push({ id: i.id, kind: "stock", title: current.title });
    return [{ ...i, title: current.title, priceCents: current.price_cents, stock: current.stock, qty }];
  });
  return { cart: { ...cart, items }, notes };
}

export function brl(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
