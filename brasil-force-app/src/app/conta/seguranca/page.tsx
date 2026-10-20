import { requireUser } from "@/lib/auth";
import { PageTitle, Notice } from "@/components/shell";
import { Mfa } from "@/components/mfa";
import { ActionForm } from "@/components/action-form";
import { logoutEverywhere } from "@/app/auth/actions";
export default async function Security() {
  const { db } = await requireUser();
  const { data } = await db.auth.mfa.getAuthenticatorAssuranceLevel();
  return (
    <div className="container page narrow">
      <PageTitle
        title="Segurança da conta"
        description="Proteja seu acesso e encerre sessões em outros dispositivos."
      />
      <section className="panel">
        <h2>Autenticação em duas etapas</h2>
        <Notice>
          {data?.currentLevel === "aal2"
            ? "Segundo fator confirmado nesta sessão."
            : "Obrigatório para acessar áreas administrativas."}
        </Notice>
        <Mfa />
      </section>
      <section className="panel">
        <h2>Encerrar todas as sessões</h2>
        <Notice>
          O login é compartilhado com o SouBarcos. Encerrar todas as sessões
          também desconecta essa mesma conta nos outros aplicativos deste
          projeto.
        </Notice>
        <p>
          Você precisará entrar novamente em todos os dispositivos, inclusive
          neste.
        </p>
        <ActionForm
          action={logoutEverywhere}
          label="Sair de todos os dispositivos"
        >
          <label className="check">
            <input type="checkbox" required />
            <span>Confirmo o encerramento de todas as sessões.</span>
          </label>
        </ActionForm>
      </section>
    </div>
  );
}
