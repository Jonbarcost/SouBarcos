import Link from "next/link";
import { AuthPage } from "@/components/auth-page";
import { ActionForm } from "@/components/action-form";
import { signup } from "@/app/auth/actions";
import { registrationEnabled } from "@/lib/config";
export default function Signup() {
  return (
    <AuthPage
      title="Sua próxima missão começa aqui."
      description="Crie sua conta. Comprar e vender são permissões diferentes."
    >
      <ActionForm
        action={signup}
        label="Criar minha conta"
        disabled={!registrationEnabled()}
      >
        <label>
          Nome de exibição
          <input
            name="name"
            required
            minLength={2}
            maxLength={80}
            autoComplete="name"
          />
        </label>
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
          <input
            name="password"
            type="password"
            required
            minLength={12}
            maxLength={128}
            autoComplete="new-password"
          />
          <small>Pelo menos 12 caracteres.</small>
        </label>
        <label className="check">
          <input name="terms" type="checkbox" required />
          <span>
            Li os <Link href="/termos">termos de uso</Link> e a{" "}
            <Link href="/privacidade">política de privacidade</Link>.
          </span>
        </label>
      </ActionForm>
      <p className="form-foot">
        Já possui conta? <Link href="/entrar">Entrar</Link>
      </p>
    </AuthPage>
  );
}
