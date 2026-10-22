import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { PageTitle, Notice } from "@/components/shell";
export const metadata = {
  title: "Fornecedores",
  description:
    "Conheça o processo para participar do Brasil Force como fabricante, lojista ou prestador de serviços.",
};
export default function Suppliers() {
  return (
    <div className="container page">
      <PageTitle
        title="Seu trabalho. Novas conexões."
        description="Um espaço para quem fabrica, fornece e transforma equipamentos."
      />
      <p className="bf-supplier-intro">
        Estamos preparando um marketplace brasileiro para aproximar fabricantes,
        distribuidores, lojas e profissionais de quem procura equipamentos
        táticos, outdoor e serviços permitidos.
      </p>
      <div className="actions">
        <Link className="button button-primary" href="/vender">
          Conhecer o processo para vender{" "}
          <ArrowUpRight size={18} aria-hidden="true" />
        </Link>
        <Link className="button button-outline" href="/assistente">
          Tirar dúvidas com o assistente
        </Link>
      </div>
      <div className="bf-supplier-steps">
        <article>
          <span>01 / APRESENTAÇÃO</span>
          <h2>Conte o que você oferece.</h2>
          <p>
            Crie sua conta, confirme seu e-mail e acesse a solicitação de
            habilitação para vender.
          </p>
        </article>
        <article>
          <span>02 / ANÁLISE</span>
          <h2>Confiança antes da publicação.</h2>
          <p>
            A equipe avalia a solicitação. Você acompanha o status e eventuais
            pedidos de correção na sua área.
          </p>
        </article>
        <article>
          <span>03 / SEU CATÁLOGO</span>
          <h2>Prepare seus anúncios.</h2>
          <p>
            Depois da aprovação e das verificações necessárias, cadastre seus
            itens. Anúncios também passam por moderação.
          </p>
        </article>
      </div>
      <Notice>
        A plataforma está em pré-abertura. Compras e pagamentos ainda não estão
        disponíveis. Nenhum cadastro implica aprovação automática.
      </Notice>
      <section className="panel">
        <h2>Quer conversar sobre uma parceria?</h2>
        <p>
          Use o contato oficial para apresentar sua empresa. Não envie senhas ou
          documentos pessoais por e-mail.
        </p>
        <a className="text-link" href="mailto:contato@brasilforce.com.br">
          contato@brasilforce.com.br
        </a>
        <p>
          Qualquer participação promocional depende de consentimento e das
          condições confirmadas pela equipe. Não há contratação automática nesta
          página.
        </p>
      </section>
    </div>
  );
}
