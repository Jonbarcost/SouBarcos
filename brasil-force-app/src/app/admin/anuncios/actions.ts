"use server";
import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth";
import { listingReviewSchema } from "@/lib/listing-review";
import type { Result } from "@/components/action-form";
export async function reviewListing(
  _: Result,
  form: FormData,
): Promise<Result> {
  const { db } = await requireStaff();
  const parsed = listingReviewSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success || form.get("confirm") !== "on")
    return {
      message:
        "Informe decisão, classificação, justificativa e confirme a conferência.",
    };
  const { error } = await db.rpc("bf_review_listing", parsed.data);
  if (error)
    return {
      message:
        error.code === "40001"
          ? "O anúncio mudou. Atualize a página antes de decidir."
          : "Decisão não registrada. Confira estado, classificação, requisitos e permissão.",
    };
  for (const path of [
    "/admin/anuncios",
    "/painel-vendedor",
    "/catalogo",
    `/catalogo/${parsed.data.p_id}`,
    `/admin/anuncios/${parsed.data.p_id}`,
    `/painel-vendedor/anuncios/${parsed.data.p_id}`,
  ])
    revalidatePath(path);
  return {
    ok: true,
    message:
      "Decisão registrada. A visibilidade segue as regras de publicação do catálogo.",
  };
}
