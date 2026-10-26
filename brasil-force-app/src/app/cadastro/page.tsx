import Link from "next/link";
import { ShoppingBag, Store } from "lucide-react";
import { AuthPage } from "@/components/auth-page";
import { ActionForm } from "@/components/action-form";
import { CaptchaField } from "@/components/captcha-field";
import { captchaSiteKey } from "@/lib/captcha";
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
        <fieldset className="bf-intent">
          <legend>O que você quer fazer na Brasil Force?</legend>
          <label className="bf-intent-option">
            <input type="radio" name="intent" value="buyer" defaultChecked />
            <span>
              <ShoppingBag size={22} aria-hidden="true" />
              <strong>Quero comprar</strong>
              <small>Explorar e acompanhar a abertura do catálogo.</small>
            </span>
          </label>
          <label className="bf-intent-option">
            <input type="radio" name="intent" value="seller" />
            <span>
              <Store size={22} aria-hidden="true" />
              <strong>Quero vender</strong>
              <small>Criar a conta e solicitar habilitação.</small>
            </span>
          </label>
        </fieldset>
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
        <CaptchaField siteKey={captchaSiteKey()} />
      </ActionForm>
      <p className="form-foot">
        Já possui conta? <Link href="/entrar">Entrar</Link>
      </p>
    </AuthPage>
  );
}
