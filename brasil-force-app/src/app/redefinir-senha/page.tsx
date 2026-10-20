import { AuthPage } from "@/components/auth-page";
import { ActionForm } from "@/components/action-form";
import { resetPassword } from "@/app/auth/actions";
import { requireUser } from "@/lib/auth";
export default async function Reset() {
  await requireUser();
  return (
    <AuthPage
      title="Defina sua nova senha."
      description="A senha é compartilhada com o SouBarcos. A alteração vale para a mesma conta em ambos e encerra suas sessões."
    >
      <ActionForm action={resetPassword} label="Salvar nova senha">
        <label>
          Nova senha
          <input
            name="password"
            type="password"
            required
            minLength={12}
            maxLength={128}
            autoComplete="new-password"
          />
        </label>
      </ActionForm>
    </AuthPage>
  );
}
