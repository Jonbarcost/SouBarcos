import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { requireStaff } from "@/lib/auth";
import { listingStatus } from "@/lib/listings";
import { classificationLabels } from "@/lib/listing-review";
import { ActionForm } from "@/components/action-form";
import { PageTitle, Notice } from "@/components/shell";
import { reviewListing } from "../actions";
export default async function Review({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { db, user } = await requireStaff();
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const page = Math.min(
    10000,
    Math.max(1, Number.parseInt((await searchParams).page ?? "1", 10) || 1),
  );
  const [listing, events] = await Promise.all([
    db
      .from("bf_listings")
      .select(
        "id,title,description,seller_id,status,classification,category_slug,condition,price_cents,stock,brand,model,weight_grams,length_cm,width_cm,height_cm,dispatch_business_days,revision",
      )
      .eq("id", id)
      .maybeSingle(),
    db
      .from("bf_listing_review_events")
      .select(
        "id,actor_id,from_status,to_status,reason,classification,revision,created_at",
        { count: "exact" },
      )
      .eq("listing_id", id)
      .order("revision", { ascending: false })
      .range((page - 1) * 30, page * 30 - 1),
  ]);
  if (listing.error || events.error)
    throw Error("Não foi possível carregar a análise.");
  if (!listing.data) notFound();
  const item = listing.data;
  const notes = events.data.length
    ? await db
        .from("bf_listing_review_notes")
        .select("id,note")
        .in(
          "id",
          events.data.map((e) => e.id),
        )
    : { data: [], error: null };
  if (notes.error) throw Error("Não foi possível carregar as notas.");
  const seller = await db
    .from("bf_seller_applications")
    .select("display_name,status")
    .eq("user_id", item.seller_id)
    .maybeSingle();
  if (seller.error) throw Error("Não foi possível consultar o vendedor.");
  const restricted = ["controlled", "prohibited"].includes(item.classification);
  const decisions =
    item.status === "pending"
      ? ["in_review", "changes_requested", "rejected"]
      : item.status === "in_review"
        ? [
            "changes_requested",
            "rejected",
            ...(!restricted ? ["approved"] : []),
          ]
        : item.status === "approved"
          ? ["removed"]
          : [];
  return (
    <div className="container page narrow">
      <PageTitle
        title={item.title}
        description={`${listingStatus[item.status]} · Revisão ${item.revision}`}
      />
      <Link href="/admin/anuncios">Voltar à fila</Link>
      <section className="panel">
        <h2>Dados enviados</h2>
        <p style={{ whiteSpace: "pre-wrap" }}>{item.description}</p>
        <p>
          Vendedor: {seller.data?.display_name ?? item.seller_id} ·{" "}
          {seller.data?.status ?? "Sem habilitação"}
        </p>
        <p>
          Categoria: {item.category_slug} · Condição: {item.condition}
        </p>
        <p>
          Marca: {item.brand || "Não informada"} · Modelo:{" "}
          {item.model || "Não informado"}
        </p>
        <p>
          Preço:{" "}
          {(item.price_cents / 100).toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          })}{" "}
          · Estoque: {item.stock}
        </p>
        <p>
          Embalagem: {item.weight_grams ?? "—"} g · {item.length_cm ?? "—"} ×{" "}
          {item.width_cm ?? "—"} × {item.height_cm ?? "—"} cm · Postagem
          informada: {item.dispatch_business_days} dia(s) útil(eis)
        </p>
        <p>Classificação: {classificationLabels[item.classification]}</p>
      </section>
      <Notice>
        Aprovação comum exige conferência humana de legalidade, atributos,
        procedência e requisitos aplicáveis. Não concede credenciamento
        institucional. Produtos controlados ou proibidos não podem ser aprovados
        neste fluxo.
      </Notice>
      {decisions.length && item.seller_id !== user.id ? (
        <section className="panel">
          <ActionForm action={reviewListing} label="Registrar decisão">
            <input type="hidden" name="p_id" value={id} />
            <input type="hidden" name="p_revision" value={item.revision} />
            <label>
              Decisão
              <select name="p_decision" required defaultValue="">
                <option value="" disabled>
                  Selecione
                </option>
                {decisions.map((d) => (
                  <option key={d} value={d}>
                    {listingStatus[d]}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Classificação conferida
              <select
                name="p_classification"
                defaultValue={item.classification}
              >
                {Object.entries(classificationLabels)
                  .filter(
                    ([key]) =>
                      !restricted || ["controlled", "prohibited"].includes(key),
                  )
                  .map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
              </select>
            </label>
            <label>
              Retorno ao vendedor
              <textarea
                name="p_reason"
                required
                minLength={10}
                maxLength={1500}
                rows={3}
              />
            </label>
            <label>
              Nota interna da equipe (opcional, sem dados pessoais)
              <textarea name="p_internal_note" maxLength={1500} rows={3} />
            </label>
            <label className="check">
              <input type="checkbox" name="confirm" required />
              Conferi o produto, os requisitos e confirmo esta decisão.
            </label>
          </ActionForm>
        </section>
      ) : (
        <p>Não há decisão disponível para esta conta neste estado.</p>
      )}
      <section className="panel">
        <h2>Histórico de decisões</h2>
        {events.data.map((e) => (
          <article key={e.id}>
            <h3>
              {listingStatus[e.to_status]} · Revisão {e.revision}
            </h3>
            <p>{e.reason}</p>
            <p>
              Classificação: {classificationLabels[e.classification]} ·
              Responsável: {e.actor_id}
            </p>
            <p>{new Date(e.created_at).toLocaleString("pt-BR")}</p>
            {notes.data?.find((n) => n.id === e.id) && (
              <p>Nota interna: {notes.data.find((n) => n.id === e.id)?.note}</p>
            )}
          </article>
        ))}
        {!events.data.length && <p>Ainda não há decisões.</p>}
        <nav aria-label="Histórico de moderação">
          {page > 1 && <Link href={`?page=${page - 1}`}>Anterior</Link>}{" "}
          {page * 30 < (events.count ?? 0) && (
            <Link href={`?page=${page + 1}`}>Próxima</Link>
          )}
        </nav>
      </section>
    </div>
  );
}
