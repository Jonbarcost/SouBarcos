import { randomUUID } from "node:crypto";
import Link from "next/link";
import { requireSeller } from "@/lib/auth";
import { ListingForm } from "@/components/listing-form";
import { PageTitle, Notice } from "@/components/shell";
export default async function NewListing() {
  const { db } = await requireSeller();
  const { data, error } = await db
    .from("bf_categories")
    .select("slug,name")
    .eq("active", true)
    .neq("slug", "servicos")
    .order("name");
  if (error) throw new Error("Não foi possível carregar as categorias.");
  return (
    <div className="container page narrow">
      <PageTitle
        title="Novo anúncio"
        description="Comece pelos dados do produto e da embalagem."
      />
      <Link href="/painel-vendedor">Voltar aos anúncios</Link>
      <Notice>
        Somente produtos de venda livre. Salvar cria um rascunho privado; não
        publica nem habilita compras. Envio de fotografias ainda não disponível.
      </Notice>
      <section className="panel">
        <ListingForm id={randomUUID()} categories={data ?? []} />
      </section>
    </div>
  );
}
