import { PageTitle, Notice } from "@/components/shell";
export default function Rules() {
  return (
    <div className="container page narrow prose">
      <PageTitle
        title="Produtos permitidos"
        description="Uma comunidade construída com responsabilidade."
      />
      <Notice>
        Política operacional inicial. A classificação de cada categoria deverá
        ser validada antes da abertura comercial.
      </Notice>
      <h2>Venda livre no lançamento</h2>
      <p>
        Vestuário de uso permitido, mochilas, bolsas, organização pessoal,
        camping, livros, miniaturas e colecionáveis de procedência lícita, desde
        que não sujeitos a restrição específica.
      </p>
      <h2>Revisão adicional</h2>
      <p>
        Uniformes, insígnias, objetos históricos, materiais de primeiros
        socorros e peças desativadas precisam de avaliação conforme sua natureza
        e procedência. Não se presume venda livre pelo nome da categoria.
      </p>
      <h2>Sem comercialização nesta versão</h2>
      <p>
        Armas, munições, explosivos, dispositivos perigosos, produtos
        controlados, equipamentos de origem ilícita e itens que permitam falsa
        identificação institucional não possuem fluxo de compra.
      </p>
      <h2>Moderação e contestação</h2>
      <p>
        Solicitações e anúncios ficam privados até análise. Aprovação interna
        não substitui autorização legal. O fluxo de decisão, justificativa e
        contestação será disponibilizado antes da abertura de anúncios.
      </p>
    </div>
  );
}
