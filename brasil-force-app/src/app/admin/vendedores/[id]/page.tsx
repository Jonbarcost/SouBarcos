import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { requireStaff } from "@/lib/auth";
import { sellerStatus } from "@/lib/seller-review";
import { PageTitle } from "@/components/shell";
export default async function History({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { db } = await requireStaff();
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const page = Math.min(
    10000,
    Math.max(1, Number.parseInt((await searchParams).page ?? "1", 10) || 1),
  );
  const { data: app, error } = await db
    .from("bf_seller_applications")
    .select("id,display_name")
    .eq("id", id)
    .maybeSingle();
  if (error) throw Error("Não foi possível consultar a solicitação.");
  if (!app) notFound();
  const events = await db
    .from("bf_seller_review_events")
    .select("id,actor_id,from_status,to_status,reason,revision,created_at", {
      count: "exact",
    })
    .eq("application_id", id)
    .order("revision", { ascending: false })
    .range((page - 1) * 30, page * 30 - 1);
  if (events.error) throw Error("Não foi possível carregar o histórico.");
  return (
    <div className="container page narrow">
      <PageTitle
        title={app.display_name}
        description="Histórico de decisões da solicitação"
      />
      <Link href="/admin">Voltar à central</Link>
      {events.data.map((e) => (
        <article className="panel" key={e.id}>
          <h2>{sellerStatus[e.to_status]}</h2>
          <p>{e.reason}</p>
          <p>
            Responsável: {e.actor_id} · Revisão: {e.revision} ·{" "}
            {new Date(e.created_at).toLocaleString("pt-BR")}
          </p>
        </article>
      ))}
      <nav aria-label="Histórico">
        {page > 1 && <Link href={`?page=${page - 1}`}>Anterior</Link>}{" "}
        <span>Página {page}</span>{" "}
        {page * 30 < (events.count ?? 0) && (
          <Link href={`?page=${page + 1}`}>Próxima</Link>
        )}
      </nav>
    </div>
  );
}
