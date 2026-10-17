import { PageTitle } from "@/components/shell";
import { logout } from "@/app/auth/actions";
export default function Unavailable() {
  return (
    <div className="container page narrow">
      <PageTitle
        title="Acesso indisponível"
        description="Não foi possível validar sua conta. Ela pode estar suspensa ou a configuração pode estar incompleta."
      />
      <form action={logout}>
        <button className="button button-primary">
          Sair e tentar novamente
        </button>
      </form>
    </div>
  );
}
