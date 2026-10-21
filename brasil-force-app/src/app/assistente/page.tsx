import Link from "next/link";
import { PageTitle, Notice } from "@/components/shell";
import { AssistantChat } from "@/components/assistant-chat";
import { authConfigured } from "@/lib/config";

export const metadata = {
  title: "Assistente inteligente | Brasil Force",
  description:
    "Converse sobre equipamentos, vendas e sua jornada no Brasil Force.",
};

export default function Assistente() {
  const enabled = process.env.BF_AI_ENABLED === "true" && authConfigured();

  return (
    <div className="container page narrow">
      <PageTitle
        title="Assistente Brasil Force"
        description="Conte o que precisa. Vamos pensar no seu próximo passo."
      />
      {enabled ? (
        <>
          <Notice>
            Acesso mediante login verificado. O assistente consulta apenas
            anúncios comuns aprovados e disponíveis. Não realiza compras nem
            autoriza itens restritos.
          </Notice>
          <AssistantChat />
          <p>
            <Link className="text-link" href="/entrar">
              Entrar na minha conta →
            </Link>
          </p>
        </>
      ) : (
        <Notice>
          Assistente em preparação. A conversa por IA ainda não está disponível.
          Enquanto isso, explore os anúncios reais do catálogo.
        </Notice>
      )}
      <p>
        <Link className="text-link" href="/catalogo">
          Explorar o catálogo →
        </Link>
      </p>
    </div>
  );
}
