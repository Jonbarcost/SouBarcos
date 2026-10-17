"use client";
import Link from "next/link";
import { useRef, useState, type FormEvent } from "react";
import type { CatalogHit } from "@/lib/assistant";
type Turn = {
  question: string;
  answer?: string;
  products: CatalogHit[];
  error?: string;
};
const suggestions = [
  "Preciso de uma mochila para camping.",
  "Estou procurando uma lanterna.",
  "Quero uma bota impermeável.",
];
export function AssistantChat() {
  const [question, setQuestion] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [loading, setLoading] = useState(false);
  const busy = useRef(false);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const text = question.trim();
    if (busy.current || text.length < 3) return;
    busy.current = true;
    setLoading(true);
    setQuestion("");
    setTurns((prev) => [...prev.slice(-19), { question: text, products: [] }]);
    let result: Partial<Turn>;
    try {
      const response = await fetch("/api/assistente", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: text }),
        cache: "no-store",
        signal: AbortSignal.timeout(20000),
      });
      const data = await response.json();
      result = response.ok
        ? { answer: data.answer, products: data.products ?? [] }
        : { error: data.error || "Falha na consulta." };
    } catch {
      result = {
        error: "Não foi possível concluir a consulta. Tente novamente.",
      };
    } finally {
      busy.current = false;
      setLoading(false);
    }
    setTurns((prev) =>
      prev.map((turn, index) =>
        index === prev.length - 1 ? { ...turn, ...result } : turn,
      ),
    );
  }
  return (
    <section className="panel" aria-labelledby="assistant-title">
      <h2 id="assistant-title">Converse sobre equipamentos</h2>
      <p>
        Busque por nomes e categorias. O histórico permanece apenas nesta página
        e é descartado ao sair.
      </p>
      <div className="listing-toolbar" aria-label="Sugestões de perguntas">
        {suggestions.map((text) => (
          <button
            key={text}
            className="button"
            type="button"
            disabled={loading}
            onClick={() => setQuestion(text)}
          >
            {text}
          </button>
        ))}
      </div>
      <div
        role="log"
        aria-label="Histórico da conversa"
        aria-live="polite"
        aria-relevant="additions text"
        aria-busy={loading}
      >
        {turns.map((turn, index) => (
          <article key={index} className="panel">
            <h3>Você</h3>
            <p style={{ whiteSpace: "pre-wrap" }}>{turn.question}</p>
            {turn.error ? (
              <p role="alert">{turn.error}</p>
            ) : turn.answer ? (
              <>
                <h3>Assistente Brasil Force</h3>
                <p>{turn.answer}</p>
                {turn.products.map((product) => (
                  <article key={product.id}>
                    <h4>
                      <Link href={`/catalogo/${product.id}`}>
                        {product.title}
                      </Link>
                    </h4>
                    <p>
                      {(product.price_cents / 100).toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}{" "}
                      · Estoque informado: {product.stock}
                    </p>
                  </article>
                ))}
              </>
            ) : (
              <p role="status">Consultando o catálogo…</p>
            )}
          </article>
        ))}
      </div>
      <form onSubmit={submit} className="search-form">
        <label htmlFor="bf-ai-question">O que você está procurando?</label>
        <input
          id="bf-ai-question"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          minLength={3}
          maxLength={500}
          required
          disabled={loading}
          placeholder="Ex.: mochila para camping"
        />
        <button
          className="button button-primary"
          disabled={loading || question.trim().length < 3}
        >
          {loading ? "Consultando…" : "Perguntar"}
        </button>
      </form>
    </section>
  );
}
