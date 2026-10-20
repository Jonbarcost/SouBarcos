import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { authConfigured } from "@/lib/config";
import { serverClient } from "@/lib/supabase/server";
import { PageTitle, Notice } from "@/components/shell";
export default async function Product({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success || !authConfigured()) notFound();
  const db = await serverClient();
  // Explicit public filters also apply for staff/owners whose RLS permits private rows.
  const { data, error } = await db
    .from("bf_public_listings")
    .select(
      "id,title,description,condition,price_cents,stock,category_slug,brand,model",
    )
    .eq("id", id)
    .gt("stock", 0)
    .maybeSingle();
  if (error) throw Error("Não foi possível consultar o anúncio.");
  if (!data) notFound();
  return (
    <div className="container page narrow">
      <Link href="/catalogo">Voltar ao catálogo</Link>
      <PageTitle
        title={data.title}
        description="Informações declaradas no anúncio aprovado"
      />
      <section className="panel">
        <p style={{ whiteSpace: "pre-wrap" }}>{data.description}</p>
        <p>
          Condição:{" "}
          {
            (
              { new: "Novo", like_new: "Seminovo", used: "Usado" } as Record<
                string,
                string
              >
            )[data.condition]
          }
        </p>
        <p>
          Marca: {data.brand || "Não informada"} · Modelo:{" "}
          {data.model || "Não informado"}
        </p>
        <strong>
          {(data.price_cents / 100).toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          })}
        </strong>
        <p>Estoque informado: {data.stock}</p>
      </section>
      <Notice>
        Compra e pagamento ainda indisponíveis. A aprovação do anúncio não
        comprova certificação ou credenciamento institucional.
      </Notice>
      <Link className="text-link" href="/assistente">
        Consultar o assistente
      </Link>
    </div>
  );
}
