"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/auth";

async function adminContext() {
  const context = await requireStaff();
  if (!["admin","superadmin"].includes(context.account.role)) throw new Error("Acesso restrito");
  return context;
}
export async function createSupplier(formData: FormData) {
  const { db, user } = await adminContext();
  const company_name = String(formData.get("company_name") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const contact_email = String(formData.get("contact_email") ?? "").trim();
  const website = String(formData.get("website") ?? "").trim();
  const source_url = String(formData.get("source_url") ?? "").trim();
  if (company_name.length < 2 || company_name.length > 180 || category.length < 2 || category.length > 100) throw new Error("Empresa ou categoria inválida");
  if (contact_email && (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact_email) || contact_email.length > 254)) throw new Error("E-mail inválido");
  for (const url of [website,source_url]) if (url && (!/^https:\/\//.test(url) || url.length > 1000)) throw new Error("Use URLs HTTPS");
  const { data, error } = await db.from("bf_supplier_prospects").insert({ company_name, category, contact_email:contact_email||null, website:website||null,source_url:source_url||null,created_by:user.id }).select("id").single();
  if (error || !data) throw new Error("Falha ao registrar fornecedor");
  await db.from("bf_supplier_events").insert({ supplier_id:data.id,actor_id:user.id,event_type:"created" });
  revalidatePath("/admin/fornecedores");
  redirect("/admin/fornecedores");
}
export async function updateSupplier(formData: FormData) {
  const { db, user } = await adminContext();
  const id = String(formData.get("id") ?? "");
  const stage = String(formData.get("stage") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw new Error("Identificador inválido");
  if (!["identified","contact_pending","contacted","interested","declined","cancelled"].includes(stage)) throw new Error("Etapa inválida; consentimento e publicação exigem fluxo específico");
  const { data:current,error:readError } = await db.from("bf_supplier_prospects").select("stage,opt_out").eq("id",id).single();
  if(readError||!current) throw new Error("Fornecedor não encontrado");
  if(current.opt_out && stage!=="cancelled") throw new Error("Contato bloqueado por opt-out");
  const changes:Record<string,unknown>={stage,updated_at:new Date().toISOString()};
  if(stage==="cancelled") changes.cancelled_at=new Date().toISOString();
  const {error}=await db.from("bf_supplier_prospects").update(changes).eq("id",id);
  if(error) throw new Error("Falha ao atualizar fornecedor");
  await db.from("bf_supplier_events").insert({supplier_id:id,actor_id:user.id,event_type:stage==="cancelled"?"cancelled":"stage_changed",details:current.stage+" -> "+stage});
  revalidatePath("/admin/fornecedores");
}
