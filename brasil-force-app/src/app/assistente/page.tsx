import Link from "next/link";
import { PageTitle, Notice } from "@/components/shell";
import { AssistantChat } from "@/components/assistant-chat";
export const metadata = {
  title: "Assistente inteligente | Brasil Force",
  description: "Converse sobre equipamentos realmente disponíveis no Brasil Force.",
};
export default function Assistente() {
  return <div className="container page narrow">
    <PageTitle title="Assistente Brasil Force" description="Seu equipamento, com informações do catálogo real." />
    <Notice>
      Acesso mediante login verificado. O assistente consulta apenas anúncios comuns
      aprovados e disponíveis. Não realiza compras nem autoriza itens restritos.
    </Notice>
    <AssistantChat />
    <p><Link className="text-link" href="/explorar">Explorar categorias →</Link></p>
    <p><Link className="text-link" href="/entrar">Entrar na minha conta →</Link></p>
  </div>;
}
