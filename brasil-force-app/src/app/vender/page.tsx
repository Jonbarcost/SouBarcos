import Link from "next/link";
import { PageTitle, Notice } from "@/components/shell";
import { authConfigured } from "@/lib/config";
import { serverClient } from "@/lib/supabase/server";
import { ActionForm } from "@/components/action-form";
import { SellerApplicationFields } from "@/components/seller-application-form";
import { sellerStatus } from "@/lib/seller-review";
import { applySeller, resubmitSeller } from "./actions";
export default async function Sell() {
  const db = authConfigured() ? await serverClient() : null;
  const user = db ? (await db.auth.getUser()).data.user : null;
  const result =
    user && db
      ? await db
          .from("bf_seller_applications")
          .select("id,display_name,person_type,status,revision")
          .eq("user_id", user.id)
          .maybeSingle()
      : null;
  const app = result?.data;
  const history =
    app && db
      ? await db
          .from("bf_seller_review_events")
          .select("id,to_status,reason,created_at,revision")
          .eq("application_id", app.id)
          .order("revision", { ascending: false })
          .limit(30)
      : null;
  return (
    <div className="container page narrow">
      <PageTitle
        title="Seu equipamento. Novas histórias."
        description="Faça parte da Brasil Force como vendedor ou loja profissional."
      />
      <div className="steps">
        <div>
          <b>01</b>
          <h3>Solicite sua habilitação</h3>
          <p>Informe o tipo de conta e aceite as regras.</p>
        </div>
        <div>
          <b>02</b>
          <h3>Acompanhe a análise</h3>
          <p>Veja o retorno da equipe e corrija os dados quando solicitado.</p>
        </div>
        <div>
          <b>03</b>
          <h3>Passe pela verificação</h3>
          <p>
            Identidade e procedência precisam ser verificadas antes de vender.
          </p>
        </div>
      </div>
      <Notice>
        A habilitação depende da verificação e da decisão administrativa. Não
        envie documentos por canais não verificados. Pagamentos e compras
        permanecem indisponíveis.
      </Notice>
      <section className="panel">
        <h2>{app ? "Sua solicitação" : "Solicitação inicial"}</h2>
        {result?.error ? (
          <p role="alert">
            Não foi possível consultar sua solicitação. Tente novamente.
          </p>
        ) : app ? (
          <>
            <p>
              Situação:{" "}
              <strong>{sellerStatus[app.status] ?? app.status}</strong>
            </p>
            <p>
              {app.display_name} ·{" "}
              {app.person_type === "company"
                ? "Pessoa jurídica"
                : "Pessoa física"}
            </p>
            {app.status === "changes_requested" && (
              <ActionForm action={resubmitSeller} label="Reenviar para análise">
                <input type="hidden" name="p_id" value={app.id} />
                <input type="hidden" name="p_revision" value={app.revision} />
                <SellerApplicationFields
                  name={app.display_name}
                  personType={app.person_type}
                  correction
                />
              </ActionForm>
            )}
            {app.status === "rejected" && (
              <p>
                Consulte o motivo no histórico. Para orientações, acesse a{" "}
                <Link href="/ajuda">central de ajuda</Link>.
              </p>
            )}
            {app.status === "approved" && (
              <Link href="/painel-vendedor" className="button button-primary">
                Acessar painel e criar anúncio
              </Link>
            )}
            <h3>Histórico recente</h3>
            {history?.error ? (
              <p role="alert">Não foi possível carregar o histórico.</p>
            ) : history?.data?.length ? (
              history.data.map((e) => (
                <div key={e.id} style={{ marginTop: 16 }}>
                  <strong>{sellerStatus[e.to_status]}</strong>
                  <p style={{ whiteSpace: "pre-wrap" }}>{e.reason}</p>
                  <small>
                    {new Date(e.created_at).toLocaleString("pt-BR")}
                  </small>
                </div>
              ))
            ) : (
              <p>
                Sua solicitação foi recebida. O retorno da equipe aparecerá
                aqui.
              </p>
            )}
          </>
        ) : user ? (
          <ActionForm action={applySeller} label="Enviar solicitação">
            <SellerApplicationFields />
          </ActionForm>
        ) : (
          <>
            <p>
              Entre na sua conta para solicitar habilitação. Novos cadastros
              serão liberados após a validação.
            </p>
            <Link href="/entrar" className="button button-primary">
              Entrar para solicitar
            </Link>
          </>
        )}
      </section>
    </div>
  );
}
