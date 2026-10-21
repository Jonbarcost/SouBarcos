/** Public guidance grounded in /vender, /ajuda and /regras; never account-specific decisions. */
export const helpTopics = {
  greeting: {
    answer: "Oi! Tudo bem? Posso ajudar a encontrar equipamentos, explicar como vender ou orientar sobre sua conta. O que você precisa?",
    links: [{ href: "/ajuda", label: "Central de ajuda" }],
  },
  help: {
    answer: "Claro! Qual é a sua dúvida? Pode me contar se é sobre um equipamento, sua conta, uma venda ou o funcionamento do Brasil Force.",
    links: [{ href: "/ajuda", label: "Central de ajuda" }],
  },
  sell: {
    answer: "Para vender, entre na sua conta e abra Quero vender. Preencha a solicitação de habilitação e acompanhe a análise nessa página. Se a equipe pedir ajustes, corrija os dados e reenvie. Depois da aprovação, o painel do vendedor permite criar anúncios, que também passam por moderação. O cadastro não aprova vendas automaticamente. Compras e pagamentos ainda estão indisponíveis.",
    links: [{ href: "/vender", label: "Solicitar ou acompanhar habilitação" }],
  },
  contact: {
    answer: "Qual é o nome do fornecedor ou o anúncio que você está consultando? Não tenho acesso a contatos privados e não envio mensagens em seu nome. Para dúvidas ou parcerias com o Brasil Force, a central de ajuda oferece o contato oficial da equipe.",
    links: [{ href: "/ajuda", label: "Contato oficial do Brasil Force" }],
  },
  account: {
    answer: "Você precisa de ajuda para entrar, confirmar o e-mail ou recuperar a senha? Use a página de entrada para acessar a conta e a opção de recuperação se esqueceu a senha. Não envie sua senha ou códigos de verificação nesta conversa.",
    links: [{ href: "/entrar", label: "Acessar minha conta" }, { href: "/ajuda", label: "Pedir ajuda à equipe" }],
  },
  payment: {
    answer: "Compras, pagamentos e entregas ainda estão indisponíveis no Brasil Force. Você pode consultar o catálogo e solicitar habilitação como vendedor. Não consigo concluir pedidos, cobrar valores ou confirmar pagamentos.",
    links: [{ href: "/ajuda", label: "Como a plataforma funciona" }],
  },
  rules: {
    answer: "O Brasil Force trabalha com produtos de venda livre, sujeitos às regras e à moderação. Armas, munições, explosivos e produtos controlados não têm compra habilitada. Consulte as regras antes de preparar um anúncio; eu não aprovo produtos nem documentos.",
    links: [{ href: "/regras", label: "Consultar regras de produtos" }],
  },
} as const;
export type HelpTopic = keyof typeof helpTopics;

/** Common requests should work even when the model provider is unavailable. */
export function directHelpTopic(question: string): HelpTopic | undefined {
  const q = question.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  if (/\b(fornecedor|fornecedores|contato|contactar|contatar)\b/.test(q)) return "contact";
  if (/\b(vender|venda|vendedor|anunciar|habilitacao|aprovacao|cadastrar produto)\b/.test(q)) return "sell";
  if (/\b(pagar|pagamento|pagamentos|frete|entrega|checkout|pix|cartao)\b/.test(q)) return "payment";
  if (/\b(senha|login|logar|email|e-mail|minha conta|entrar na conta)\b/.test(q)) return "account";
  if (/\b(regras|permitido|permitidos|proibido|controlado|armas|municoes)\b/.test(q)) return "rules";
  if (/^(oi|ola|bom dia|boa tarde|boa noite|tudo bem)[!?.\s]*(tudo bem[!?.\s]*)?$/.test(q.trim())) return "greeting";
  if (/\b(duvida|ajudar|ajuda)\b/.test(q) && !/\b(mochila|bota|lanterna|camping|equipamento)\b/.test(q)) return "help";
  return undefined;
}
