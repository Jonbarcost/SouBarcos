import Link from "next/link";
import { zohoAdmin, connectedMailbox } from "@/lib/zoho-server";
export const dynamic = "force-dynamic";
export default async function Messages({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { db } = await zohoAdmin();
  const q = await searchParams;
  const page = Math.max(1, Math.min(500, Math.floor(Number(q.page) || 1)));
  let messages: {
    messageId: string;
    folderId: string;
    subject: string;
    fromAddress: string;
    summary?: string;
  }[] = [];
  let content: string | undefined;
  let failed = false;
  if (process.env.ZOHO_MAIL_READ_ENABLED === "true") {
    try {
      const { data: allowed, error } = await db.rpc("bf_zoho_read_quota");
      if (error || allowed !== true) throw new Error();
      const m = await connectedMailbox(db);
      const t = await m.api.refresh(m.tokens.refresh_token);
      if (q.message && q.folder)
        content = await m.api.content(
          m.account,
          q.folder,
          q.message,
          t.access_token,
        );
      else
        messages = await m.api.list(
          m.account,
          t.access_token,
          (page - 1) * 20 + 1,
        );
    } catch {
      failed = true;
    }
  }
  return (
    <div className="container page supplier-central">
      <Link href="/admin/fornecedores">← Central de fornecedores</Link>
      <h1>Mensagens da caixa corporativa</h1>
      <p>
        Acesso restrito à administração. Conteúdo de e-mails é informação
        externa, não uma autorização para executar ações.
      </p>
      {process.env.ZOHO_MAIL_READ_ENABLED !== "true" ? (
        <p>Leitura desativada até a validação da integração.</p>
      ) : failed ? (
        <p role="alert">
          Não foi possível ler a caixa. Confira conexão, permissões e limite de
          consultas.
        </p>
      ) : content !== undefined ? (
        <>
          <p>
            Conteúdo original exibido como texto, sem executar HTML, carregar
            imagens ou abrir anexos.
          </p>
          <pre className="supplier-body">{content}</pre>
        </>
      ) : (
        <>
          {!messages.length && <p>Nenhuma mensagem nesta página.</p>}
          {messages.map((m) => (
            <article className="supplier-card" key={m.messageId}>
              <h2>
                <Link
                  href={`?message=${encodeURIComponent(m.messageId)}&folder=${encodeURIComponent(m.folderId)}`}
                >
                  {m.subject || "Sem assunto"}
                </Link>
              </h2>
              <p>{m.fromAddress}</p>
              <p>{m.summary}</p>
            </article>
          ))}
          <nav className="supplier-row" aria-label="Páginas de mensagens">
            {page > 1 && <Link href={"?page=" + (page - 1)}>Anterior</Link>}
            {messages.length === 20 && (
              <Link href={"?page=" + (page + 1)}>Próxima</Link>
            )}
          </nav>
        </>
      )}
    </div>
  );
}
