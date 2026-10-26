"use client";

import Link from "next/link";
import { Check, Minus, Plus, ShoppingCart } from "lucide-react";
import { useState } from "react";
import { MAX_QTY } from "@/lib/cart";
import { useCart } from "./cart-provider";

type Product = { id: string; title: string; priceCents: number; stock: number; category?: string };

export function AddToCart({ product, compact = false }: { product: Product; compact?: boolean }) {
  const { add, cart } = useCart();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const inCart = cart.items.find((i) => i.id === product.id)?.qty ?? 0;
  const max = Math.max(0, Math.min(MAX_QTY, product.stock) - inCart);

  if (product.stock < 1) return <p className="bf-add-note">Sem estoque no momento.</p>;

  const onAdd = () => {
    add(product, qty);
    setAdded(true);
    setQty(1);
    setTimeout(() => setAdded(false), 2200);
  };

  if (compact)
    return (
      <button type="button" className="bf-add-compact" onClick={onAdd} disabled={max < 1}>
        {added ? <Check size={16} aria-hidden="true" /> : <ShoppingCart size={16} aria-hidden="true" />}
        {added ? "Adicionado" : max < 1 ? "Limite no carrinho" : "Adicionar"}
      </button>
    );

  return (
    <div className="bf-add">
      <div className="bf-stepper" role="group" aria-label="Quantidade">
        <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1} aria-label="Diminuir quantidade">
          <Minus size={16} aria-hidden="true" />
        </button>
        <output aria-live="polite">{qty}</output>
        <button type="button" onClick={() => setQty((q) => Math.min(max, q + 1))} disabled={qty >= max} aria-label="Aumentar quantidade">
          <Plus size={16} aria-hidden="true" />
        </button>
      </div>
      <button type="button" className="button button-primary bf-primary" onClick={onAdd} disabled={max < 1}>
        {added ? <Check size={18} aria-hidden="true" /> : <ShoppingCart size={18} aria-hidden="true" />}
        {added ? "Adicionado ao carrinho" : max < 1 ? "Limite no carrinho" : "Adicionar ao carrinho"}
      </button>
      <p className="bf-add-note" role="status">
        {added ? (
          <>
            Pronto! <Link href="/carrinho">Ver carrinho</Link>
          </>
        ) : inCart ? (
          `${inCart} no carrinho · até ${Math.min(MAX_QTY, product.stock)} por anúncio`
        ) : (
          `Até ${Math.min(MAX_QTY, product.stock)} unidades por anúncio`
        )}
      </p>
    </div>
  );
}
