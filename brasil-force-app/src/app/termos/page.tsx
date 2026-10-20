import { PageTitle, Notice } from "@/components/shell";
export default function Page() {
  return (
    <div className="container page narrow prose">
      <PageTitle
        title="Termos de uso"
        description="Transparência desde a fundação."
      />
      <Notice>
        Minuta de pré-abertura — não é uma política comercial final.
      </Notice>
      <h2>Estado da plataforma</h2>
      <p>
        A Brasil Force está em desenvolvimento. Esta versão não oferece
        checkout, pagamentos, custódia, garantia comercial ou serviços de
        entrega.
      </p>
      <h2>Contas e vendedores</h2>
      <p>
        O cadastro não autoriza vendas. Vendedores dependem de verificação e
        aprovação; anúncios dependem de moderação individual. O usuário deve
        fornecer informações verdadeiras e proteger seu acesso.
      </p>
      <h2>Abertura comercial</h2>
      <p>
        Antes da operação, deverão estar definidos responsável legal,
        identificação empresarial, atendimento, regras contratuais, taxas,
        devoluções e disputas. Esta minuta não substitui os termos comerciais
        revisados.
      </p>
    </div>
  );
}
