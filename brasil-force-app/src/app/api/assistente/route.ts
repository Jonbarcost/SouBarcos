import { NextResponse } from "next/server";
import { serverClient } from "@/lib/supabase/server";
import { authConfigured } from "@/lib/config";
import { assistantContext, assistantInput, assistantRules, safeSearchTerm } from "@/lib/assistant";

export const runtime = "nodejs";
const noStore = { "Cache-Control": "no-store" };

export async function POST(request: Request) {
  if (process.env.BF_AI_ENABLED !== "true") return NextResponse.json({ error: "Assistente em preparação." }, { status: 503, headers: noStore });
  if (!authConfigured()) return NextResponse.json({ error: "Serviço indisponível." }, { status: 503, headers: noStore });
  const db = await serverClient();
  const { data: { user }, error: authError } = await db.auth.getUser();
  if (authError || !user || !user.email_confirmed_at) {
    return NextResponse.json({ error: "Entre em uma conta verificada para conversar." }, { status: 401, headers: noStore });
  }
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (origin) {
    let sameOrigin = false;
    try { sameOrigin = Boolean(host && new URL(origin).host === host); } catch {}
    if (!sameOrigin) return NextResponse.json({ error: "Origem não autorizada." }, { status: 403, headers: noStore });
  }
  if (request.headers.get("sec-fetch-site") === "cross-site") {
    return NextResponse.json({ error: "Origem não autorizada." }, { status: 403, headers: noStore });
  }
  const length = Number(request.headers.get("content-length") || 0);
  if (length > 4096) return NextResponse.json({ error: "Mensagem muito grande." }, { status: 413, headers: noStore });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Requisição inválida." }, { status: 400, headers: noStore }); }
  const parsed = assistantInput.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Escreva uma pergunta de 3 a 500 caracteres." }, { status: 400, headers: noStore });
  const { data: quotaAllowed, error: quotaError } = await db.rpc("bf_ai_consume_quota");
  if (quotaError) return NextResponse.json({ error: "Controle de uso indisponível." }, { status: 503, headers: noStore });
  if (quotaAllowed !== true) return NextResponse.json({ error: "Limite de perguntas atingido. Tente novamente mais tarde." }, { status: 429, headers: noStore });
  const question = parsed.data.question;
  const term = safeSearchTerm(question);
  const { data, error } = await db.from("bf_listings")
    .select("id,title,price_cents,category_slug,stock")
    .eq("status", "approved").eq("classification", "free").gt("stock", 0)
    .ilike("title", "%" + term + "%").limit(8);
  if (error) return NextResponse.json({ error: "Não foi possível consultar o catálogo." }, { status: 503, headers: noStore });
  const products = assistantContext(data ?? []);
  if (!products.length) {
    return NextResponse.json({
      answer: "Não encontrei anúncios disponíveis com esses termos. Tente pesquisar um nome mais curto, como mochila, lanterna ou bota. Não vou sugerir produtos inexistentes.",
      products: [],
      mode: "catalog",
    }, { headers: noStore });
  }
  const key = process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN;
  const model = process.env.BF_AI_MODEL;
  if (!key || !model) return NextResponse.json({
    answer: "Encontrei anúncios disponíveis. A explicação por IA ainda depende da configuração do serviço.",
    products, mode: "catalog",
  }, { headers: noStore });
  try {
    const response = await fetch("https://ai-gateway.vercel.sh/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: "Bearer " + key, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        max_tokens: 350,
        messages: [
          { role: "system", content: assistantRules },
          { role: "user", content: JSON.stringify({ question, products }) },
        ],
      }),
      signal: AbortSignal.timeout(12000),
      cache: "no-store",
    });
    if (!response.ok) return NextResponse.json({ error: "Serviço de IA temporariamente indisponível." }, { status: 503, headers: noStore });
    const result: unknown = await response.json();
    const answer = (result as {choices?:{message?:{content?:unknown}}[]})?.choices?.[0]?.message?.content;
    if (typeof answer !== "string" || !answer.trim()) throw new Error("Empty AI response");
    return NextResponse.json({ answer: answer.slice(0, 3000), products, mode: "ai" }, { headers: noStore });
  } catch {
    return NextResponse.json({ error: "Não foi possível obter uma resposta da IA agora." }, { status: 503, headers: noStore });
  }
}
