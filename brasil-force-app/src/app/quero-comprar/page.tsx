import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Backpack, Compass, Mail, Shirt } from "lucide-react";
import styles from "../fornecedores/landing.module.css";

export const metadata: Metadata = {
  title: "Quero comprar | Brasil Force",
  description: "Conheça o catálogo em preparação do Brasil Force e compartilhe quais equipamentos você procura.",
  alternates: { canonical: "https://brasilforce.com.br/quero-comprar" },
};
const interests = [
  { label: "Vestuário e acessórios", slug: "vestuario", icon: Shirt },
  { label: "Mochilas e equipamentos de campo", slug: "campo", icon: Backpack },
  { label: "Camping e aventura", slug: "outdoor", icon: Compass },
];
export default function QueroComprar() {
  const email = "mailto:contato@brasilforce.com.br?subject=" + encodeURIComponent("Interesse em produtos Brasil Force");
  return <div className={styles.wrapper}>
    <section className={styles.hero}><div className="container">
      <span className={styles.eyebrow}>BRASIL FORCE / COMUNIDADE</span>
      <h1>O equipamento certo.<br/><span>Para sua próxima jornada.</span></h1>
      <p>Estamos reunindo vendedores de equipamentos permitidos para campo, vestuário e aventura. Explore as categorias e conte o que procura.</p>
      <div className={styles.actions}>
        <Link className="button button-primary" href="/catalogo">Explorar catálogo <ArrowRight size={18}/></Link>
        <a className="button button-outline" href={email}>Contar o que procuro <Mail size={18}/></a>
      </div>
      <p className={styles.disclaimer}>Pré-abertura: compras e pagamentos ainda não estão disponíveis. Enviar um e-mail não inscreve você automaticamente em campanhas.</p>
    </div></section>
    <section className={"container " + styles.section}><span className={styles.eyebrow}>DESCUBRA POR INTERESSE</span><h2>Uma vitrine para diferentes jornadas.</h2>
      <div className={styles.cards + " " + styles.three}>{interests.map(({label,slug,icon:Icon})=><Link key={slug} href={"/catalogo?categoria="+slug} className={styles.card}><Icon size={31} strokeWidth={1.7}/><h3>{label}</h3><p>Conhecer categoria <ArrowRight size={15}/></p></Link>)}</div>
    </section>
    <section className={"container " + styles.bottom}><div><Mail size={31}/><h2>Não encontrou o que precisa?</h2><p>Conte o que está procurando. Nossa equipe poderá responder quando houver novidades relevantes.</p></div><a href={email} className="button button-primary">Enviar meu interesse <ArrowRight size={18}/></a></section>
    <div className={"container " + styles.footnote}>Quer oferecer produtos? <Link href="/fornecedores">Conheça a área de fornecedores.</Link></div>
  </div>;
}