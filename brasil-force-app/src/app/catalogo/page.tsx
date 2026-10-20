import Link from "next/link";
import { Search, PackageOpen } from "lucide-react";
import { PageTitle, Notice } from "@/components/shell";
import { authConfigured } from "@/lib/config";
import { serverClient } from "@/lib/supabase/server";
const categories = [
  ["", "Todas as categorias"],
  ["vestuario", "Vestuário"],
  ["campo", "Equipamentos de campo"],
  ["acessorios", "Acessórios"],
  ["colecionismo", "Colecionismo"],
  ["outdoor", "Outdoor"],
  ["servicos", "Serviços"],
];
export default async function Catalog({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; categoria?: string }>;
}) {
  const params = await searchParams;
  const q = (params.q ?? "").slice(0, 100);
  const category = categories.some(([slug]) => slug === params.categoria)
    ? params.categoria
    : "";
  let products: {
    id: string;
    title: string;
    price_cents: number;
    condition: string;
  }[] = [];
  let failed = false;
  if (authConfigured()) {
    const db = await serverClient();
    let query = db
      .from("bf_public_listings")
      .select("id,title,price_cents,condition")
      .gt("stock", 0)
      .limit(40);
    if (q) query = query.ilike("title", "%" + q.replace(/[%_\\]/g, "") + "%");
    if (category) query = query.eq("category_slug", category);
    const result = await query.order("created_at", { ascending: false });
    failed = Boolean(result.error);
    products = result.data ?? [];
  }
  return (
    <div className="container page">
      <PageTitle
        title="Encontre seu próximo equipamento."
        description="Vestuário, campo, outdoor e colecionismo em um só lugar."
      />
      <form className="search-form" action="/catalogo">
        <label className="search-input">
          <Search size={20} />
          <input
            name="q"
            defaultValue={q}
            placeholder="O que você está procurando?"
            aria-label="Buscar equipamentos"
            maxLength={100}
          />
        </label>
        <select name="categoria" defaultValue={category} aria-label="Categoria">
          {categories.map(([slug, name]) => (
            <option value={slug} key={slug}>
              {name}
            </option>
          ))}
        </select>
        <button className="button button-primary">Buscar</button>
      </form>
      {!authConfigured() && (
        <Notice>
          Catálogo em preparação. Ainda não há anúncios disponíveis para compra.
        </Notice>
      )}
      {failed ? (
        <Notice>
          Não foi possível consultar o catálogo. Tente novamente mais tarde.
        </Notice>
      ) : products.length ? (
        <div className="products">
          {products.map((p) => (
            <article className="panel" key={p.id}>
              <h2>
                <Link href={`/catalogo/${p.id}`}>{p.title}</Link>
              </h2>
              <p>{p.condition}</p>
              <strong>
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(p.price_cents / 100)}
              </strong>
              <p>Compra ainda indisponível nesta fase.</p>
            </article>
          ))}
        </div>
      ) : (
        <section className="empty-state">
          <PackageOpen size={58} strokeWidth={1} />
          <h2>
            {q
              ? "Nenhum anúncio encontrado."
              : "Os primeiros anúncios estão a caminho."}
          </h2>
          <p>
            {q
              ? "Experimente outra busca ou categoria."
              : "Estamos preparando uma comunidade de vendedores e equipamentos selecionados."}
          </p>
          <div className="actions" style={{ justifyContent: "center", marginTop: 22 }}>
            <Link href="/catalogo" className="button button-primary">Limpar busca e filtros</Link>
            <Link href="/vender" className="text-link">Sou fornecedor <span aria-hidden="true">→</span></Link>
          </div>
        </section>
      )}
    </div>
  );
}
