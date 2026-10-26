import Link from "next/link";
import { HeroLandscape } from "@/components/hero-landscape";
import { HomeExperience } from "@/components/home-experience";
import {
  ArrowRight,
  ArrowUpRight,
  Backpack,
  BookOpen,
  Landmark,
  Compass,
  Fingerprint,
  Flag,
  Mountain,
  ScanSearch,
  Search,
  Globe2,
  ShieldCheck,
  Shirt,
  Sparkles,
  Wrench,
} from "lucide-react";

export const dynamic = "force-dynamic";

const categories = [
  {
    slug: "vestuario",
    title: "Vestuário",
    image: "/images/categories/vestuario.svg",
    desc: "Para vestir a sua jornada.",
    icon: Shirt,
  },
  {
    slug: "campo",
    title: "Equipamentos de campo",
    image: "/images/categories/campo.svg",
    desc: "Prontos para o próximo destino.",
    icon: Backpack,
  },
  {
    slug: "acessorios",
    title: "Acessórios",
    image: "/images/categories/acessorios.svg",
    desc: "Os detalhes fazem a diferença.",
    icon: Compass,
  },
  {
    slug: "colecionismo",
    title: "Colecionismo",
    image: "/images/categories/colecionismo.svg",
    desc: "História em cada peça.",
    icon: BookOpen,
  },
  {
    slug: "outdoor",
    title: "Outdoor & aventura",
    image: "/images/categories/outdoor.svg",
    desc: "Explore novas possibilidades.",
    icon: Mountain,
  },
  {
    slug: "servicos",
    title: "Serviços",
    image: "/images/categories/servicos.svg",
    desc: "Profissionais e personalização.",
    icon: Wrench,
  },
] as const;

const marquee = [
  "Vestuário",
  "Equipamentos de campo",
  "Acessórios",
  "Colecionismo",
  "Outdoor & aventura",
  "Serviços",
  "Anúncios moderados",
  "Vendedores analisados",
  "Feito no Brasil",
] as const;

const pillars = [
  {
    title: "Anúncios moderados",
    text: "Cada anúncio passa por revisão antes de ir ao ar, seguindo as regras de produtos permitidos.",
    icon: ShieldCheck,
    href: "/regras",
    cta: "Ver produtos permitidos",
  },
  {
    title: "Vendedores analisados",
    text: "Fabricantes, lojistas e profissionais passam por avaliação antes de vender na plataforma.",
    icon: Fingerprint,
    href: "/vender",
    cta: "Como funciona para vender",
  },
  {
    title: "Identidade brasileira",
    text: "Um marketplace nascido aqui, para quem serve, explora, coleciona e vive novas jornadas.",
    icon: Flag,
    href: null,
    cta: null,
  },
] as const;

function BrazilFlag({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 84 58"
      role="img"
      aria-label="Bandeira do Brasil"
    >
      <rect width="84" height="58" rx="8" fill="#159447" />
      <path d="M42 7 77 29 42 51 7 29Z" fill="#F7D44A" />
      <circle cx="42" cy="29" r="16.8" fill="#163B8C" />
      <path
        d="M25.6 26.3c10.7-2.4 22.8 1.6 31.6 9.4"
        fill="none"
        stroke="#fff"
        strokeWidth="3.2"
      />
    </svg>
  );
}

