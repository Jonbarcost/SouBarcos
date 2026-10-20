import Link from "next/link";
import { redirect } from "next/navigation";
import { serverClient } from "@/lib/supabase/server";
import { authConfigured } from "@/lib/config";
import { ActionForm } from "@/components/action-form";
import { PageTitle, Notice } from "@/components/shell";
import { joinMarketplace } from "./actions";
export default async function Join() {
  if (!authConfigured()) redirect("/entrar");
  const db = await serverClient();
  const {
    data: { user },
    error,
  } = await db.auth.getUser();
  if (error || !user?.email_confirmed_at) redirect("/entrar");
  return (
    <div className="container page narrow">
      <PageTitle
        title="Faça parte da Brasil Force"
        description="Confirme sua adesão para criar seu perfil no marketplace."
      />
      <Notice>
        O serviço de login é compartilhado com o SouBarcos. O perfil e as
        permissões da Brasil Force são separados; sua conta não recebe
        autorização de venda automaticamente.
      </Notice>
      <ActionForm
        action={joinMarketplace}
        label="Criar meu perfil Brasil Force"
      >
        <label>
          Nome de exibição
          <input name="display_name" required minLength={2} maxLength={80} />
        </label>
        <label className="check">
          <input type="checkbox" name="terms" required />
          <span>
            Li os <Link href="/termos">termos</Link> e a{" "}
            <Link href="/privacidade">política de privacidade</Link> da Brasil
            Force.
          </span>
        </label>
      </ActionForm>
    </div>
  );
}
