"use server";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { sendAll } from "@/lib/mailer";
import { sellerApplicationEmails } from "@/lib/email-templates";
import { requireUser } from "@/lib/auth";
import type { Result } from "@/components/action-form";
import { z } from "zod";
import { resubmitSchema } from "@/lib/seller-review";
export async function applySeller(_: Result, form: FormData): Promise<Result> {
  const { db, user } = await requireUser();
  const parsed = z
    .object({
      display_name: z.string().trim().min(2).max(100),
      person_type: z.enum(["individual", "company"]),
    })
    .safeParse({
      display_name: form.get("display_name"),
      person_type: form.get("person_type"),
    });
  if (!parsed.success || form.get("rules") !== "on")
    return { message: "Preencha os dados e confirme a leitura das regras." };
  const { error } = await db.from("bf_seller_applications").insert({
    ...parsed.data,
    user_id: user.id,
    status: "pending",
    policy_version: "2026-10-15",
  });
  if (error?.code === "23505")
    return {
      message: "Você já possui uma solicitação. Consulte o status abaixo.",
    };
  if (error) return { message: "Não foi possível enviar a solicitação." };
  if (user.email) {
    const to = user.email;
    after(() => sendAll(sellerApplicationEmails(to, parsed.data.display_name, parsed.data.person_type)));
  }
  revalidatePath("/vender");
  return {
    ok: true,
    message:
      "Solicitação registrada! Enviamos a confirmação para o seu e-mail. A habilitação depende de análise documental e aprovação; a venda ainda não está liberada.",
  };
}

export async function resubmitSeller(
  _: Result,
  form: FormData,
): Promise<Result> {
  const { db } = await requireUser();
  const parsed = resubmitSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success || form.get("rules") !== "on")
    return { message: "Confira os dados e confirme a leitura das regras." };
  const { error } = await db.rpc("bf_resubmit_seller", parsed.data);
  if (error)
    return {
      message:
        error.code === "40001"
          ? "A solicitação mudou. Atualize a página."
          : "Não foi possível reenviar. Confira se há uma correção solicitada.",
    };
  revalidatePath("/vender");
  revalidatePath("/admin");
  return {
    ok: true,
    message: "Correções enviadas. Sua solicitação voltou à fila de análise.",
  };
}
