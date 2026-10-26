"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles } from "lucide-react";

/** Main navigation with the current section marked for sighted and screen reader users. */
export function NavLinks() {
  const pathname = usePathname() ?? "/";
  const current = (href: string) =>
    pathname === href || pathname.startsWith(href + "/") ? "page" : undefined;
  return (
    <nav aria-label="Navegação principal">
      <Link href="/catalogo" aria-current={current("/catalogo")}>Catálogo</Link>
      <Link className="bf-nav-ai" href="/assistente" aria-current={current("/assistente")}>
        <Sparkles size={15} aria-hidden="true" /> Assistente IA
      </Link>
      <Link href="/vender" aria-current={current("/vender")}>Como vender</Link>
      <Link href="/ajuda" aria-current={current("/ajuda")}>Ajuda</Link>
    </nav>
  );
}
