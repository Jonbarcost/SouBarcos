"use server";
import { redirect } from "next/navigation";
import { serverClient } from "@/lib/supabase/server";
import { profileSchema } from "@/lib/validation";
import type { Result } from "@/components/action-form";
export async function joinMarketplace(
  _: Result,
  form: FormData,
): Promise<Result> {
  const db = await serverClient();
  const {
    data: { user },
    error,
  } = await db.auth.getUser();
  if (error || !user?.email_confirmed_at) redirect("/entrar");
  const name = profileSchema.shape.display_name.safeParse(
    form.get("display_name"),
  );
  if (!name.success || form.get("terms") !== "on")
    return { message: "Informe seu nome e aceite os termos da Brasil Force." };
  const result = await db.rpc("bf_join", {
    display_name: name.data,
    terms_version: "2026-10-15",
  });
  if (result.error)
    return {
      message:
        "Não foi possível concluir sua adesão. Entre novamente e tente outra vez.",
    };
  redirect("/conta");
}
