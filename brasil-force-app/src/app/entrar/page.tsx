import Link from "next/link";
import { AuthPage } from "@/components/auth-page";
import { ActionForm } from "@/components/action-form";
import { PasswordVisibilityInput } from "@/components/password-visibility-input";
import { authConfigured } from "@/lib/config";
import { login } from "@/app/auth/actions";
export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  return (
    <AuthPage
      title="Bom ter você de volta."
      description="Entre para acompanhar sua jornada na Brasil Force."
    >
      {status && (
        <p role="status">
          {status === "password"
            ? "Senha alterada. Entre novamente."
            : status === "logout"
              ? "Sessões encerradas."
              : "Confira sua conta ou tente entrar novamente."}
        </p>
      )}
      <ActionForm
        action={login}
        label="Entrar na minha conta"
        disabled={!authConfigured()}
      >
        <label>
          E-mail
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            maxLength={254}
          />
        </label>
        <label>
          Senha
          <PasswordVisibilityInput />
        </label>
        <Link className="text-link" href="/recuperar-senha">
          Esqueci minha senha
        </Link>
      </ActionForm>
      {authConfigured() &&
        ["google", "apple"]
          .filter(
            (p) => process.env[`AUTH_${p.toUpperCase()}_ENABLED`] === "true",
          )
          .map((p) => (
            <a
              className="button oauth"
              href={"/auth/oauth?provider=" + p}
              key={p}
            >
              Continuar com {p === "google" ? "Google" : "Apple"}
            </a>
          ))}
      <p className="form-foot">
        Ainda não faz parte? <Link href="/cadastro">Criar conta</Link>
      </p>
    </AuthPage>
  );
}
