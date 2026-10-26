import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  addItem,
  cartCount,
  cartSubtotal,
  emptyCart,
  MAX_LINES,
  MAX_QTY,
  parseCart,
  reconcile,
  removeItem,
  setPostalCode,
  setQty,
} from "../src/lib/cart";
import { BRASILIA, distanceKm, dms } from "../src/lib/geo";

const A = { id: "3f1c2a9e-8b7d-4c6e-9a1f-2b3c4d5e6f70", title: "Mochila 45L", priceCents: 38990, stock: 5 };
const B = { id: "5a6b7c8d-9e0f-4a1b-8c2d-3e4f5a6b7c8d", title: "Jaqueta", priceCents: 45900, stock: 3 };

test("adding merges lines and caps quantity by stock and per-listing limit", () => {
  let cart = addItem(emptyCart, A, 2);
  cart = addItem(cart, A, 10);
  assert.equal(cart.items.length, 1);
  assert.equal(cart.items[0].qty, 5, "capped at stock");
  cart = addItem(cart, { ...B, stock: 500 }, 50);
  assert.equal(cart.items[1].qty, MAX_QTY);
  assert.equal(cartCount(cart), 5 + MAX_QTY);
  assert.equal(cartSubtotal(cart), 5 * 38990 + MAX_QTY * 45900);
});

test("quantity changes stay between 1 and the cap; remove drops the line", () => {
  let cart = addItem(emptyCart, A, 1);
  cart = setQty(cart, A.id, 0);
  assert.equal(cart.items[0].qty, 1);
  cart = setQty(cart, A.id, 99);
  assert.equal(cart.items[0].qty, 5);
  assert.equal(removeItem(cart, A.id).items.length, 0);
});

test("stored cart is validated: junk, duplicates and bad postal codes are dropped", () => {
  assert.deepEqual(parseCart("not json"), emptyCart);
  assert.deepEqual(parseCart(null), emptyCart);
  const raw = JSON.stringify({
    items: [
      { ...A, qty: 2 },
      { ...A, qty: 3 },
      { id: "not-a-uuid", title: "x", priceCents: 1, qty: 1 },
      { ...B, qty: 1, priceCents: -5 },
      { ...B, qty: 1, title: "<img src=x onerror=alert(1)>".repeat(40) },
    ],
    postalCode: "abc",
  });
  const cart = parseCart(raw);
  assert.equal(cart.items.length, 1);
  assert.equal(cart.items[0].qty, 2);
  assert.equal(cart.postalCode, undefined);
  assert.equal(setPostalCode(cart, "01310-100").postalCode, "01310100");
  assert.equal(setPostalCode(cart, "123").postalCode, undefined);
});

test("cart never grows past the line limit", () => {
  let cart = emptyCart;
  for (let i = 0; i < MAX_LINES + 5; i++) {
    const id = `00000000-0000-4000-8000-${String(i).padStart(12, "0")}`;
    cart = addItem(cart, { id, title: `Item ${i}`, priceCents: 100 });
  }
  assert.equal(cart.items.length, MAX_LINES);
});

test("server data wins: price updates, stock clamps and unavailable items leave", () => {
  let cart = addItem(emptyCart, A, 4);
  cart = addItem(cart, B, 2);
  const { cart: next, notes } = reconcile(cart, [{ id: A.id, title: "Mochila 45L v2", price_cents: 35000, stock: 2 }]);
  assert.equal(next.items.length, 1);
  assert.equal(next.items[0].priceCents, 35000);
  assert.equal(next.items[0].qty, 2);
  assert.equal(next.items[0].title, "Mochila 45L v2");
  assert.deepEqual(notes.map((n) => n.kind).sort(), ["price", "stock", "unavailable"]);
});

test("cart server action only accepts UUIDs and reads the public listing view", () => {
  const source = readFileSync(fileURLToPath(new URL("../src/app/carrinho/actions.ts", import.meta.url)), "utf8");
  assert.match(source, /z\.array\(z\.uuid\(\)\)\.max\(MAX_LINES\)/);
  assert.match(source, /from\("bf_public_listings"\)/);
  assert.doesNotMatch(source, /bf_listings"/);
});

test("HUD coordinates and distance", () => {
  assert.equal(dms(BRASILIA.lat, "N", "S"), "S 15°48′");
  assert.equal(dms(BRASILIA.lng, "L", "O"), "O 47°53′");
  assert.equal(dms(10.9999, "N", "S"), "N 11°00′", "rounding never shows 60′");
  const saoPaulo = { lat: -23.5505, lng: -46.6333 };
  const km = distanceKm(saoPaulo, BRASILIA);
  assert.ok(km > 850 && km < 890, String(km));
  assert.equal(distanceKm(BRASILIA, BRASILIA), 0);
});
