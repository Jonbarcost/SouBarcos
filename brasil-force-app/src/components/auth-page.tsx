import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { registrationEnabled } from "@/lib/config";
import { Notice } from "./shell";
export function AuthPage({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="container auth-layout">
      <aside className="auth-story">
        <ShieldCheck size={36} strokeWidth={1} />
        <h2>
          Pronto para
          <br />a próxima missão.
        </h2>
        <p>
          Uma comunidade para quem valoriza equipamento, história e confiança.
        </p>
        <span>BRASIL FORCE</span>
      </aside>
      <section className="auth-card">
        <Link className="back" href="/">
          ← Voltar ao início
        </Link>
        <h1>{title}</h1>
        <p>{description}</p>
        {!registrationEnabled() && (
          <Notice>
            Estamos preparando a abertura. Novos cadastros e recuperação serão
            liberados após validarmos o envio de e-mail.
          </Notice>
        )}
        {children}
      </section>
    </div>
  );
}
