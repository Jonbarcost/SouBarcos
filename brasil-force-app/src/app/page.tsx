import Link from "next/link";
import {
  ArrowRight,
  Shirt,
  Backpack,
  Compass,
  BookOpen,
  Mountain,
  Wrench,
  PackageOpen,
} from "lucide-react";
export const dynamic = "force-dynamic";
const categories = [
  ["vestuario", "Vestuário", Shirt],
  ["campo", "Equipamentos de campo", Backpack],
  ["acessorios", "Acessórios", Compass],
  ["colecionismo", "Colecionismo", BookOpen],
  ["outdoor", "Outdoor", Mountain],
  ["servicos", "Serviços", Wrench],
] as const;
export default function Home() {
  return (
    <>
      <section className="hero">
        <div className="container hero-content">
          <h1>
            Sua missão.
            <br />
            <span>Seu equipamento.</span>
          </h1>
          <p>Equipamentos, histórias e novas jornadas.</p>
          <div className="actions">
            <Link className="button button-primary" href="/catalogo">
              Explorar catálogo <ArrowRight size={18} />
            </Link>
            <Link className="button button-outline" href="/vender">
              Quero vender <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>
      <section className="container section">
        <div className="section-heading">
          <h2>Explore por categoria</h2>
          <Link href="/catalogo">
            Ver catálogo <ArrowRight size={16} />
          </Link>
        </div>
        <div className="categories">
          {categories.map(([slug, name, Icon], i) => (
            <Link
              href={"/catalogo?categoria=" + slug}
              className="category"
              key={slug}
            >
              <span className="category-number">0{i + 1}</span>
              <Icon size={34} strokeWidth={1.2} />
              <h3>{name}</h3>
              <ArrowRight className="category-arrow" size={17} />
            </Link>
          ))}
        </div>
      </section>
      <section className="empty-home">
        <div className="container empty-content">
          <div>
            <h2>
              O próximo equipamento
              <br />
              começa aqui.
            </h2>
            <p>Os primeiros anúncios estão a caminho.</p>
            <Link href="/regras" className="text-link">
              Conhecer as regras <ArrowRight size={17} />
            </Link>
          </div>
          <PackageOpen size={116} strokeWidth={0.8} aria-hidden="true" />
        </div>
      </section>
    </>
  );
}
