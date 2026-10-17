import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { listingStatus } from "@/lib/listings";
import { PageTitle } from "@/components/shell";
export default async function Moderation({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const { db } = await requireStaff();
  const params = await searchParams;
  const status =
    params.status && Object.hasOwn(listingStatus, params.status)
      ? params.status
      : "pending";
  const page = Math.min(
    10000,
    Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1),
  );
  const { data, error, count } = await db
    .from("bf_listings")
    .select("id,title,seller_id,status,classification,stock,price_cents", {
      count: "exact",
    })
    .eq("status", status)
    .order("created_at")
    .order("id")
    .range((page - 1) * 20, page * 20 - 1);
  if (error) throw Error("Não foi possível consultar a fila.");
  return (
    <div className="container page">
      <PageTitle
        title="Moderação de anúncios"
        description="Decisões conferidas, justificadas e registradas."
      />
      <Link href="/admin">Solicitações de vendedores</Link>
      <form className="search-form">
        <label>
          Situação
          <select name="status" defaultValue={status}>
            {Object.entries(listingStatus).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <button className="button">Filtrar</button>
      </form>
      <p>
        {count ?? 0} anúncio(s) · página {page}
      </p>
      {data.length ? (
        data.map((item) => (
          <article key={item.id} className="panel">
            <h2>
              <Link href={`/admin/anuncios/${item.id}`}>{item.title}</Link>
            </h2>
            <p>
              {listingStatus[item.status]} · {item.classification} · Estoque:{" "}
              {item.stock}
            </p>
            <p>Vendedor: {item.seller_id}</p>
            <p>
              {(item.price_cents / 100).toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </p>
          </article>
        ))
      ) : (
        <p>Nenhum anúncio nesta fila.</p>
      )}
      <nav aria-label="Páginas da moderação">
        {page > 1 && (
          <Link href={`?status=${status}&page=${page - 1}`}>Anterior</Link>
        )}{" "}
        {page * 20 < (count ?? 0) && (
          <Link href={`?status=${status}&page=${page + 1}`}>Próxima</Link>
        )}
      </nav>
    </div>
  );
}
