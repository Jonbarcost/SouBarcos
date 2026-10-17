import Link from "next/link";
import { UserRound, ArrowUpRight } from "lucide-react";
import { Brand } from "./brand";
export function Header() {
  return (
    <header className="header">
      <div className="container header-inner">
        <Brand />
        <nav aria-label="Navegação principal">
          <Link href="/catalogo">Catálogo</Link>
          <Link href="/assistente">Assistente IA</Link>
          <Link href="/vender">Como vender</Link>
          <Link href="/ajuda">Ajuda</Link>
        </nav>
        <Link className="account-link" href="/conta">
          <UserRound size={19} />
          <span>Minha conta</span>
        </Link>
      </div>
    </header>
  );
}
export function Footer() {
  return (
    <footer>
      <div className="container footer-top">
        <Brand />
        <p>Equipamentos, histórias e novas jornadas.</p>
        <Link href="/vender">
          Faça parte <ArrowUpRight size={16} />
        </Link>
      </div>
      <div className="container footer-bottom">
        <span>
          © {new Date().getFullYear()} Brasil Force · Plataforma em preparação
        </span>
        <div>
          <Link href="/regras">Produtos permitidos</Link>
          <Link href="/privacidade">Privacidade</Link>
          <Link href="/termos">Termos</Link>
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
