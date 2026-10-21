import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
const translations = {
  en: { title: "Brasil Force — Your mission. Your equipment.", description: "Brazilian marketplace for permitted outdoor, field and professional equipment. Currently preparing for launch.", suppliers: "Become a founding supplier", buyers: "I'm interested in buying", detail: "We welcome international manufacturers and distributors. Founding suppliers pay no monthly fee and no commission during the launch campaign. Terms after launch will be announced in advance. Registration and listings are subject to review.", buyDetail: "Browse our marketplace in preparation. Checkout and payments are not available yet.", contact: "Contact our commercial team", back: "Browse Portuguese catalog", note: "Product eligibility, imports, taxes and shipping depend on local law." },
  es: { title: "Brasil Force — Tu misión. Tu equipo.", description: "Marketplace brasileño de equipamiento permitido para actividades al aire libre, campo y uso profesional. Estamos preparando el lanzamiento.", suppliers: "Ser proveedor fundador", buyers: "Quiero comprar", detail: "Invitamos a fabricantes y distribuidores internacionales. Los primeros proveedores no pagarán mensualidad ni comisión durante la campaña de lanzamiento. Las condiciones posteriores se comunicarán con anticipación. Los registros y anuncios requieren revisión.", buyDetail: "Conoce nuestro marketplace en preparación. Las compras y los pagos aún no están disponibles.", contact: "Contactar al equipo comercial", back: "Ver catálogo en portugués", note: "La elegibilidad de productos, importaciones, impuestos y envíos dependen de la legislación local." },
} as const;
export function generateStaticParams(){ return [{locale:"en"},{locale:"es"}]; }
export async function generateMetadata({params}:{params:Promise<{locale:string}>}):Promise<Metadata>{
 const {locale}=await params; if(locale!=="en" && locale!=="es") return {};
 return {title:translations[locale].title,description:translations[locale].description,alternates:{canonical:"https://brasilforce.com.br/"+locale,languages:{"pt-BR":"https://brasilforce.com.br/","en":"https://brasilforce.com.br/en","es":"https://brasilforce.com.br/es"}}};
}
export default async function LocalizedHome({params}:{params:Promise<{locale:string}>}){
 const {locale}=await params; if(locale!=="en" && locale!=="es") notFound();
 const t=translations[locale];
 return <div lang={locale} className="container" style={{paddingBlock:70,minHeight:"60vh",maxWidth:1050}}>
 <span style={{fontSize:13,fontWeight:700,letterSpacing:2,color:"#71835b"}}>BRASIL FORCE GLOBAL</span>
 <h1 style={{fontSize:"clamp(34px,5vw,65px)",lineHeight:1.1,margin:"18px 0"}}>{t.title}</h1>
 <p style={{fontSize:19,maxWidth:740}}>{t.description}</p>
 <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:20,marginTop:36}}>
 <section style={{border:"1px solid #c5d0bc",borderRadius:20,padding:26}}>
 <h2 style={{fontSize:26}}>{t.suppliers}</h2><p>{t.detail}</p>
 <a className="button button-primary" href={"mailto:contato@brasilforce.com.br?subject="+encodeURIComponent("International supplier — Brasil Force")}>{t.contact}</a>
 </section>
 <section style={{border:"1px solid #c5d0bc",borderRadius:20,padding:26}}>
 <h2 style={{fontSize:26}}>{t.buyers}</h2><p>{t.buyDetail}</p><Link className="button button-outline" href="/catalogo">{t.back}</Link>
 </section></div><p style={{marginTop:28,fontSize:14}}>{t.note}</p>
 </div>;
}
