import Link from "next/link";
import { ArrowUpRight, Sparkles, UserRound } from "lucide-react";
import { Brand } from "./brand";
import { FloatingAssistant } from "./floating-assistant";

const aiEnabled = process.env.BF_AI_ENABLED === "true";

export function Header() {
  return (
    <header className="header">
      <div className="container header-inner">
        <Brand />
        <nav aria-label="Navegação principal">
          <Link href="/catalogo">Catálogo</Link>
          {aiEnabled && <Link className="bf-nav-ai" href="/assistente"><Sparkles size={15} aria-hidden="true" /> Assistente IA</Link>}
          <Link href="/vender">Como vender</Link>
          <Link href="/ajuda">Ajuda</Link>
        </nav>
        <Link className="account-link" href="/conta">
          <UserRound size={19} aria-hidden="true" />
          <span>Minha conta</span>
        </Link>
      </div>
    </header>
  );
}

export function AssistantDock() {
  if (!aiEnabled) return null;
  return <FloatingAssistant />;
}

export function Footer() {
  return (
    <footer>
      <div className="container footer-top">
        <Brand />
        <p>Feito no Brasil. Preparado para sua próxima jornada.</p>
        <Link href="/vender">
          Faça parte <ArrowUpRight size={16} aria-hidden="true" />
        </Link>
      </div>
      <div className="container footer-bottom">
        <span>© {new Date().getFullYear()} Brasil Force · Anúncios sujeitos a moderação</span>
        <div>
          <Link href="/regras">Produtos permitidos</Link>
          <Link href="/privacidade">Privacidade</Link>
          <Link href="/termos">Termos</Link>
          <a href="mailto:contato@brasilforce.com.br">Contato</a>
        </div>
      </div>
    </footer>
  );
}

export function PageTitle({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="page-title">
      <Link href="/">Brasil Force</Link>
      <h1>{title}</h1>
      <p>{description}</p>
    </div>
  );
}

export function Notice({ children }: { children: React.ReactNode }) {
  return (
    <div className="notice" role="status">
      {children}
    </div>
  );
}
