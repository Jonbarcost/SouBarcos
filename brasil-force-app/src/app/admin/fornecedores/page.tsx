import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { createSupplier, updateSupplier } from "./actions";

export const dynamic = "force-dynamic";
const labels:Record<string,string>={identified:"Identificado",contact_pending:"Contato pendente",contacted:"Contatado",interested:"Interessado",consented:"Autorizado",catalog_active:"Catálogo ativo",declined:"Recusou",cancelled:"Cancelado",expired:"Expirado"};
export default async function Fornecedores() {
  const {db,account}=await requireStaff();
  if(!["admin","superadmin"].includes(account.role)) return <main className="container page"><h1>Acesso restrito</h1></main>;
  const {data,error}=await db.from("bf_supplier_prospects").select("id,company_name,category,contact_email,website,stage,opt_out,created_at,activated_at").order("created_at",{ascending:false}).limit(100);
  return <main className="container page" style={{maxWidth:1100}}>
    <Link href="/admin">← Voltar à administração</Link>
    <h1>Central de fornecedores</h1>
    <p>Prospecção comercial e divulgação gratuita por 30 dias. Nenhum contato é enviado automaticamente. A publicação exige autorização registrada.</p>
    <section style={{padding:"1.5rem",border:"1px solid #7775",borderRadius:16,marginBlock:"1.5rem"}}>
      <h2>Cadastrar fornecedor</h2>
      <form action={createSupplier} style={{display:"grid",gap:12,maxWidth:640}}>
        <label>Empresa *<input name="company_name" required minLength={2} maxLength={180} style={{display:"block",width:"100%",padding:10}}/></label>
        <label>Categoria *<input name="category" required minLength={2} maxLength={100} style={{display:"block",width:"100%",padding:10}}/></label>
        <label>E-mail comercial público<input name="contact_email" type="email" style={{display:"block",width:"100%",padding:10}}/></label>
        <label>Site HTTPS<input name="website" type="url" placeholder="https://" style={{display:"block",width:"100%",padding:10}}/></label>
        <label>Fonte do contato HTTPS<input name="source_url" type="url" placeholder="https://" style={{display:"block",width:"100%",padding:10}}/></label>
        <button className="button button-primary" type="submit">Salvar fornecedor</button>
      </form>
    </section>
    <h2>Prospects registrados</h2>
    {error?<p>Não foi possível consultar os fornecedores. Verifique a migração e as permissões.</p>:!data?.length?<p>Nenhum fornecedor cadastrado.</p>:<div style={{display:"grid",gap:12}}>{data.map((s)=><article key={s.id} style={{padding:16,border:"1px solid #7775",borderRadius:12}}>
      <h3>{s.company_name}</h3><p>{s.category} · {labels[s.stage]??s.stage}{s.opt_out?" · Não contatar":""}</p>
      {s.contact_email&&<p>Contato: {s.contact_email}</p>}
      {s.website&&<p><a href={s.website} target="_blank" rel="noopener noreferrer">Visitar site oficial</a></p>}
      {s.activated_at&&<p>Início da divulgação: {new Date(s.activated_at).toLocaleDateString("pt-BR")}</p>}
      <form action={updateSupplier} style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
        <input type="hidden" name="id" value={s.id}/>
        <label>Etapa <select name="stage" defaultValue={["consented","catalog_active","expired"].includes(s.stage)?"identified":s.stage} disabled={s.opt_out} style={{padding:8}}>{Object.entries(labels).filter(([v])=>["identified","contact_pending","contacted","interested","declined","cancelled"].includes(v)).map(([v,label])=><option value={v} key={v}>{label}</option>)}</select></label>
        <button type="submit" disabled={s.opt_out} className="button button-outline">Atualizar</button>
      </form>
    </article>)}</div>}
  </main>;
}
