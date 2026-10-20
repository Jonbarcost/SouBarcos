import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { institutions } from "@/lib/validation";
import { PageTitle } from "@/components/shell";
import { ActionForm } from "@/components/action-form";
import { saveProfile, logout } from "@/app/auth/actions";
export default async function Account() {
  const { db, user, account } = await requireUser();
  const { data: profile, error } = await db
    .from("bf_profiles")
    .select("display_name,institution")
    .eq("id", user.id)
    .single();
  if (error) throw new Error("Não foi possível carregar o perfil.");
  return (
    <div className="container page">
      <PageTitle
        title="Minha conta"
        description="Seus dados, suas preferências e sua segurança."
      />
      <div className="account-grid">
        <aside className="side-nav">
          <Link href="/conta">Meu perfil</Link>
          <Link href="/conta/seguranca">Segurança e sessões</Link>
          <Link href="/vender">Solicitar venda</Link>
          {["seller", "store"].includes(account.role) && (
            <Link href="/painel-vendedor">Painel do vendedor</Link>
          )}
          {["moderator", "admin", "superadmin"].includes(account.role) && (
            <Link href="/admin">Administração</Link>
          )}
          <form action={logout}>
            <button className="text-button">Sair da conta</button>
          </form>
        </aside>
        <section className="panel">
          <h2>Perfil pessoal</h2>
          <p>{user.email}</p>
          <ActionForm action={saveProfile} label="Salvar alterações">
            <label>
              Nome de exibição
              <input
                name="display_name"
                defaultValue={profile?.display_name ?? ""}
                minLength={2}
                maxLength={80}
                required
              />
            </label>
            <label>
              Vínculo autodeclarado (opcional)
              <select
                name="institution"
                defaultValue={profile?.institution ?? ""}
              >
                <option value="">Prefiro não informar</option>
                {institutions.map((i) => (
                  <option key={i}>{i}</option>
                ))}
              </select>
            </label>
            <small>
              Esta informação não comprova vínculo institucional e não gera selo
              de verificação. Não informe dados operacionais sensíveis.
            </small>
          </ActionForm>
        </section>
      </div>
    </div>
  );
}
