import { AuthPage } from "@/components/auth-page";
import { ActionForm } from "@/components/action-form";
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
      </ActionForm>
    </AuthPage>
  );
}
