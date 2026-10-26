import Link from "next/link";
import { PageTitle, Notice } from "@/components/shell";
import { brazilStates, verifiedInstitutions } from "@/lib/national-catalog";

export const metadata = {
  title: "Diretório de instituições",
  description: "Instituições verificadas em fontes oficiais, sem afirmar credenciamento ou compatibilidade de produtos.",
};

export default function Institutions() {
  return (
    <main className="container page">
      <PageTitle title="Instituições e atividades" description="Conhecimento institucional com fontes verificáveis." />
      <Notice>
        Este diretório não representa vínculo, endosso ou loja oficial de qualquer
        corporação. Informar uma instituição no perfil não concede autorização
        para adquirir produtos restritos.
      </Notice>
      <div className="categories">
        {verifiedInstitutions.map((inst) => (
          <article className="panel" key={inst.slug}>
            <h2>{inst.name}</h2>
            <p>{inst.kind === "armed_forces" ? "Forças Armadas" : "Segurança pública federal"}</p>
            <p>Fonte verificada em {inst.sourceVerifiedOn.split("-").reverse().join("/")}</p>
            <a href={inst.sourceUrl} rel="noopener noreferrer" target="_blank" className="text-link">
              Consultar fonte oficial ↗
            </a>
          </article>
        ))}
      </div>
      <section className="panel">
        <h2>Cobertura nacional em estruturação</h2>
        <p>
          As 27 unidades federativas são identificadas abaixo para orientar
          o levantamento oficial de instituições estaduais e municipais.
          Não foram criadas corporações, batalhões ou guardas municipais presumidas.
        </p>
        <p>{brazilStates.join(" · ")}</p>
        <Link href="/explorar" className="text-link">Explorar equipamentos comuns →</Link>
      </section>
    </main>
  );
}
