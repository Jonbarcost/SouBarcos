"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="container page narrow">
      <h1>Não foi possível carregar esta página.</h1>
      <p>Tente novamente em alguns instantes. Seus dados não foram exibidos.</p>
      <button className="button button-primary" onClick={reset}>
        Tentar novamente
      </button>
    </div>
  );
}
