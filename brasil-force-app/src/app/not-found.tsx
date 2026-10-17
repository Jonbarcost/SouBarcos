import Link from "next/link";
export default function NotFound() {
  return (
    <div className="container page narrow">
      <h1>Rota não encontrada.</h1>
      <p>Vamos encontrar outro caminho.</p>
      <Link className="button button-primary" href="/">
        Voltar ao início
      </Link>
    </div>
  );
}
