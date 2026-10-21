import { z } from "zod";
import { directHelpTopic, helpTopics, type HelpTopic } from "./assistant-help";
import {
  assistantInput,
  assistantContext,
  safeSearchTerm,
  type CatalogHit,
  type ConversationMessage,
} from "./assistant";

export type AssistantMetric = {
  event: "assistant_request";
  status: number;
  outcome: string;
  duration_ms: number;
};
export type AssistantDependencies = {
  enabled: boolean;
  authenticate: () => Promise<boolean>;
  consumeQuota: () => Promise<boolean>;
  search: (term: string) => Promise<CatalogHit[]>;
  recommend?: (
    question: string,
    products: CatalogHit[],
    history: ConversationMessage[],
  ) => Promise<unknown>;
  metric?: (event: AssistantMetric) => void;
};
const selectionSchema = z
  .object({
    answer: z.string().trim().min(2).max(1800),
    product_ids: z.array(z.uuid()).max(8),
    guidance: z.enum([
      "compare",
      "refine",
      "human_review",
      "greeting",
      "help",
      "sell",
      "contact",
      "account",
      "payment",
      "rules",
    ]),
  })
  .strict();
// Commercial cards and navigation are server-owned. Generated text cannot supply them.
function validConversationText(answer: string) {
  return !/(?:https?:|www\.|mailto:|\b[\w.+-]+@[\w.-]+\.[a-z]{2,}|R\$|US\$|€|\$|\b\d+[.,]?\d*\s*(?:reais|euros|d[oó]lares)|(?:pagamento|pedido)\s+(?:foi\s+)?confirmado|voc[eê]\s+foi\s+aprovad[oa])/i.test(
    answer,
  );
}

/** Read actual bytes; Content-Length is only an early check, never the limit itself. */
export async function readLimitedJson(
  request: Request,
  limit = 4096,
): Promise<unknown> {
  const length = request.headers.get("content-length");
  if (length && (!/^\d+$/.test(length) || Number(length) > limit))
    throw new RangeError();
  if (!request.body) throw new SyntaxError();
  const reader = request.body.getReader();
  let size = 0;
  const chunks: Uint8Array[] = [];
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limit) {
        await reader.cancel();
        throw new RangeError();
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
}
export async function handleAssistant(
  request: Request,
  deps: AssistantDependencies,
): Promise<Response> {
  const started = Date.now();
  const finish = (status: number, body: unknown, outcome: string) => {
    deps.metric?.({
      event: "assistant_request",
      status,
      outcome,
      duration_ms: Date.now() - started,
    });
    return Response.json(body, {
      status,
      headers: {
        "Cache-Control": "no-store",
        ...(status === 429 ? { "Retry-After": "60" } : {}),
      },
    });
  };
  const error = (status: number, message: string, outcome: string) =>
    finish(status, { error: message }, outcome);
  if (request.method !== "POST")
    return error(405, "Método não permitido.", "method");
  if (!deps.enabled) return error(503, "Assistente em preparação.", "disabled");
  const origin = request.headers.get("origin");
  try {
    if (origin && new URL(origin).origin !== new URL(request.url).origin)
      return error(403, "Origem não autorizada.", "origin");
  } catch {
    return error(403, "Origem não autorizada.", "origin");
  }
  if (
    ["cross-site", "same-site"].includes(
      request.headers.get("sec-fetch-site") ?? "",
    )
  )
    return error(403, "Origem não autorizada.", "origin");
  if (
    request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !==
    "application/json"
  )
    return error(415, "Envie uma mensagem em JSON.", "content_type");
  let body: unknown;
  try {
    body = await readLimitedJson(request, 32768);
  } catch (e) {
    return error(
      e instanceof RangeError ? 413 : 400,
      e instanceof RangeError
        ? "Mensagem muito grande."
        : "Requisição inválida.",
      "body",
    );
  }
  const parsed = assistantInput.safeParse(body);
  if (!parsed.success)
    return error(
      400,
      "Envie uma pergunta de 2 a 500 caracteres e um histórico válido.",
      "input",
    );
  try {
    if (!(await deps.authenticate()))
      return error(
        401,
        "Entre em uma conta verificada e habilitada para conversar.",
        "auth",
      );
  } catch {
    return error(503, "Serviço indisponível.", "auth_error");
  }
  try {
    if (!(await deps.consumeQuota()))
      return error(
        429,
        "Limite de perguntas atingido. Tente novamente mais tarde.",
        "quota",
      );
  } catch {
    return error(503, "Controle de uso indisponível.", "quota_error");
  }
  const topic = directHelpTopic(parsed.data.question);
  const basicHelp = () =>
    finish(
      200,
      {
        ...helpTopics[topic!],
        products: [],
        mode: "help",
        notice:
          "A conversa com IA está indisponível no momento. Esta é uma orientação básica da plataforma.",
      },
      "help_" + topic,
    );
  if (topic && !deps.recommend) return basicHelp();
  let products: CatalogHit[];
  try {
    // Include recent user context so short follow-ups can still retrieve the equipment.
    const questions = [
      parsed.data.question,
      ...parsed.data.history
        .filter((m) => m.role === "user")
        .slice(-2)
        .reverse()
        .map((m) => m.content),
    ];
    const terms = [
      ...new Set(questions.map(safeSearchTerm).filter(Boolean)),
    ].slice(0, 3);
    const hits = topic
      ? []
      : (await Promise.all(terms.map((term) => deps.search(term)))).flat();
    products = assistantContext(
      [...new Map(hits.map((hit) => [hit.id, hit])).values()].slice(0, 8),
    );
  } catch {
    return error(
      503,
      "Não foi possível consultar o catálogo.",
      "catalog_error",
    );
  }
  const catalogFallback = () =>
    finish(
      200,
      {
        answer: products.length
          ? "Encontrei estes anúncios. A seleção por IA está indisponível no momento; você pode conferir os dados abaixo."
          : "Não encontrei anúncios com esse termo. Tente o nome do equipamento, como mochila ou lanterna, ou explore as categorias. Se sua pergunta não era uma busca, conte um pouco mais para eu orientar você.",
        products,
        links: [
          { href: "/catalogo", label: "Explorar catálogo" },
          { href: "/ajuda", label: "Central de ajuda" },
        ],
        mode: "catalog",
        notice:
          "A conversa com IA está indisponível no momento. Mostrando apenas o resultado da busca.",
      },
      products.length ? "catalog" : "empty",
    );
  if (!deps.recommend) return catalogFallback();
  try {
    const selection = selectionSchema.parse(
      await deps.recommend(parsed.data.question, products, parsed.data.history),
    );
    const ids = new Set(selection.product_ids);
    if (
      ids.size !== selection.product_ids.length ||
      selection.product_ids.some((id) => !products.some((p) => p.id === id))
    )
      throw Error();
    if (!validConversationText(selection.answer)) throw Error();
    const links =
      selection.guidance in helpTopics
        ? helpTopics[selection.guidance as HelpTopic].links
        : [
            {
              href:
                selection.guidance === "human_review" ? "/ajuda" : "/catalogo",
              label:
                selection.guidance === "human_review"
                  ? "Falar com a equipe"
                  : "Explorar catálogo",
            },
          ];
    return finish(
      200,
      {
        answer: selection.answer,
        products: products.filter((p) => ids.has(p.id)),
        links,
        mode: "ai",
      },
      "ai",
    );
  } catch {
    if (topic) return basicHelp();
    return error(
      503,
      "Não consegui elaborar a resposta agora. Tente novamente em instantes ou consulte a central de ajuda.",
      "gateway_error",
    );
  }
}
