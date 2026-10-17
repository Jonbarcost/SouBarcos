import { PageTitle } from "@/components/shell";
import Link from "next/link";
export default function Help() {
  return (
    <div className="container page narrow">
      <PageTitle
        title="Como podemos ajudar?"
        description="Informações claras para sua próxima jornada."
      />
      {[
        [
          "A plataforma já aceita compras?",
          "Ainda não. Estamos construindo a fundação. Checkout, pagamentos e entregas serão liberados somente após integração e testes.",
        ],
        [
          "Quem poderá comprar?",
          "Qualquer pessoa com cadastro autenticado, respeitando as regras dos produtos e os requisitos aplicáveis.",
        ],
        [
          "Como posso vender?",
          "Solicite habilitação. A autorização depende de verificação e análise. Cada anúncio também passa pela moderação.",
        ],
        [
          "Meu vínculo institucional será público?",
          "O vínculo é opcional e autodeclarado. Informá-lo não gera selo nem comprova vínculo institucional.",
        ],
        [
          "O que pode ser anunciado?",
          "No lançamento, somente produtos classificados como de venda livre. Armas, munições, explosivos e produtos controlados não terão compra habilitada.",
        ],
      ].map(([q, a]) => (
        <details key={q}>
          <summary>{q}</summary>
          <p>{a}</p>
        </details>
      ))}
      <p>
        Consulte também nossas{" "}
        <Link href="/regras" className="text-link">
          regras de produtos
        </Link>
        .
      </p>
    </div>
  );
}
