import Link from "next/link";
import { ArrowUpRight, Compass, LifeBuoy } from "lucide-react";

export default function NotFound() {
  return (
    <div className="container bf-lost">
      <div className="bf-lost-compass" aria-hidden="true">
        <span>404</span>
        <Compass size={64} strokeWidth={1.1} />
      </div>
      <span className="bf-kicker">FORA DA ROTA</span>
      <h1>Rota não encontrada.</h1>
      <p>Esta página não existe ou mudou de lugar. Vamos encontrar outro caminho.</p>
      <div className="actions">
        <Link className="button button-primary bf-primary" href="/">
          Voltar ao início <ArrowUpRight size={18} aria-hidden="true" />
        </Link>
        <Link className="button bf-lost-secondary" href="/catalogo">
          Explorar o catálogo
        </Link>
        <Link className="bf-lost-help" href="/ajuda">
          <LifeBuoy size={16} aria-hidden="true" /> Central de ajuda
        </Link>
      </div>
    </div>
  );
}
