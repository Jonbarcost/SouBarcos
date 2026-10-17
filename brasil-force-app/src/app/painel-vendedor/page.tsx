import Link from "next/link";
import { requireSeller } from "@/lib/auth";
import { listingStatus } from "@/lib/listings";
import { PageTitle, Notice } from "@/components/shell";

export default async function SellerPanel({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string }>;
}) {
  const { db, user } = await requireSeller();
  const search = await searchParams;
  const page = Math.min(
    10000,
    Math.max(1, Number.parseInt(search.page ?? "1", 10) || 1),
  );
  const status =
    search.status && Object.hasOwn(listingStatus, search.status)
      ? search.status
      : "";
  let query = db
    .from("bf_listings")
    .select("id,title,status,price_cents,stock", { count: "exact" })
    .eq("seller_id", user.id);
  if (status) query = query.eq("status", status);
  const { data, error, count } = await query
    .order("updated_at", { ascending: false })
    .order("id")
    .range((page - 1) * 20, page * 20 - 1);
  if (error) throw new Error("Não foi possível carregar seus anúncios.");
  const pageUrl = (n: number) => `/painel-vendedor?page=${n}&status=${status}`;
  return (
    <div className="container page">
      <PageTitle
        title="Painel do vendedor"
        description="Organize seus anúncios e acompanhe cada etapa da análise."
      />
      <Notice>
        Pré-abertura: preparação de anúncios disponível para vendedores
        habilitados. Fotografias, publicação e vendas ainda dependem das
        próximas etapas.
      </Notice>
      <section className="panel">
        <div className="listing-toolbar">
          <h2>Meus anúncios</h2>
          <Link
            href="/painel-vendedor/anuncios/novo"
            className="button button-primary"
          >
            Novo anúncio
          </Link>
        </div>
        <form className="search-form" method="get">
          <label htmlFor="listing-status">Situação</label>
          <select id="listing-status" name="status" defaultValue={status}>
            <option value="">Todas</option>
            {Object.entries(listingStatus).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <button className="button" type="submit">
            Filtrar
          </button>
        </form>
        <p>{count ?? 0} anúncio(s) encontrado(s).</p>
        {data?.length ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Anúncio</th>
                  <th>Situação</th>
                  <th>Preço</th>
                  <th>Estoque</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <Link href={`/painel-vendedor/anuncios/${item.id}`}>
                        {item.title}
                      </Link>
                    </td>
                    <td>{listingStatus[item.status]}</td>
                    <td>
                      {(item.price_cents / 100).toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </td>
                    <td>{item.stock}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>
            Não há anúncios nesta seleção. Crie um rascunho para preparar seu
            primeiro produto.
          </p>
        )}
        <nav className="listing-toolbar" aria-label="Páginas de anúncios">
          {page > 1 && <Link href={pageUrl(page - 1)}>Anterior</Link>}
          <span>Página {page}</span>
          {page * 20 < (count ?? 0) && (
            <Link href={pageUrl(page + 1)}>Próxima</Link>
          )}
        </nav>
      </section>
    </div>
  );
}
