import type { Metadata } from "next";
import { PageTitle } from "@/components/shell";
import { CartView } from "@/components/cart-view";

export const metadata: Metadata = { title: "Carrinho" };

export default function CartPage() {
  return (
    <div className="container page">
      <PageTitle title="Seu carrinho" description="Revise os equipamentos selecionados para a sua próxima missão." />
      <CartView />
    </div>
  );
}
