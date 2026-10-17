import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Backpack,
  BookOpen,
  Compass,
  Fingerprint,
  Mountain,
  ScanSearch,
  ShieldCheck,
  Shirt,
  Sparkles,
  Wrench,
} from "lucide-react";

export const dynamic = "force-dynamic";

const categories = [
  { slug: "vestuario", title: "Vestuário", desc: "Para vestir a sua jornada.", icon: Shirt },
  { slug: "campo", title: "Equipamentos de campo", desc: "Prontos para o próximo destino.", icon: Backpack },
  { slug: "acessorios", title: "Acessórios", desc: "Os detalhes fazem a diferença.", icon: Compass },
  { slug: "colecionismo", title: "Colecionismo", desc: "História em cada peça.", icon: BookOpen },
  { slug: "outdoor", title: "Outdoor & aventura", desc: "Explore novas possibilidades.", icon: Mountain },
  { slug: "servicos", title: "Serviços", desc: "Profissionais e personalização.", icon: Wrench },
] as const;

function BrazilFlag({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 84 58" role="img" aria-label="Bandeira do Brasil">
      <rect width="84" height="58" rx="8" fill="#159447" />
      <path d="M42 7 77 29 42 51 7 29Z" fill="#F7D44A" />
      <circle cx="42" cy="29" r="16.8" fill="#163B8C" />
      <path d="M25.6 26.3c10.7-2.4 22.8 1.6 31.6 9.4" fill="none" stroke="#fff" strokeWidth="3.2" />
    </svg>
  );
}

export default function Home() {
  return (
    <>
      <section className="bf-hero" aria-labelledby="hero-title">
        <div className="container bf-hero-grid">
          <div className="bf-hero-copy">
            <div className="bf-eyebrow"><BrazilFlag className="bf-mini-flag" /> FEITO PARA QUEM VIVE O BRASIL</div>
            <h1 id="hero-title">
              Seu mundo é grande.<br />
              <span>Seu equipamento acompanha.</span>
            </h1>
            <p className="bf-hero-description">
              Um novo ponto de encontro para quem serve, explora, coleciona e vive novas jornadas.
              Descubra equipamentos, produtos e serviços em um só lugar.
            </p>
            <p className="bf-launch-note" role="status">Pré-abertura: o catálogo está sendo preparado e compras ainda não estão disponíveis.</p>
            <div className="actions bf-hero-actions">
              <Link className="button button-primary bf-primary" href="/catalogo">
                Explorar o catálogo <ArrowUpRight size={19} aria-hidden="true" />
              </Link>
              <Link className="button button-outline bf-secondary" href="/vender">
                Quero vender <ArrowRight size={19} aria-hidden="true" />
              </Link>
            </div>
            <div className="bf-hero-trust">
              <span><ShieldCheck size={17} aria-hidden="true" /> Anúncios moderados</span>
              <span><Fingerprint size={17} aria-hidden="true" /> Vendedores analisados</span>
            </div>
          </div>
          <div className="bf-hero-art" aria-hidden="true">
            <div className="bf-art-rings" />
            <div className="bf-art-topline"><span>BRASIL FORCE</span><span>01 — 06</span></div>
            <div className="bf-art-center">
              <div className="bf-art-shield"><ShieldCheck size={96} strokeWidth={1} /></div>
              <span className="bf-art-brazil">BR</span>
            </div>
            <div className="bf-art-bottom">
              <div><span className="bf-art-caption">NOSSA ORIGEM</span><strong>Brasil.</strong></div>
              <BrazilFlag className="bf-art-flag" />
            </div>
          </div>
        </div>
      </section>

      <section className="container bf-section" aria-labelledby="categories-title">
        <div className="bf-section-heading">
          <div><span className="bf-kicker">ENCONTRE O QUE PROCURA</span><h2 id="categories-title">Cada missão tem seu equipamento.</h2></div>
          <Link href="/catalogo" className="bf-inline-link">Ver catálogo completo <ArrowUpRight size={18} aria-hidden="true" /></Link>
        </div>
        <div className="bf-category-grid">
          {categories.map(({ slug, title, desc, icon: Icon }, index) => (
            <Link className="bf-category-card" href={"/catalogo?categoria=" + slug} key={slug}>
              <span className="bf-category-index">0{index + 1}</span>
              <span className="bf-category-icon"><Icon size={27} strokeWidth={1.7} aria-hidden="true" /></span>
              <span className="bf-category-title">{title}</span>
              <span className="bf-category-desc">{desc}</span>
              <span className="bf-category-link"><ArrowUpRight size={20} aria-hidden="true" /></span>
            </Link>
          ))}
        </div>
      </section>

      <section className="container bf-assistant-section" aria-labelledby="assistant-title">
        <div className="bf-assistant-panel">
          <div className="bf-assistant-symbol"><Sparkles size={36} strokeWidth={1.6} aria-hidden="true" /></div>
          <div className="bf-assistant-content">
            <span className="bf-kicker bf-kicker-light">TECNOLOGIA A SEU FAVOR</span>
            <h2 id="assistant-title">Dúvidas sobre equipamentos?<br /><span>Converse com o assistente.</span></h2>
            <p>Uma experiência para encontrar e comparar anúncios reais, com informações do próprio catálogo e acesso mediante conta verificada.</p>
            <Link className="button bf-assistant-button" href="/assistente">
              Conhecer o assistente <ArrowUpRight size={18} aria-hidden="true" />
            </Link>
          </div>
          <div className="bf-assistant-visual" aria-hidden="true">
            <ScanSearch size={136} strokeWidth={0.8} />
            <span>BF / INTELIGÊNCIA DE CATÁLOGO</span>
          </div>
        </div>
      </section>

      <section className="container bf-seller-section" aria-labelledby="seller-title">
        <div>
          <span className="bf-kicker">FAÇA PARTE</span>
          <h2 id="seller-title">Seu trabalho merece mais alcance.</h2>
          <p>Produz, personaliza ou fornece equipamentos? Conheça o processo de avaliação para vender na Brasil Force.</p>
        </div>
        <Link href="/vender" className="button button-primary bf-primary">Quero ser fornecedor <ArrowUpRight size={18} aria-hidden="true" /></Link>
      </section>
    </>
  );
}
