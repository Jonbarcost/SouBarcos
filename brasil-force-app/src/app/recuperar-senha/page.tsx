import Link from "next/link";
import { AuthPage } from "@/components/auth-page";
import { ActionForm } from "@/components/action-form";
import { CaptchaField } from "@/components/captcha-field";
import { captchaSiteKey } from "@/lib/captcha";
import { recover } from "@/app/auth/actions";
import { registrationEnabled } from "@/lib/config";
export default function Recover() {
  return (
    <AuthPage
      title="Recupere seu acesso."
      description="Enviaremos as instruções para o seu e-mail."
    >
      <ActionForm
        action={recover}
        label="Enviar instruções"
        disabled={!registrationEnabled()}
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
        <CaptchaField siteKey={captchaSiteKey()} />
      </ActionForm>
      <p className="form-foot"><Link href="/entrar">← Voltar para entrar</Link></p>
    </AuthPage>
  );
}
