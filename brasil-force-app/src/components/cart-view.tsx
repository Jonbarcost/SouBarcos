"use client";

import Link from "next/link";
import { ArrowUpRight, Lock, MapPin, Minus, Plus, Radar, ShieldCheck, Trash2, Truck } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { refreshCart } from "@/app/carrinho/actions";
import { brl, cartCount, cartSubtotal, MAX_QTY, reconcile, type ReconcileNote } from "@/lib/cart";
import { useCart } from "./cart-provider";

const noteText: Record<ReconcileNote["kind"], string> = {
  price: "teve o preço atualizado pelo vendedor",
  stock: "teve a quantidade ajustada ao estoque disponível",
  unavailable: "não está mais disponível e saiu do carrinho",
};

function formatPostal(value: string) {
  const d = value.replace(/\D/g, "").slice(0, 8);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
}

export function CartView() {
  const { cart, ready, update, remove, clear, postal, replace } = useCart();
  const [notes, setNotes] = useState<ReconcileNote[]>([]);
  const [postalInput, setPostalInput] = useState("");
  const [checking, setChecking] = useState(false);
  const synced = useRef(false);

  // Re-read every listing from the server once per visit to the cart page.
  useEffect(() => {
    if (!ready || synced.current) return;
    synced.current = true;
    setPostalInput(formatPostal(cart.postalCode ?? ""));
    if (!cart.items.length) return;
    setChecking(true);
    refreshCart(cart.items.map((i) => i.id))
      .then((live) => {
        if (!live) return;
        const result = reconcile(cart, live);
        setNotes(result.notes);
        if (result.notes.length) replace(result.cart);
      })
      .catch(() => undefined)
      .finally(() => setChecking(false));
  }, [ready, cart, replace]);

  if (!ready)
    return (
      <div className="bf-cart-loading" aria-busy="true">
        <Radar size={28} aria-hidden="true" /> Carregando carrinho…
      </div>
    );

  if (!cart.items.length)
    return (
      <section className="bf-cart-empty">
        <div className="bf-cart-empty-radar" aria-hidden="true">
          <span />
        </div>
        <h2>Seu carrinho está vazio.</h2>
        <p>Nenhum equipamento no radar ainda. Explore o catálogo e adicione o que combina com a sua missão.</p>
        {notes.length > 0 && (
          <ul className="bf-cart-notes">
            {notes.map((n) => (
              <li key={n.id + n.kind}>
                <strong>{n.title}</strong> {noteText[n.kind]}.
              </li>
            ))}
          </ul>
        )}
        <Link href="/catalogo" className="button button-primary bf-primary">
          Explorar o catálogo <ArrowUpRight size={18} aria-hidden="true" />
        </Link>
      </section>
    );

  const subtotal = cartSubtotal(cart);
  const postalOk = /^\d{5}-\d{3}$/.test(postalInput);

  return (
    <div className="bf-cart">
      <section className="bf-cart-items" aria-label="Itens do carrinho">
        <div className="bf-cart-head">
          <span className="bf-hud-label">
            {cartCount(cart)} {cartCount(cart) === 1 ? "ITEM" : "ITENS"} NO RADAR
          </span>
          {checking && <span className="bf-hud-label bf-blink">SINCRONIZANDO PREÇOS…</span>}
          <button type="button" className="bf-cart-clear" onClick={clear}>
            Esvaziar carrinho
          </button>
        </div>
        {notes.length > 0 && (
          <ul className="bf-cart-notes" role="status">
            {notes.map((n) => (
              <li key={n.id + n.kind}>
                <strong>{n.title}</strong> {noteText[n.kind]}.
              </li>
            ))}
          </ul>
        )}
        <ul className="bf-cart-list">
          {cart.items.map((item) => {
            const cap = Math.min(MAX_QTY, item.stock ?? MAX_QTY);
            return (
              <li className="bf-cart-line" key={item.id}>
                <div className="bf-cart-thumb" aria-hidden="true">
                  {item.category ? item.category.slice(0, 2).toUpperCase() : "BF"}
                </div>
                <div className="bf-cart-info">
                  <Link href={`/catalogo/${item.id}`}>{item.title}</Link>
                  <span>{brl(item.priceCents)} cada</span>
                </div>
                <div className="bf-stepper" role="group" aria-label={`Quantidade de ${item.title}`}>
                  <button type="button" onClick={() => update(item.id, item.qty - 1)} disabled={item.qty <= 1} aria-label="Diminuir">
                    <Minus size={15} aria-hidden="true" />
                  </button>
                  <output aria-live="polite">{item.qty}</output>
                  <button type="button" onClick={() => update(item.id, item.qty + 1)} disabled={item.qty >= cap} aria-label="Aumentar">
                    <Plus size={15} aria-hidden="true" />
                  </button>
                </div>
                <strong className="bf-cart-line-total">{brl(item.priceCents * item.qty)}</strong>
                <button type="button" className="bf-cart-remove" onClick={() => remove(item.id)} aria-label={`Remover ${item.title}`}>
                  <Trash2 size={17} aria-hidden="true" />
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <aside className="bf-cart-summary" aria-label="Resumo do pedido">
        <span className="bf-hud-label">RESUMO DA MISSÃO</span>
        <dl>
          <div>
            <dt>Subtotal</dt>
            <dd>{brl(subtotal)}</dd>
          </div>
          <div>
            <dt>Frete</dt>
            <dd>{cart.postalCode ? "Calculado no checkout" : "Informe o CEP"}</dd>
          </div>
          <div className="bf-cart-total">
            <dt>Total estimado</dt>
            <dd>{brl(subtotal)}</dd>
          </div>
        </dl>
        <form
          className="bf-cart-postal"
          onSubmit={(e) => {
            e.preventDefault();
            if (postalOk) postal(postalInput);
          }}
        >
          <label htmlFor="bf-cart-cep">
            <MapPin size={15} aria-hidden="true" /> CEP de entrega
          </label>
          <div>
            <input
              id="bf-cart-cep"
              inputMode="numeric"
              autoComplete="postal-code"
              placeholder="00000-000"
              value={postalInput}
              onChange={(e) => setPostalInput(formatPostal(e.target.value))}
            />
            <button type="submit" disabled={!postalOk}>
              OK
            </button>
          </div>
          <small>
            <Truck size={14} aria-hidden="true" />{" "}
            {cart.postalCode
              ? `Destino ${formatPostal(cart.postalCode)} salvo. O frete de cada vendedor será cotado no checkout.`
              : "Cada vendedor envia do seu próprio endereço; o frete é cotado no checkout."}
          </small>
        </form>
        <button type="button" className="button bf-cart-checkout" disabled aria-describedby="bf-checkout-note">
          <Lock size={17} aria-hidden="true" /> Finalizar compra
        </button>
        <p id="bf-checkout-note" className="bf-cart-fineprint">
          Pré-abertura: o checkout e os pagamentos serão liberados após homologação. Seu carrinho fica salvo neste
          navegador.
        </p>
        <p className="bf-cart-fineprint">
          <ShieldCheck size={14} aria-hidden="true" /> Anúncios moderados · vendedores analisados
        </p>
      </aside>
    </div>
  );
}
