"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useCart } from "./cart-provider";

export function CartButton() {
  const { count, ready } = useCart();
  const [bump, setBump] = useState(false);
  const previous = useRef(count);

  useEffect(() => {
    if (ready && count > previous.current) {
      setBump(true);
      const timer = setTimeout(() => setBump(false), 650);
      previous.current = count;
      return () => clearTimeout(timer);
    }
    previous.current = count;
  }, [count, ready]);

  const label = count ? `Carrinho, ${count} ${count === 1 ? "item" : "itens"}` : "Carrinho vazio";
  return (
    <Link className="bf-cart-link" href="/carrinho" aria-label={label} data-bump={bump || undefined}>
      <ShoppingCart size={19} aria-hidden="true" />
      {ready && count > 0 && (
        <span className="bf-cart-badge" aria-hidden="true">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
