import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Backpack, Bell, Compass, Mail, Shirt } from "lucide-react";
import styles from "../fornecedores/landing.module.css";

export const metadata: Metadata = {
  title: "Encontre equipamentos de campo e outdoor",
  description: "Acompanhe a chegada do Brasil Force: equipamentos de campo, vestuário permitido, camping, aventura e serviços. Catálogo em preparação.",
  alternates: { canonical: "https://brasilforce.com.br/quero-comprar" },
  robots: { index: true, follow: true },
  openGraph: {
    title: "Seu próximo equipamento começa no Brasil Force",
    description: "Explore as categorias do novo marketplace brasileiro e conte para nós o que procura.",
    url: "https://brasilforce.com.br/quero-comprar",
    type: "website",
  },
};

const interests = [
  { label: "Vestuário e acessórios", slug: "vestuario", icon: Shirt },
  { label: "Mochilas e equipamentos de campo", slug: "campo", icon: Backpack },
  { label: "Camping e aventura", slug: "outdoor", icon: Compass },
];

const email = "mailto:contato@brasilforce.com.br?subject=" +
  encodeURIComponent("Tenho interesse em comprar — Brasil Force") +
  "&body=" + encodeURIComponent(
    "Olá! Quero conhecer os primeiros produtos disponíveis no Brasil Force.\n\nCategorias do meu interesse:\nProdutos que procuro:\nCidade / UF:\n\nAutorizo que respondam a este e-mail sobre meu interesse.\n"
  );

export default function QueroComprar() {
  return (
    <div className={styles.wrapper}>
      <section className={styles.hero}>
        <div className="container">
          <span className={styles.eyebrow}>BRASIL FORCE / COMUNIDADE</span>
          <h1>O equipamento certo.<br /><span>Para a sua próxima jornada.</span></h1>
          <p>O Brasil Force está reunindo vendedores de produtos de uso permitido para o universo de campo, vestuário e aventura. Explore as categorias e compartilhe o que gostaria de encontrar.</p>
          <div className={styles.actions}>
            <Link className="button button-primary" href="/catalogo">Explorar catálogo <ArrowRight size={18} aria-hidden="true" /></Link>
            <a className="button button-outline" href={email}>Contar o que procuro <Mail size={18} aria-hidden="true" /></a>
          </div>
          <p className={styles.disclaimer}>Pré-abertura: pedidos, pagamentos e compras ainda não estão disponíveis. O contato por e-mail não é uma inscrição automática em lista de marketing.</p>
        </div>
      </section>
      <section className={"container " + styles.section}>
        <span className={styles.eyebrow}>DESCUBRA POR INTERESSE</span>
        <h2>Uma vitrine feita para diferentes jornadas.</h2>
        <div className={styles.cards + " " + styles.three}>
          {interests.map(({label, slug, icon: Icon}) => (
            <Link key={slug} href={"/catalogo?categoria=" + slug} className={styles.card}>
              <Icon size={31} strokeWidth={1.7} aria-hidden="true" />
              <h3>{label}</h3>
              <p>Conhecer categoria <ArrowRight size={15} aria-hidden="true" /></p>
            </Link>
          ))}
        </div>
      </section>
      <section className={"container " + styles.bottom}>
        <div>
          <Bell size={31} strokeWidth={1.6} aria-hidden="true" />
          <h2>Não encontrou o que precisa?</h2>
          <p>Envie seus interesses por e-mail. A equipe poderá responder quando houver novidades relevantes; não fazemos disparos automáticos.</p>
        </div>
        <a href={email} className="button button-primary">Enviar meu interesse <ArrowRight size={18} aria-hidden="true" /></a>
      </section>
      <div className={"container " + styles.footnote}>Quer oferecer produtos? <Link href="/fornecedores">Conheça a área de fornecedores.</Link></div>
    </div>
  );
}
