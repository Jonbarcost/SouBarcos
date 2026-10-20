import { z } from "zod";
import {
  assistantInput,
  assistantContext,
  safeSearchTerm,
  type CatalogHit,
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
  recommend?: (question: string, products: CatalogHit[]) => Promise<unknown>;
  metric?: (event: AssistantMetric) => void;
};
const selectionSchema = z
  .object({
    product_ids: z.array(z.uuid()).max(8),
    guidance: z.enum(["compare", "refine", "human_review"]),
  })
  .strict();
const guidance = {
  compare:
    "Sim, senhor! Localizei equipamentos no catálogo. Missão: comparar os dados informados abaixo. Preço e disponibilidade devem ser conferidos antes de qualquer compra.",
  refine:
    "Às ordens! Estes são os anúncios encontrados. Informe o nome do equipamento ou uma categoria para refinar a busca, por gentileza.",
  human_review:
    "Sim, senhor! Esta solicitação exige análise humana. A indicação dos equipamentos não comprova certificação, compatibilidade institucional ou autorização para uso.",
};

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
    body = await readLimitedJson(request);
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
    return error(400, "Escreva uma pergunta de 3 a 500 caracteres.", "input");
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
  let products: CatalogHit[];
  try {
    const term = safeSearchTerm(parsed.data.question);
    products = term
      ? assistantContext(await deps.search(term)).slice(0, 8)
      : [];
  } catch {
    return error(
      503,
      "Não foi possível consultar o catálogo.",
      "catalog_error",
    );
  }
  if (!products.length)
    return finish(
      200,
      {
        answer:
          "Às ordens, senhor! No momento, não localizei anúncios disponíveis para esta missão. Por gentileza, tente buscar por mochila, lanterna, bota ou outro equipamento.",
        products: [],
        mode: "catalog",
      },
      "empty",
    );
  if (!deps.recommend)
    return finish(
      200,
      {
        answer:
          "Positivo, senhor! Encontrei anúncios disponíveis. O aconselhamento inteligente está temporariamente indisponível; confira os equipamentos abaixo.",
        products,
        mode: "catalog",
      },
      "catalog",
    );
  try {
    const selection = selectionSchema.parse(
      await deps.recommend(parsed.data.question, products),
    );
    const ids = new Set(selection.product_ids);
    if (
      ids.size !== selection.product_ids.length ||
      selection.product_ids.some((id) => !products.some((p) => p.id === id))
    )
      throw Error();
    return finish(
      200,
      {
        answer: guidance[selection.guidance],
        products: products.filter((p) => ids.has(p.id)),
        mode: "ai",
      },
      "ai",
    );
  } catch {
    return error(
      503,
      "Serviço de IA temporariamente indisponível.",
      "gateway_error",
    );
  }
}
