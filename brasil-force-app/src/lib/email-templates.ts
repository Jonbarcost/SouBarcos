import { teamInbox, type Mail } from "./mailer";

/**
 * Branded transactional e-mails. Table layout and inline styles for e-mail
 * clients; every user-provided value goes through `esc`.
 */
const SITE = "https://brasilforce.com.br";
const CONTACT = "contato@brasilforce.com.br";

export function esc(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

type Block = { heading: string; paragraphs: string[]; cta?: { label: string; href: string }; steps?: string[] };

function layout({ heading, paragraphs, cta, steps }: Block) {
  const body = paragraphs
    .map((p) => `<p style="margin:0 0 16px;font-size:16px;line-height:1.65;color:#dfe6dc">${p}</p>`)
    .join("");
  const list = steps?.length
    ? `<ol style="margin:4px 0 22px;padding-left:22px;color:#dfe6dc;font-size:15px;line-height:1.8">${steps
        .map((s) => `<li>${s}</li>`)
        .join("")}</ol>`
    : "";
  const button = cta
    ? `<p style="margin:26px 0 30px;text-align:center"><a href="${cta.href}" style="display:inline-block;background:#e9c98a;color:#0f1f19;font-size:15px;font-weight:bold;letter-spacing:.5px;padding:15px 28px;border-radius:999px;text-decoration:none">${cta.label}</a></p>`
    : "";
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Brasil Force</title></head>
<body style="margin:0;padding:24px 12px;background:#0b1712;font-family:Arial,Helvetica,sans-serif">
<table role="presentation" width="100%" style="max-width:600px;margin:0 auto;border-spacing:0;background:#14301f;border:1px solid #2f5a42;border-radius:18px;overflow:hidden">
<tr><td style="height:4px;background:linear-gradient(90deg,#1e8054,#e9c98a)"></td></tr>
<tr><td style="padding:30px 32px 8px">
<p style="margin:0 0 22px;color:#e9c98a;font-size:12px;letter-spacing:2.5px;font-weight:bold">BRASIL FORCE · SUA MISSÃO. SEU EQUIPAMENTO.</p>
<h1 style="margin:0 0 20px;font-size:26px;line-height:1.25;color:#fffaf0">${heading}</h1>
${body}${list}${button}
</td></tr>
<tr><td style="padding:18px 32px 28px;border-top:1px solid #2f5a42">
<p style="margin:0 0 6px;font-size:13px;line-height:1.6;color:#a9bbae">Dúvidas? Responda este e-mail ou escreva para <a href="mailto:${CONTACT}" style="color:#e9c98a">${CONTACT}</a>.</p>
<p style="margin:0;font-size:12px;line-height:1.6;color:#7f9585">Brasil Force · plataforma independente, sem vínculo ou endosso institucional. Nunca pedimos sua senha por e-mail.</p>
</td></tr></table></body></html>`;
}

function text(block: Block) {
  const strip = (s: string) => s.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
  return [
    "BRASIL FORCE",
    "",
    strip(block.heading),
    "",
    ...block.paragraphs.map(strip),
    ...(block.steps ?? []).map((s, i) => `${i + 1}. ${strip(s)}`),
    block.cta ? `\n${block.cta.label}: ${block.cta.href}` : "",
    "",
    `Dúvidas: ${CONTACT}`,
  ].join("\n");
}

function mail(to: string, subject: string, block: Block, replyTo?: string): Mail {
  return { to, subject, html: layout(block), text: text(block), replyTo };
}

export type Intent = "buyer" | "seller";

export function welcomeEmail(to: string, name: string, intent: Intent): Mail {
  const first = esc(name.split(/\s+/)[0] || name);
  return intent === "seller"
    ? mail(to, "Conta confirmada: próximo passo para vender na Brasil Force", {
        heading: `Bem-vindo à tropa, ${first}.`,
        paragraphs: [
          "Seu e-mail foi confirmado e sua conta está ativa.",
          "Para anunciar, falta solicitar a habilitação de vendedor. Leva poucos minutos:",
        ],
        steps: [
          "Acesse <strong>Como vender</strong> e envie a solicitação inicial.",
          "Nossa equipe analisa e pode pedir correções pelo próprio painel.",
          "Com a aprovação, você cria anúncios, que também passam por moderação.",
        ],
        cta: { label: "SOLICITAR HABILITAÇÃO", href: `${SITE}/vender` },
      })
    : mail(to, "Conta confirmada: bem-vindo à Brasil Force", {
        heading: `Missão aceita, ${first}.`,
        paragraphs: [
          "Seu e-mail foi confirmado e sua conta está ativa.",
          "Estamos em pré-abertura: o catálogo está sendo preparado e as compras serão liberadas em breve. Você será um dos primeiros a saber.",
          "Enquanto isso, explore as categorias, converse com o assistente e ative a verificação em duas etapas em <strong>Minha conta</strong> para proteger seu acesso.",
        ],
        cta: { label: "EXPLORAR A BRASIL FORCE", href: SITE },
      });
}

export function sellerApplicationEmails(to: string, displayName: string, personType: string) {
  const name = esc(displayName);
  const kind = personType === "company" ? "Pessoa jurídica" : "Pessoa física";
  return [
    mail(to, "Recebemos sua solicitação para vender na Brasil Force", {
      heading: "Solicitação recebida.",
      paragraphs: [
        `Obrigado, ${name}. Sua solicitação de habilitação como vendedor entrou na fila de análise.`,
        "Acompanhe o status a qualquer momento na página Como vender. Se precisarmos de alguma correção, avisaremos por lá e por e-mail.",
        "Importante: a venda só é liberada após a aprovação. Não envie documentos por e-mail ou por canais não oficiais.",
      ],
      cta: { label: "ACOMPANHAR SOLICITAÇÃO", href: `${SITE}/vender` },
    }),
    mail(teamInbox(), `Nova solicitação de vendedor: ${displayName.slice(0, 80)}`, {
      heading: "Nova solicitação de vendedor",
      paragraphs: [
        `<strong>Nome:</strong> ${name}<br><strong>Tipo:</strong> ${kind}<br><strong>Conta:</strong> ${esc(to)}`,
        "Revise no painel administrativo.",
      ],
      cta: { label: "ABRIR PAINEL", href: `${SITE}/admin` },
    }),
  ];
}

export const contactTopics = {
  duvida: "Dúvida geral",
  vender: "Quero vender",
  parceria: "Parceria ou fornecimento",
  imprensa: "Imprensa",
  outro: "Outro assunto",
} as const;
export type ContactTopic = keyof typeof contactTopics;

export function contactEmails(input: { name: string; email: string; topic: ContactTopic; message: string }) {
  const name = esc(input.name);
  const topic = contactTopics[input.topic];
  const message = esc(input.message).replace(/\n/g, "<br>");
  return [
    mail(
      teamInbox(),
      `[Contato site] ${topic}: ${input.name.slice(0, 60)}`,
      {
        heading: `Contato pelo site: ${esc(topic)}`,
        paragraphs: [
          `<strong>Nome:</strong> ${name}<br><strong>E-mail:</strong> ${esc(input.email)}`,
          `<span style="display:block;padding:14px 16px;border-left:3px solid #e9c98a;background:#0f2419;border-radius:6px">${message}</span>`,
          "Responder este e-mail responde diretamente à pessoa.",
        ],
      },
      input.email,
    ),
    // The auto-reply goes to an unverified address, so it never echoes anything
    // the visitor typed (name or message): the form cannot be used to relay spam.
    mail(input.email, "Recebemos sua mensagem | Brasil Force", {
      heading: "Mensagem recebida.",
      paragraphs: [
        `Obrigado por falar com a Brasil Force. Recebemos sua mensagem sobre <strong>${esc(topic)}</strong> e responderemos por este e-mail, normalmente em até 2 dias úteis.`,
        "Se você não enviou esta mensagem, pode ignorar este e-mail.",
      ],
      cta: { label: "VISITAR A BRASIL FORCE", href: SITE },
    }),
  ];
}
