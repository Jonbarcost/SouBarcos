"use client";
import { useState, type FormEvent } from "react";

type Product = { id: string; title: string; price_cents: number; category_slug: string; stock: number };
export function AssistantChat() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading || question.trim().length < 3) return;
    setLoading(true); setError(""); setAnswer(""); setProducts([]);
    try {
      const response = await fetch("/api/assistente", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }), cache: "no-store",
      });
      const data = await response.json();
      if (!response.ok) { setError(data.error || "Falha na consulta."); return; }
      setAnswer(data.answer);
      setProducts(data.products || []);
    } catch { setError("Falha de conexão. Tente novamente."); }
    finally { setLoading(false); }
  }
  return <section className="panel">
    <h2>Converse sobre equipamentos</h2>
    <p>Exemplo: mochila. Para localizar anúncios, use termos presentes nos títulos.</p>
    <form onSubmit={submit} className="search-form">
      <label htmlFor="bf-ai-question">O que você está procurando?</label>
      <input id="bf-ai-question" value={question} onChange={e=>setQuestion(e.target.value)}
        minLength={3} maxLength={500} required placeholder="Ex.: mochila" />
      <button className="button button-primary" disabled={loading}>{loading ? "Consultando…" : "Perguntar"}</button>
    </form>
    {error && <p role="alert">{error}</p>}
    {answer && <div role="status" aria-live="polite"><h3>Resposta</h3><p style={{whiteSpace:"pre-wrap"}}>{answer}</p></div>}
    {products.length > 0 && <div><h3>Anúncios encontrados</h3>
      {products.map(p=><article key={p.id}>
        <strong>{p.title}</strong>
        <p>{new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(p.price_cents/100)} · Estoque informado: {p.stock}</p>
      </article>)}
    </div>}
  </section>;
}
