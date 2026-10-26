import Link from "next/link";
import { PageTitle, Notice } from "@/components/shell";
import { discoverySectors } from "@/lib/national-catalog";

export const metadata = {
  title: "Explore equipamentos e atividades",
  description: "Conheça os segmentos do Brasil Force e consulte os anúncios realmente cadastrados.",
};

export default function Explore() {
  return (
    <main className="container page">
      <PageTitle title="Explore por equipamento" description="Do campo ao camping, da pesca ao colecionismo permitido." />
      <Notice>
        As 12 áreas abaixo são caminhos de descoberta, não anúncios nem filtros
        especializados já implantados. Cada link leva à categoria ampla disponível.
        Estoque, compatibilidade e preço são exibidos somente para anúncios reais.
      </Notice>
      <div className="categories">
        {discoverySectors.map((sector, i) => (
          <article className="panel" key={sector.slug}>
            <span className="category-number">{String(i + 1).padStart(2, "0")}</span>
            <h2>{sector.name}</h2>
            <p>{sector.examples.join(" · ")}</p>
            {sector.note && <p><small>{sector.note}</small></p>}
            <Link className="text-link" href={"/catalogo?categoria=" + encodeURIComponent(sector.legacyCategory)}>
              Consultar categoria ampla →
            </Link>
          </article>
        ))}
      </div>
      <section className="panel">
        <h2>Comprar por instituição</h2>
        <p>Diretório público verificado, sem presumir elegibilidade, parceria oficial ou fornecimento autorizado.</p>
        <Link href="/instituicoes" className="text-link">Conhecer instituições →</Link>
      </section>
    </main>
  );
}
