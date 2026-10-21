"use client";
import Link from "next/link";
import { Sparkles, Send, RotateCcw } from "lucide-react";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import type { CatalogHit, ConversationMessage } from "@/lib/assistant";
type Turn = {
  question: string;
  answer?: string;
  products: CatalogHit[];
  links?: { href: string; label: string }[];
  notice?: string;
  error?: string;
  requiresLogin?: boolean;
};
const suggestions = [
  "Escolher equipamento",
  "Quero vender",
  "Preciso de ajuda",
];
export function AssistantChat() {
  const titleId = useId();
  const questionId = useId();
  const [question, setQuestion] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [loading, setLoading] = useState(false);
  const busy = useRef(false);
  const logRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const requestRef = useRef<AbortController | null>(null);
  useEffect(() => () => requestRef.current?.abort(), []);
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
    if (!loading && turns.length)
      inputRef.current?.focus({ preventScroll: true });
  }, [turns, loading]);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const text = question.trim();
    if (busy.current || text.length < 2) return;
    const history: ConversationMessage[] = turns
      .filter((turn) => turn.answer && !turn.notice)
      .slice(-3)
      .flatMap((turn) => [
        { role: "user" as const, content: turn.question },
        { role: "assistant" as const, content: turn.answer!.slice(0, 1200) },
      ]);
    busy.current = true;
    setLoading(true);
    setQuestion("");
    setTurns((prev) => [...prev.slice(-19), { question: text, products: [] }]);
    const controller = new AbortController();
    requestRef.current = controller;
    let result: Partial<Turn>;
    try {
      const response = await fetch("/api/assistente", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: text, history }),
        cache: "no-store",
        signal: AbortSignal.any([
          controller.signal,
          AbortSignal.timeout(30000),
        ]),
      });
      const data = await response.json();
      result = response.ok
        ? {
            answer: data.answer,
            products: data.products ?? [],
            links: data.links ?? [],
            notice: data.notice,
          }
        : {
            error:
              data.error || "Não consegui responder agora. Tente novamente.",
            requiresLogin: response.status === 401,
          };
    } catch {
      result = {
        error:
          "A resposta não chegou. Verifique sua conexão e tente novamente.",
      };
    } finally {
      busy.current = false;
      setLoading(false);
    }
    if (controller.signal.aborted) return;
    setTurns((prev) =>
      prev.map((turn, index) =>
        index === prev.length - 1 ? { ...turn, ...result } : turn,
      ),
    );
  }
  return (
    <section className="panel assistant-chat" aria-labelledby={titleId}>
      <h2 id={titleId}>Assistente Brasil Force</h2>
      <p>
        Uma conversa para encontrar seu equipamento e orientar seus próximos
        passos no Brasil Force.
      </p>
      <div className="assistant-conversation-bar">
        <span>
          <Sparkles size={15} aria-hidden="true" /> Assistente virtual
        </span>
        {turns.length > 0 && (
          <button
            type="button"
            disabled={loading}
            onClick={() => {
              setTurns([]);
              setQuestion("");
              inputRef.current?.focus();
            }}
            aria-label="Limpar conversa e começar de novo"
          >
            <RotateCcw size={14} aria-hidden="true" /> Nova conversa
          </button>
        )}
      </div>
      <div
        ref={logRef}
        role="log"
        aria-label="Histórico da conversa"
        aria-live="polite"
        aria-relevant="additions text"
        aria-busy={loading}
      >
        {!turns.length && (
          <div className="assistant-welcome">
            <span className="assistant-avatar" aria-hidden="true">
              <Sparkles size={22} />
            </span>
            <h3>Vamos encontrar seu próximo passo?</h3>
            <p>
              Conte o que você precisa. Posso ajudar a escolher equipamentos,
              explicar como vender ou tirar dúvidas sobre a plataforma.
            </p>
            <div
              className="assistant-suggestions"
              aria-label="Sugestões de perguntas"
            >
              {suggestions.map((text) => (
                <button
                  key={text}
                  type="button"
                  onClick={() => {
                    setQuestion(text);
                    inputRef.current?.focus();
                  }}
                >
                  {text}
                </button>
              ))}
            </div>
          </div>
        )}
        {turns.map((turn, index) => (
          <article key={index} className="assistant-turn">
            <div className="assistant-message assistant-message-user">
              <span className="assistant-speaker">Você</span>
              <p>{turn.question}</p>
            </div>
            <div className="assistant-message assistant-message-reply">
              <span className="assistant-speaker">
                <Sparkles size={13} aria-hidden="true" /> Brasil Force
              </span>
              {turn.error ? (
                <>
                  <p role="alert">{turn.error}</p>
                  {turn.requiresLogin ? (
                    <p>
                      <Link href="/entrar">Entrar na conta</Link> ou{" "}
                      <Link href="/cadastro">criar uma conta</Link>. Confirme
                      seu e-mail para conversar.
                    </p>
                  ) : (
                    <button
                      type="button"
                      className="assistant-retry"
                      onClick={() => {
                        setQuestion(turn.question);
                        inputRef.current?.focus();
                      }}
                      disabled={loading}
                    >
                      Reutilizar pergunta
                    </button>
                  )}
                </>
              ) : turn.answer ? (
                <>
                  {turn.notice && (
                    <p className="assistant-notice" role="status">
                      {turn.notice}
                    </p>
                  )}
                  <p>{turn.answer}</p>
                  {!!turn.products.length && (
                    <div className="assistant-products">
                      {turn.products.map((product) => (
                        <article key={product.id}>
                          <Link href={`/catalogo/${product.id}`}>
                            {product.title}
                          </Link>
                          <p>
                            {(product.price_cents / 100).toLocaleString(
                              "pt-BR",
                              { style: "currency", currency: "BRL" },
                            )}{" "}
                            · Estoque informado: {product.stock}
                          </p>
                        </article>
                      ))}
                    </div>
                  )}
                  {!!turn.links?.length && (
                    <nav
                      className="assistant-actions"
                      aria-label="Próximos passos"
                    >
                      {turn.links.map((link) => (
                        <Link key={link.href} href={link.href}>
                          {link.label} <span aria-hidden="true">↗</span>
                        </Link>
                      ))}
                    </nav>
                  )}
                </>
              ) : (
                <p role="status" className="assistant-thinking">
                  Preparando uma resposta para você…
                </p>
              )}
            </div>
          </article>
        ))}
      </div>
      <form onSubmit={submit} className="search-form">
        <label htmlFor={questionId}>Sua mensagem</label>
        <textarea
          ref={inputRef}
          id={questionId}
          value={question}
          rows={2}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => {
            if (
              e.key === "Enter" &&
              !e.shiftKey &&
              !e.nativeEvent.isComposing
            ) {
              e.preventDefault();
              if (!loading) e.currentTarget.form?.requestSubmit();
            }
          }}
          minLength={2}
          maxLength={500}
          required
          disabled={loading}
          placeholder="Conte como posso ajudar…"
        />
        <button
          className="button button-primary"
          disabled={loading || question.trim().length < 2}
          aria-label={loading ? "Aguardando resposta" : "Enviar mensagem"}
        >
          <Send size={17} aria-hidden="true" />
          <span>{loading ? "Aguarde" : "Enviar"}</span>
        </button>
      </form>
      <small className="assistant-privacy">
        As últimas 3 trocas dão contexto à IA. A conversa é descartada ao sair
        desta página. Não envie senhas ou documentos.
      </small>
    </section>
  );
}
