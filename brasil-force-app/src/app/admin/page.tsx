import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { PageTitle, Notice } from "@/components/shell";
import { ActionForm } from "@/components/action-form";
import { sellerStatus } from "@/lib/seller-review";
import { reviewSeller, verifySeller } from "./actions";
export default async function Admin({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const { db, user, account } = await requireStaff();
  const administrator = ["admin", "superadmin"].includes(account.role);
  const params = await searchParams;
  const status =
    params.status &&
    [
      "pending",
      "in_review",
      "changes_requested",
      "rejected",
      "approved",
    ].includes(params.status)
      ? params.status
      : "pending";
  const page = Math.min(
    10000,
    Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1),
  );
  const { data, error, count } = await db
    .from("bf_seller_applications")
    .select("id,user_id,display_name,person_type,status,created_at,revision", {
      count: "exact",
    })
    .eq("status", status)
    .order("created_at", { ascending: true })
    .order("id")
    .range((page - 1) * 20, page * 20 - 1);
  if (error) throw new Error("Não foi possível carregar as solicitações.");
  const ids = data.map((a) => a.id);
  const history = ids.length
    ? await db
        .from("bf_seller_review_events")
        .select("id,application_id,to_status,reason,created_at,revision")
        .in("application_id", ids)
        .order("created_at", { ascending: false })
        .limit(100)
    : { data: [], error: null };
  if (history.error)
    throw new Error("Não foi possível carregar o histórico de análise.");
  const [policies, verifications] = await Promise.all([
    db
      .from("bf_seller_verification_policies")
      .select("person_type,version,required_checks,enabled")
      .eq("enabled", true),
    administrator && ids.length
      ? db
          .from("bf_seller_verifications")
          .select(
            "id,application_id,application_revision,policy_version,checks,expires_at",
          )
          .in("application_id", ids)
          .gt("expires_at", new Date().toISOString())
      : Promise.resolve({ data: [], error: null }),
  ]);
  if (policies.error || verifications.error)
    throw new Error("Não foi possível consultar a verificação.");
  return (
    <div className="container page">
      <PageTitle
        title="Central de análise"
        description="Solicitações reais, decisões justificadas e histórico auditável."
      />
      <Notice>
        Aprovação exige administrador com MFA e verificação vigente de todos os
        requisitos configurados. Registre apenas referências internas de
        evidências já conferidas em processo seguro. Não envie documentos ou
        dados pessoais pelos campos abaixo.
      </Notice>
      <p>
        <Link className="text-link" href="/admin/anuncios">
          Moderação de anúncios →
        </Link>
      </p>
      <form className="search-form" action="/admin">
        <label>
          Situação
          <select name="status" defaultValue={status}>
            {Object.entries(sellerStatus).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <button className="button button-primary">Filtrar</button>
      </form>
      <p>
        {count ?? 0} solicitação(ões) nesta situação · página {page}
      </p>
      {data.length === 0 ? (
        <section className="empty-state">
          <h2>Nenhuma solicitação nesta fila.</h2>
          <p>Novos pedidos aparecerão aqui após o envio pelo usuário.</p>
        </section>
      ) : (
        data.map((a) => {
          const policy = policies.data?.find(
            (p) => p.person_type === a.person_type,
          );
          const verified = Boolean(
            policy &&
            verifications.data?.some(
              (v) =>
                v.application_id === a.id &&
                v.application_revision === a.revision &&
                v.policy_version === policy.version &&
                policy.required_checks.every((code: string) =>
                  v.checks.includes(code),
                ),
            ),
          );
          return (
            <section className="panel" key={a.id} style={{ marginBottom: 24 }}>
              <h2>{a.display_name}</h2>
              <p>
                {a.person_type === "company"
                  ? "Pessoa jurídica"
                  : "Pessoa física"}{" "}
                · {sellerStatus[a.status]} ·{" "}
                {new Date(a.created_at).toLocaleDateString("pt-BR")}
              </p>
              <p>
                <Link href={`/admin/vendedores/${a.id}`}>
                  Histórico completo da solicitação
                </Link>
              </p>
              {a.status === "in_review" &&
                administrator &&
                a.user_id !== user.id && (
                  <section>
                    <h3>Verificação de requisitos</h3>
                    {!policy ? (
                      <p>
                        Bloqueado: nenhum processo de verificação está
                        habilitado para esta modalidade.
                      </p>
                    ) : verified ? (
                      <p>Verificação vigente registrada para esta revisão.</p>
                    ) : (
                      <ActionForm
                        action={verifySeller}
                        label="Registrar verificação"
                      >
                        <input type="hidden" name="p_id" value={a.id} />
                        <input
                          type="hidden"
                          name="p_revision"
                          value={a.revision}
                        />
                        <input
                          type="hidden"
                          name="p_policy_version"
                          value={policy.version}
                        />
                        <p>Política: {policy.version}</p>
                        {policy.required_checks.map((code: string) => (
                          <label key={code} className="check">
                            <input
                              type="checkbox"
                              name="p_checks"
                              value={code}
                              required
                            />
                            {(
                              {
                                identity: "Identidade do responsável",
                                fiscal: "Requisitos fiscais aplicáveis",
                                commercial: "Informações comerciais",
                                policy: "Aceite das políticas",
                                activity_credentials:
                                  "Credenciais exigidas para a atividade",
                              } as Record<string, string>
                            )[code] ?? code}
                          </label>
                        ))}
                        <label>
                          Referência interna da evidência (sem documentos, URLs
                          ou dados pessoais)
                          <input
                            name="p_reference"
                            minLength={8}
                            maxLength={100}
                            pattern="[A-Za-z0-9][A-Za-z0-9_-]{7,99}"
                            required
                          />
                        </label>
                        <label className="check">
                          <input type="checkbox" name="confirm" required />
                          Conferi as evidências no processo seguro configurado.
                        </label>
                      </ActionForm>
                    )}
                  </section>
                )}
              <details>
                <summary>Histórico recente</summary>
                {history.data?.filter((e) => e.application_id === a.id)
                  .length ? (
                  history.data
                    .filter((e) => e.application_id === a.id)
                    .map((e) => (
                      <p key={e.id}>
                        <strong>{sellerStatus[e.to_status]}</strong> —{" "}
                        {e.reason}{" "}
                        <small>
                          ({new Date(e.created_at).toLocaleString("pt-BR")})
                        </small>
                      </p>
                    ))
                ) : (
                  <p>Solicitação recebida. Ainda não há decisões.</p>
                )}
              </details>
              {["pending", "in_review"].includes(a.status) &&
                a.user_id !== user.id && (
                  <ActionForm action={reviewSeller} label="Registrar decisão">
                    <input type="hidden" name="p_id" value={a.id} />
                    <input type="hidden" name="p_revision" value={a.revision} />
                    <label>
                      Decisão
                      <select name="p_decision" defaultValue="" required>
                        <option value="" disabled>
                          Selecione
                        </option>
                        {a.status === "pending" && (
                          <option value="in_review">Iniciar análise</option>
                        )}
                        <option value="changes_requested">
                          Solicitar correções
                        </option>
                        <option value="rejected">Rejeitar solicitação</option>
                        {a.status === "in_review" && administrator && (
                          <option value="approved" disabled={!verified}>
                            Aprovar e habilitar vendedor
                            {!verified ? " — verificação pendente" : ""}
                          </option>
                        )}
                      </select>
                    </label>
                    <label>
                      Justificativa visível ao solicitante
                      <textarea
                        name="p_reason"
                        required
                        minLength={10}
                        maxLength={1500}
                        rows={3}
                        placeholder="Explique o motivo ou quais dados precisam ser corrigidos."
                      />
                    </label>
                    <label className="check">
                      <input name="confirm" type="checkbox" required />
                      <span>
                        Conferi a solicitação e confirmo esta decisão.
                      </span>
                    </label>
                  </ActionForm>
                )}
            </section>
          );
        })
      )}
      <nav aria-label="Páginas de solicitações">
        {page > 1 && (
          <Link
            className="text-link"
            href={`/admin?status=${status}&page=${page - 1}`}
          >
            ← Anterior{" "}
          </Link>
        )}
        {page * 20 < (count ?? 0) && (
          <Link
            className="text-link"
            href={`/admin?status=${status}&page=${page + 1}`}
          >
            Próxima →
          </Link>
        )}
      </nav>
    </div>
  );
}
