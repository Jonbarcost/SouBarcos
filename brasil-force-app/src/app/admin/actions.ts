"use server";
import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth";
import { reviewSchema, verificationSchema } from "@/lib/seller-review";
import type { Result } from "@/components/action-form";
export async function reviewSeller(_: Result, form: FormData): Promise<Result> {
  const { db } = await requireStaff();
  const parsed = reviewSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success || form.get("confirm") !== "on")
    return {
      message:
        "Escolha a decisão, informe uma justificativa de 10 a 1.500 caracteres e confirme.",
    };
  const { error } = await db.rpc("bf_review_seller", parsed.data);
  if (error)
    return {
      message:
        error.code === "40001"
          ? "Esta solicitação mudou. Atualize a página antes de decidir."
          : "Não foi possível registrar a decisão. Atualize a página e confira sua permissão.",
    };
  revalidatePath("/admin");
  revalidatePath("/vender");
  revalidatePath("/painel-vendedor");
  return {
    ok: true,
    message: "Decisão registrada no histórico e disponível ao solicitante.",
  };
}
export async function verifySeller(_: Result, form: FormData): Promise<Result> {
  const { db, account } = await requireStaff();
  if (!["admin", "superadmin"].includes(account.role))
    return { message: "Esta verificação exige administrador com MFA." };
  const parsed = verificationSchema.safeParse({
    ...Object.fromEntries(form),
    p_checks: form.getAll("p_checks"),
  });
  if (!parsed.success || form.get("confirm") !== "on")
    return {
      message:
        "Confira todos os requisitos e informe apenas a referência interna da evidência verificada.",
    };
  const { error } = await db.rpc("bf_verify_seller", parsed.data);
  if (error)
    return {
      message:
        error.code === "40001"
          ? "A solicitação mudou. Atualize a página."
          : "Verificação não registrada. Confira requisitos, política vigente e permissão.",
    };
  revalidatePath("/admin");
  return {
    ok: true,
    message:
      "Verificação registrada. A aprovação ainda exige decisão administrativa.",
  };
}
