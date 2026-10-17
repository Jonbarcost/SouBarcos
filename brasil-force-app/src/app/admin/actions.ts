"use server";
import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth";
import { reviewSchema } from "@/lib/seller-review";
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
  return {
    ok: true,
    message: "Decisão registrada no histórico e disponível ao solicitante.",
  };
}