export default function Home() {
  return (
    <>
      <HomeExperience />
      <section className="bf-hero" aria-labelledby="hero-title">
        <HeroLandscape />
        <div className="bf-intro-curtain" aria-hidden="true">
          <span />
        </div>
        <div className="container bf-hero-grid">
          <div className="bf-hero-copy">
            <div className="bf-eyebrow">
              <BrazilFlag className="bf-mini-flag" /> FEITO PARA QUEM VIVE O
              BRASIL
            </div>
            <h1 id="hero-title">
              <span className="bf-line">
                <span>Sua missão.</span>
              </span>{" "}
              <span className="bf-line bf-line-gold">
                <span>Seu equipamento.</span>
              </span>
            </h1>
            <p className="bf-hero-description">
              O marketplace de quem serve, explora e vai além. Equipamentos
              táticos, outdoor, colecionismo e serviços — com identidade
              brasileira.
            </p>
            <p className="bf-launch-note" role="status">
              Pré-abertura: o catálogo está sendo preparado e compras ainda não
              estão disponíveis.
            </p>
            <form
              className="bf-premium-search"
              action="/catalogo"
              method="get"
              role="search"
            >
              <Search size={21} aria-hidden="true" />
              <label className="sr-only" htmlFor="bf-home-search">
                Pesquisar equipamentos no catálogo
              </label>
              <input
                id="bf-home-search"
                type="search"
                name="q"
                placeholder="Busque mochilas, vestuário, camping..."
                maxLength={100}
              />
              <button type="submit" aria-label="Buscar no catálogo">
                Buscar <ArrowRight size={17} aria-hidden="true" />
              </button>
            </form>
            <div className="actions bf-hero-actions">
              <Link
                className="button button-primary bf-primary"
                href="/catalogo"
              >
                Explorar o catálogo{" "}
                <ArrowUpRight size={19} aria-hidden="true" />
              </Link>
              <Link
                className="button button-outline bf-secondary"
                href="/vender"
              >
                Quero vender <ArrowRight size={19} aria-hidden="true" />
              </Link>
            </div>
            <div className="bf-hero-trust">
              <span>
                <ShieldCheck size={17} aria-hidden="true" /> Anúncios moderados
              </span>
              <span>
                <Fingerprint size={17} aria-hidden="true" /> Vendedores
                analisados
              </span>
            </div>
          </div>
          <aside
            className="bf-mission-card"
            data-tilt
            aria-label="Seu assistente na jornada"
          >
            <div className="bf-mission-top">
              <span>BRASIL FORCE / ASSISTENTE</span>
              <Sparkles size={22} aria-hidden="true" />
            </div>
            <div className="bf-mission-orbit" aria-hidden="true">
              <Compass size={68} strokeWidth={1} />
            </div>
            <h2>Uma boa jornada começa com a pergunta certa.</h2>
            <p>
              Encontre seu caminho entre equipamentos, dúvidas e os primeiros
              passos para vender.
            </p>
            <Link href="/assistente" className="button bf-assistant-button">
              Conversar com o assistente{" "}
              <ArrowUpRight size={18} aria-hidden="true" />
            </Link>
            <span className="bf-mission-foot">
              Acesso com conta verificada · Sem realizar compras
            </span>
          </aside>
        </div>
        <div className="container bf-hero-credit">
          <span>BRASIL É O NOSSO PONTO DE PARTIDA.</span>
          <span>Paisagem ilustrativa criada para Brasil Force</span>
        </div>
      </section>

      <div className="bf-marquee" aria-hidden="true">
        <div className="bf-marquee-track">
          {[0, 1].map((copy) => (
            <div className="bf-marquee-group" key={copy}>
              {marquee.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
          ))}
        </div>
      </div>

      <section
        className="container bf-section"
        aria-labelledby="categories-title"
      >
        <div className="bf-section-heading" data-reveal>
          <div>
            <span className="bf-kicker">ENCONTRE O QUE PROCURA</span>
            <h2 id="categories-title">Cada missão tem seu equipamento.</h2>
          </div>
          <Link href="/catalogo" className="bf-inline-link">
            Ver catálogo completo <ArrowUpRight size={18} aria-hidden="true" />
          </Link>
        </div>
        <p className="bf-section-intro" data-reveal>
          Seis universos. Encontre o seu. As imagens são ilustrativas das
          categorias, não ofertas de produtos.
        </p>
        <div className="bf-category-grid">
          {categories.map(({ slug, title, image, desc, icon: Icon }, index) => (
            <Link
              className="bf-category-card"
              href={"/catalogo?categoria=" + slug}
              key={slug}
              data-tilt
              data-reveal
              style={{ "--i": index } as React.CSSProperties}
            >
              <span className="bf-card-glow" aria-hidden="true" />
              <span
                className="bf-category-media"
                style={{ backgroundImage: `url("${image}")` }}
                aria-hidden="true"
              />
              <span className="bf-category-index">0{index + 1}</span>
              <span className="bf-category-icon">
                <Icon size={27} strokeWidth={1.7} aria-hidden="true" />
              </span>
              <span className="bf-category-title">{title}</span>
              <span className="bf-category-desc">{desc}</span>
              <span className="bf-category-link">
                <ArrowUpRight size={20} aria-hidden="true" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section
        className="container bf-pillars"
        aria-labelledby="pillars-title"
      >
        <div className="bf-pillars-heading" data-reveal>
          <span className="bf-kicker">POR QUE BRASIL FORCE</span>
          <h2 id="pillars-title">
            Feito com rigor. <span>Pensado para quem vai além.</span>
          </h2>
        </div>
        <div className="bf-pillars-grid">
          {pillars.map(({ title, text, icon: Icon, href, cta }, index) => (
            <article
              className="bf-pillar"
              key={title}
              data-tilt
              data-reveal
              style={{ "--i": index } as React.CSSProperties}
            >
              <span className="bf-card-glow" aria-hidden="true" />
              <span className="bf-pillar-index">0{index + 1}</span>
              <span className="bf-pillar-icon">
                <Icon size={26} strokeWidth={1.6} aria-hidden="true" />
              </span>
              <h3>{title}</h3>
              <p>{text}</p>
              {href && (
                <Link href={href} className="bf-pillar-link">
                  {cta} <ArrowUpRight size={16} aria-hidden="true" />
                </Link>
              )}
            </article>
          ))}
        </div>
      </section>

      <section className="bf-legacy-teaser" aria-labelledby="legacy-title">
        <div className="container bf-legacy-teaser-inner" data-reveal>
          <div>
            <span className="bf-kicker bf-kicker-light">
              ALÉM DO EQUIPAMENTO
            </span>
            <h2 id="legacy-title">
              A tradição inspira.
              <br />
              <span>O futuro nos move.</span>
            </h2>
            <p>
              Conheça nosso novo espaço editorial sobre a história, os símbolos
              e as tradições das instituições brasileiras. Um acervo
              independente em construção.
            </p>
            <Link className="button bf-assistant-button" href="/legado">
              Explorar legado e história{" "}
              <ArrowUpRight size={18} aria-hidden="true" />
            </Link>
          </div>
          <Landmark size={155} strokeWidth={0.75} aria-hidden="true" />
        </div>
      </section>
      <section
        className="container bf-assistant-section"
        aria-labelledby="assistant-title"
      >
        <div className="bf-assistant-panel" data-reveal>
          <div className="bf-assistant-symbol">
            <Sparkles size={36} strokeWidth={1.6} aria-hidden="true" />
          </div>
          <div className="bf-assistant-content">
            <span className="bf-kicker bf-kicker-light">
              TECNOLOGIA A SEU FAVOR
            </span>
            <h2 id="assistant-title">
              Dúvidas sobre equipamentos?
              <br />
              <span>Converse com o assistente.</span>
            </h2>
            <p>
              Uma experiência para encontrar e comparar anúncios reais, com
              informações do próprio catálogo e acesso mediante conta
              verificada.
            </p>
            <Link className="button bf-assistant-button" href="/assistente">
              Conhecer o assistente{" "}
              <ArrowUpRight size={18} aria-hidden="true" />
            </Link>
          </div>
          <div className="bf-assistant-visual" aria-hidden="true">
            <ScanSearch size={136} strokeWidth={0.8} />
            <span>BF / INTELIGÊNCIA DE CATÁLOGO</span>
          </div>
        </div>
      </section>

      <section
        className="container bf-global-section"
        aria-labelledby="global-title"
      >
        <div className="bf-global-copy" data-reveal>
          <span className="bf-kicker">BRASIL FORCE GLOBAL</span>
          <h2 id="global-title">Do Brasil para novas conexões.</h2>
          <p>
            Fabricantes, distribuidores e lojistas podem conhecer nossa proposta
            comercial e participar da preparação do marketplace. Cadastros e
            anúncios passam por avaliação.
          </p>
          <div className="actions">
            <Link href="/fornecedores" className="button button-primary">
              Sou fornecedor <ArrowUpRight size={18} aria-hidden="true" />
            </Link>
            <a
              href="mailto:contato@brasilforce.com.br?subject=Parceria%20internacional%20Brasil%20Force"
              className="button button-outline"
            >
              Parceria internacional <Globe2 size={18} aria-hidden="true" />
            </a>
          </div>
        </div>
        <div className="bf-global-art" aria-hidden="true" data-reveal>
          <Globe2 size={110} strokeWidth={0.8} />
          <span>BR / GLOBAL SUPPLY</span>
        </div>
      </section>
      <section
        className="container bf-seller-section"
        aria-labelledby="seller-title"
        data-reveal
      >
        <div>
          <span className="bf-kicker">FAÇA PARTE</span>
          <h2 id="seller-title">Seu trabalho merece mais alcance.</h2>
          <p>
            Produz, personaliza ou fornece equipamentos? Conheça o processo de
            avaliação para vender na Brasil Force.
          </p>
        </div>
        <Link href="/vender" className="button button-primary bf-primary">
          Quero ser fornecedor <ArrowUpRight size={18} aria-hidden="true" />
        </Link>
      </section>
    </>
  );
}
