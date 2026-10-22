import Image from "next/image";
import { ArrowUpRight, ImageOff } from "lucide-react";
import Link from "next/link";
const items=[
 {title:"Exploração outdoor",caption:"Horizontes para descobrir",src:"/images/categories/outdoor.svg",href:"/catalogo?categoria=outdoor",size:"tall"},
 {title:"Vestuário técnico",caption:"Pronto para a jornada",src:"/images/categories/vestuario.svg",href:"/catalogo?categoria=vestuario",size:"medium"},
 {title:"Equipamentos de campo",caption:"Organização em movimento",src:"/images/categories/campo.svg",href:"/catalogo?categoria=campo",size:"medium"},
 {title:"Colecionismo",caption:"Memória e tradição",src:"/images/categories/colecionismo.svg",href:"/catalogo?categoria=colecionismo",size:"tall"},
 {title:"Acessórios",caption:"Imagem autoral em preparação",src:null,href:"/catalogo?categoria=acessorios",size:"medium"},
 {title:"Serviços",caption:"Imagem autoral em preparação",src:null,href:"/catalogo?categoria=servicos",size:"medium"}
] as const;
export function InspirationGallery(){
 return <section className="container ops-gallery" aria-labelledby="ops-gallery-title">
 <div className="ops-gallery-head"><div><span className="ops-hud ops-gallery-kicker">BF / GALERIA DE INSPIRAÇÃO</span><h2 id="ops-gallery-title">Cenários para novas missões.</h2><p>Ilustrações existentes do projeto e espaços reservados para futuras imagens com direitos de uso confirmados. Não representam ofertas.</p></div><Link href="/catalogo">Explorar categorias <ArrowUpRight size={17} aria-hidden="true"/></Link></div>
 <div className="ops-gallery-masonry">{items.map((item,i)=><Link key={item.title} className={`ops-gallery-item ops-gallery-${item.size}`} href={item.href} aria-label={`Explorar ${item.title}`}>
 <div className="ops-gallery-visual">{item.src?<Image src={item.src} alt={`Ilustração temática de ${item.title.toLowerCase()}`} fill sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 30vw" loading="lazy" quality={75} className="ops-gallery-image"/>:<div className="ops-gallery-placeholder" aria-label="Imagem ainda não disponível"><ImageOff size={32} strokeWidth={1.2} aria-hidden="true"/><span>VISUAL EM PREPARAÇÃO</span></div>}</div>
 <span className="ops-gallery-overlay"><span className="ops-hud">ARQUIVO / {String(i+1).padStart(2,"0")}</span><strong>{item.title}</strong><small>{item.caption}</small></span>
 </Link>)}</div><p className="ops-gallery-credit">Créditos: artes ilustrativas já presentes no repositório Brasil Force; titularidade e licenças devem ser verificadas antes de substituir por fotografias.</p>
 </section>
}