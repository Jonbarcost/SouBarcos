import Link from "next/link";
import { z } from "zod";
import { zohoAdmin } from "@/lib/zoho-server";
import { configStatus } from "@/lib/zoho-security";
import {
  createSupplier,
  updateSupplier,
  createDraft,
  reviewMail,
  sendMail,
  disconnectZoho,
} from "./actions";
export const dynamic = "force-dynamic";
const labels: Record<string, string> = {
  identified: "Identificado",
  contact_pending: "Contato pendente",
  contacted: "Contatado",
  interested: "Interessado",
  consented: "Autorizado",
  catalog_active: "Período gratuito ativo",
  declined: "Recusou",
  cancelled: "Cancelado",
  expired: "Expirado",
};
const dates = (s: string | null) =>
  s
    ? new Date(s).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })
    : "—";
export default async function Fornecedores({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const q = await searchParams;
  const { db } = await zohoAdmin();
  const page = Math.max(1, Math.min(1000, Math.floor(Number(q.page) || 1)));
  const selected = z.uuid().safeParse(q.id);
  const { data, error, count } = await db
    .from("bf_supplier_prospects")
    .select(
      "id,company_name,category,contact_email,source_url,stage,opt_out,created_at,activated_at,consent_at,cancelled_at,consent_reference,revision",
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range((page - 1) * 20, page * 20 - 1);
  const s = selected.success
    ? (
        await db
          .from("bf_supplier_prospects")
          .select("*")
          .eq("id", selected.data)
          .maybeSingle()
      ).data
    : null;
  const historyPage = Math.max(
    1,
    Math.min(1000, Math.floor(Number(q.historyPage) || 1)),
  );
  const events = s
    ? (
        await db
          .from("bf_supplier_events")
          .select("id,event_type,details,created_at")
          .eq("supplier_id", s.id)
          .order("created_at", { ascending: false })
          .range((historyPage - 1) * 30, historyPage * 30 - 1)
      ).data
    : [];
  const mails = s
    ? (
        await db
          .from("bf_supplier_mail")
          .select(
            "id,recipient,subject,body,status,created_at,approved_at,claimed_at",
          )
          .eq("supplier_id", s.id)
          .order("created_at", { ascending: false })
          .limit(30)
      ).data
    : [];
  const { data: conn } = await db
    .from("bf_zoho_connection")
    .select("mailbox")
    .eq("id", "corporate")
    .maybeSingle();
  const config = configStatus(process.env);
  const sendEnabled =
    config.configured &&
    !!conn &&
    process.env.ZOHO_MAIL_SEND_ENABLED === "true";
  return (
    <div className="container page supplier-central">
      <Link href="/admin">← Administração</Link>
      <h1>Central de fornecedores</h1>
      <p>
        Relacionamentos, autorizações e divulgação gratuita por 30 dias. Sem
        cobrança ou renovação automática.
      </p>
      {q.operation && (
        <p role="status" className="notice">
          {q.operation === "saved"
            ? "Operação registrada."
            : "Não foi possível concluir. Confira as permissões, a etapa e a conexão. Se tentou enviar, verifique o histórico e a caixa Zoho antes de criar outro rascunho."}
        </p>
      )}
      {q.zoho && (
        <p role="status" className="notice">
          {q.zoho === "connected"
            ? "Caixa Zoho conectada."
            : "Conexão não concluída. Confira configuração e autorização; inicie novamente."}
        </p>
      )}
      <section className="supplier-card">
        <h2>Zoho Mail</h2>
        <p>
          {conn
            ? "Caixa conectada: " + conn.mailbox
            : "Caixa ainda não conectada."}{" "}
          {sendEnabled
            ? "Envio individual exige revisão e confirmação."
            : "Envio de e-mails desativado."}
        </p>
        {!config.configured && (
          <p>
            Ativação bloqueada: confira os segredos independentes, região,
            endereço de retorno e revisão da credencial.
          </p>
        )}
        <div className="supplier-row">
          <form action="/api/integrations/zoho/start" method="post">
            <button
              className="button button-primary"
              disabled={
                !config.configured || process.env.ZOHO_OAUTH_ENABLED !== "true"
              }
            >
              Autorizar caixa Zoho
            </button>
          </form>
          <Link
            className="button button-outline"
            href="/admin/fornecedores/mensagens"
          >
            Ler mensagens
          </Link>
          <Link href="/api/integrations/zoho/status">Diagnóstico seguro</Link>
          {conn && (
            <form action={disconnectZoho}>
              <button className="button button-outline">
                Revogar e desconectar
              </button>
            </form>
          )}
        </div>
      </section>
      <details className="supplier-card">
        <summary>Cadastrar fornecedor</summary>
        <form action={createSupplier} className="supplier-form">
          <label>
            Empresa
            <input name="company_name" required minLength={2} maxLength={180} />
          </label>
          <label>
            Categoria
            <input name="category" required minLength={2} maxLength={100} />
          </label>
          <label>
            E-mail comercial público
            <input name="contact_email" type="email" maxLength={254} />
          </label>
          <label>
            Site HTTPS
            <input name="website" type="url" maxLength={1000} />
          </label>
          <label>
            Fonte pública do contato
            <input name="source_url" type="url" maxLength={1000} />
          </label>
          <button className="button button-primary">Salvar fornecedor</button>
        </form>
      </details>
      <h2>Fornecedores registrados</h2>
      {error ? (
        <p role="alert">
          Central indisponível: migração ou acesso administrativo pendente.
        </p>
      ) : !data?.length ? (
        <p>Nenhum fornecedor cadastrado.</p>
      ) : (
        data.map((row) => (
          <article className="supplier-card" key={row.id}>
            <Link href={"?id=" + row.id + "&page=" + page}>
              <h3>{row.company_name}</h3>
            </Link>
            <p>
              {row.category} ·{" "}
              {row.activated_at &&
              new Date(row.activated_at).getTime() + 30 * 86400000 <= Date.now()
                ? "Período gratuito encerrado"
                : labels[row.stage]}
              {row.opt_out ? " · Não contatar" : ""}
            </p>
          </article>
        ))
      )}
      <nav className="supplier-row" aria-label="Páginas de fornecedores">
        {page > 1 && <Link href={"?page=" + (page - 1)}>Anterior</Link>}
        <span>Página {page}</span>
        {(count ?? 0) > page * 20 && (
          <Link href={"?page=" + (page + 1)}>Próxima</Link>
        )}
      </nav>
      {s && (
        <section className="supplier-card">
          <h2>{s.company_name}</h2>
          <p>
            {s.contact_email ?? "Sem e-mail cadastrado"} · {labels[s.stage]}
            {s.opt_out ? " · Contato bloqueado" : ""}
          </p>
          <p>
            Consentimento: {dates(s.consent_at)}. Início:{" "}
            {dates(s.activated_at)}. Fim:{" "}
            {s.activated_at
              ? dates(
                  new Date(
                    new Date(s.activated_at).getTime() + 30 * 86400000,
                  ).toISOString(),
                )
              : "não iniciado"}
            .
          </p>
          <p>
            Registro: {s.consent_reference ?? "Nenhuma autorização registrada."}
          </p>
          <p>
            Ativar registra o prazo de divulgação; não publica anúncios nem
            dispensa a moderação dos produtos.
          </p>
          <form action={updateSupplier} className="supplier-form">
            <input type="hidden" name="id" value={s.id} />
            <input type="hidden" name="revision" value={s.revision} />
            <label>
              Operação
              <select name="action">
                {Object.entries(labels)
                  .filter(([k]) =>
                    [
                      "identified",
                      "contact_pending",
                      "contacted",
                      "interested",
                      "declined",
                      "cancelled",
                    ].includes(k),
                  )
                  .map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                <option value="consent_recorded">
                  Registrar consentimento do fornecedor
                </option>
                <option value="activated">Iniciar os 30 dias gratuitos</option>
                <option value="opted_out">Bloquear contato (opt-out)</option>
                <option value="note_added">Adicionar nota</option>
                <option value="contact_logged">
                  Registrar contato externo
                </option>
              </select>
            </label>
            <label>
              Detalhes / referência da autorização
              <textarea
                name="details"
                maxLength={2000}
                placeholder="Registre a referência da autorização, o material autorizado e seu escopo. Não inclua documentos ou credenciais."
              />
            </label>
            <button className="button button-primary">
              Registrar operação
            </button>
          </form>
          <h3>Preparar e-mail</h3>
          <p>
            O destinatário será o contato cadastrado. Revise o texto completo
            antes de aprovar; a aprovação vence em 24 horas. Não inclua
            promessas de vendas, cobranças ou material sem autorização.
          </p>
          <form action={createDraft} className="supplier-form">
            <input type="hidden" name="id" value={s.id} />
            <label>
              Assunto
              <input name="subject" required maxLength={200} />
            </label>
            <label>
              Mensagem
              <textarea name="body" required maxLength={10000} rows={7} />
            </label>
            <button className="button button-outline" disabled={s.opt_out}>
              Salvar rascunho sem enviar
            </button>
          </form>
          <h3>Últimos 30 e-mails preparados</h3>
          {!mails?.length ? (
            <p>Nenhum rascunho.</p>
          ) : (
            mails.map((m) => (
              <article className="supplier-card" key={m.id}>
                <p>
                  Para: {m.recipient} · {m.status}
                </p>
                <h4>{m.subject}</h4>
                <p className="supplier-body">{m.body}</p>
                <p>
                  Criado: {dates(m.created_at)} · Aprovado:{" "}
                  {dates(m.approved_at)}
                </p>
                {m.status === "sending" && (
                  <p>
                    Em processamento ou resultado pendente. Confira diretamente
                    no Zoho; não reenvie automaticamente.
                  </p>
                )}
                {m.status === "uncertain" && (
                  <p>
                    Resultado incerto. Confira a pasta Enviados antes de
                    preparar outro e-mail.
                  </p>
                )}
                {["draft", "approved"].includes(m.status) && (
                  <form action={reviewMail} className="supplier-row">
                    <input type="hidden" name="id" value={m.id} />
                    {m.status === "draft" && (
                      <button
                        className="button button-outline"
                        name="action"
                        value="approve"
                      >
                        Aprovar este texto e destinatário
                      </button>
                    )}
                    <button
                      className="button button-outline"
                      name="action"
                      value="cancel"
                    >
                      Cancelar rascunho
                    </button>
                  </form>
                )}
                {m.status === "approved" && (
                  <form action={sendMail} className="supplier-form">
                    <input type="hidden" name="id" value={m.id} />
                    <label>
                      <input
                        type="checkbox"
                        name="confirm"
                        value="send"
                        required
                      />{" "}
                      Confirmo o envio real deste e-mail.
                    </label>
                    <button
                      className="button button-primary"
                      disabled={!sendEnabled}
                    >
                      Enviar e-mail aprovado
                    </button>
                  </form>
                )}
              </article>
            ))
          )}
          <h3>Histórico de contatos e autorizações</h3>
          {!events?.length ? (
            <p>Sem eventos nesta página.</p>
          ) : (
            events.map((e) => (
              <p key={e.id}>
                {dates(e.created_at)} · {e.event_type}
                <br />
                {e.details}
              </p>
            ))
          )}
          <nav className="supplier-row" aria-label="Páginas do histórico">
            {historyPage > 1 && (
              <Link href={`?id=${s.id}&historyPage=${historyPage - 1}`}>
                Mais recentes
              </Link>
            )}
            {events?.length === 30 && (
              <Link href={`?id=${s.id}&historyPage=${historyPage + 1}`}>
                Mais antigos
              </Link>
            )}
          </nav>
        </section>
      )}
    </div>
  );
}
