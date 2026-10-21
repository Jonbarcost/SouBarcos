import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BadgeCheck, Boxes, Factory, Mail, ShieldCheck, Store, Truck } from "lucide-react";
import styles from "./landing.module.css";

export const metadata: Metadata = {
  title: "Seja fornecedor ou vendedor parceiro",
  description: "Fabricantes, confecções, lojas e prestadores de serviços: conheça a pré-abertura do marketplace Brasil Force e solicite sua habilitação.",
  alternates: { canonical: "https://brasilforce.com.br/fornecedores" },
  robots: { index: true, follow: true },
  openGraph: {
    title: "Forneça para a Brasil Force",
    description: "Uma nova vitrine para marcas, fabricantes, confecções, lojas e profissionais do universo outdoor e de equipamentos de uso permitido.",
    url: "https://brasilforce.com.br/fornecedores",
    type: "website",
  },
};

const segments = [
  { icon: Factory, title: "Fabricantes e confecções", text: "Vestuário permitido, uniformização profissional, mochilas e acessórios." },
  { icon: Store, title: "Lojas e distribuidores", text: "Empresas com catálogo próprio, estoque e procedência identificável." },
  { icon: Boxes, title: "Marcas de campo e outdoor", text: "Camping, trilhas, organização, pesca recreativa e aventura." },
  { icon: Truck, title: "Serviços e personalização", text: "Bordados, ajustes, produção sob encomenda e serviços permitidos." },
];

const email = "mailto:contato@brasilforce.com.br?subject=" +
  encodeURIComponent("Tenho interesse em fornecer — Brasil Force") +
  "&body=" + encodeURIComponent(
    "Olá, equipe Brasil Force!\n\nEmpresa / nome comercial:\nCidade / UF:\nSite ou catálogo:\nProdutos de uso permitido que ofereço:\nTelefone comercial para retorno:\n\nGostaria de conversar sobre uma parceria.\n"
  );

export default function Fornecedores() {
  return (
    <div className={styles.wrapper}>
      <section className={styles.hero}>
        <div className="container">
          <span className={styles.eyebrow}>BRASIL FORCE / PARCERIAS</span>
          <h1>Sua marca tem uma missão.<br /><span>Nós ajudamos a dar visibilidade.</span></h1>
          <p>Estamos reunindo fabricantes, lojas, fornecedores e profissionais para a pré-abertura do Brasil Force. Apresente seu catálogo e acompanhe a seleção de vendedores.</p>
          <div className={styles.actions}>
            <Link href="/vender" className="button button-primary">Solicitar habilitação <ArrowRight size={18} aria-hidden="true" /></Link>
            <a href={email} className="button button-outline">Apresentar minha empresa <Mail size={18} aria-hidden="true" /></a>
          </div>
          <p className={styles.disclaimer}>Condição de lançamento para os primeiros fornecedores: sem mensalidade e sem comissão durante a campanha promocional. Prazo e condições de encerramento serão informados previamente. Aprovação não é automática; compras ainda não estão disponíveis.</p>
        </div>
      </section>
      <section className={"container " + styles.section}>
        <span className={styles.eyebrow}>QUEM ESTAMOS CONVIDANDO</span>
        <h2>O seu catálogo pode fazer parte daqui.</h2>
        <div className={styles.cards}>
          {segments.map(({icon: Icon, title, text}) => (
            <article className={styles.card} key={title}>
              <Icon size={30} strokeWidth={1.6} aria-hidden="true" />
              <h3>{title}</h3><p>{text}</p>
            </article>
          ))}
        </div>
      </section>
      <section className={"container " + styles.section}>
        <div className={styles.split}>
          <div>
            <span className={styles.eyebrow}>COMECE COM TRANSPARÊNCIA</span>
            <h2>Como participar</h2>
            <ol className={styles.steps}>
              <li><strong>Apresente seu negócio</strong><span>Informe quem você é e os produtos permitidos que oferece, pelo contato comercial ou cadastro.</span></li>
              <li><strong>Solicite habilitação</strong><span>Use o fluxo de vendedor existente. A equipe analisa identidade, procedência e requisitos aplicáveis.</span></li>
              <li><strong>Prepare seus anúncios</strong><span>Depois da aprovação, cadastre os produtos. A publicação de cada anúncio também exige moderação.</span></li>
            </ol>
          </div>
          <aside className={styles.highlight}>
            <BadgeCheck size={33} aria-hidden="true" />
            <h3>Parceria séria, com regras claras.</h3>
            <p>O Brasil Force está em preparação comercial. Não garantimos vendas, exclusividade ou aprovação. Durante o lançamento, os primeiros fornecedores não pagam mensalidade nem comissão. Qualquer condição posterior será apresentada previamente, sem cobrança retroativa.</p>
            <p><ShieldCheck size={18} aria-hidden="true" /> Produtos controlados, armas e itens para falsa identificação institucional não são aceitos.</p>
            <Link href="/regras">Consultar produtos permitidos <ArrowRight size={16} aria-hidden="true" /></Link>
          </aside>
        </div>
      </section>
      <section className={"container " + styles.bottom}>
        <div><h2>Já tem estoque ou fabrica sob encomenda?</h2><p>Converse com a equipe e participe do processo de habilitação.</p></div>
        <a href={email} className="button button-primary">Quero conversar sobre parceria <ArrowRight size={18} aria-hidden="true" /></a>
      </section>
    </div>
  );
}
