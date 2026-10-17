import { PageTitle, Notice } from "@/components/shell";
export default function Page() {
  return (
    <div className="container page narrow prose">
      <PageTitle
        title="Privacidade"
        description="Transparência desde a fundação."
      />
      <Notice>
        Minuta de pré-abertura — não é uma política comercial final.
      </Notice>
      <h2>Dados necessários</h2>
      <p>
        A fundação utiliza e-mail, nome de exibição, autenticação e vínculo
        opcional. Documentos de identidade e dados fiscais não devem ser
        coletados antes da definição de finalidade, retenção, acesso e do fluxo
        de verificação.
      </p>
      <h2>Acesso e finalidade</h2>
      <p>
        Dados pessoais de perfil não são públicos. Serão utilizados para acesso
        à conta, segurança e operação autorizada da plataforma. Não são exibidos
        endereço residencial, documentos ou dados operacionais sensíveis.
      </p>
      <h2>Antes da abertura</h2>
      <p>
        É necessário identificar formalmente o controlador, contato de
        privacidade, operadores, bases legais, prazos de retenção,
        transferências internacionais e canal de exercício de direitos. O texto
        final requer revisão jurídica.
      </p>
    </div>
  );
}
