"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireSeller } from "@/lib/auth";
import { listingSchema, listingIdentity } from "@/lib/listings";
import type { Result } from "@/components/action-form";

function failure(code?: string): Result {
  return {
    message:
      code === "40001"
        ? "Este anúncio mudou. Atualize a página antes de continuar."
        : "Não foi possível salvar. Confira os dados, sua habilitação e a situação do anúncio.",
  };
}
function refresh(id: string) {
  revalidatePath("/painel-vendedor");
  revalidatePath(`/painel-vendedor/anuncios/${id}`);
  revalidatePath("/catalogo");
}
export async function saveListing(_: Result, form: FormData): Promise<Result> {
  const { db } = await requireSeller();
  const identity = listingIdentity.safeParse(Object.fromEntries(form));
  const parsed = listingSchema.safeParse(Object.fromEntries(form));
  if (!identity.success || !parsed.success)
    return {
      message:
        "Confira os campos. Use preço sem separador de milhar (ex.: 149,90), peso em gramas e dimensões em centímetros.",
    };
  const { data, error } = await db.rpc("bf_save_listing", {
    ...identity.data,
    p_data: parsed.data,
  });
  if (error || data !== identity.data.p_id) return failure(error?.code);
  refresh(identity.data.p_id);
  redirect(`/painel-vendedor/anuncios/${identity.data.p_id}?saved=1`);
}
export async function transitionListing(
  _: Result,
  form: FormData,
): Promise<Result> {
  const { db } = await requireSeller();
  const identity = listingIdentity.safeParse(Object.fromEntries(form));
  const action = form.get("p_action");
  if (
    !identity.success ||
    !["submit", "pause"].includes(String(action)) ||
    form.get("confirm") !== "on"
  )
    return { message: "Confirme a ação para continuar." };
  const { error } = await db.rpc("bf_transition_listing", {
    ...identity.data,
    p_action: action,
  });
  if (error) return failure(error.code);
  refresh(identity.data.p_id);
  return {
    ok: true,
    message:
      action === "submit"
        ? "Anúncio enviado para análise. Ele permanece fora do catálogo público."
        : "Anúncio pausado.",
  };
}
