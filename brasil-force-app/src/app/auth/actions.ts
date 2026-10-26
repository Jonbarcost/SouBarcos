"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { serverClient } from "@/lib/supabase/server";
import { authConfigured, siteUrl, registrationEnabled } from "@/lib/config";
import { emailSchema, passwordSchema, profileSchema } from "@/lib/validation";
import { requireUser } from "@/lib/auth";
import type { Result } from "@/components/action-form";
import { captchaMissing, captchaToken } from "@/lib/captcha";
const unavailable = {
  message:
    "Cadastro e login aguardam a configuração do serviço de autenticação.",
};
export async function login(_: Result, form: FormData): Promise<Result> {
  if (!authConfigured()) return unavailable;
  const email = emailSchema.safeParse(form.get("email"));
  const password = form.get("password");
  if (!email.success || typeof password !== "string" || password.length > 128)
    return { message: "Confira o e-mail e a senha." };
  const captcha = captchaToken(form);
  if (captcha === undefined) return captchaMissing;
  const db = await serverClient();
  const { error } = await db.auth.signInWithPassword({
    email: email.data,
    password,
    options: captcha ? { captchaToken: captcha } : undefined,
  });
  if (error)
    return {
      message:
        "Não foi possível entrar. Confira seus dados e a confirmação de e-mail.",
    };
  const { data: aal } = await db.auth.mfa.getAuthenticatorAssuranceLevel();
  redirect(
    aal?.nextLevel === "aal2" && aal.currentLevel !== "aal2"
      ? "/conta/seguranca"
      : "/conta",
  );
}
export async function signup(_: Result, form: FormData): Promise<Result> {
  if (!registrationEnabled()) return unavailable;
  const email = emailSchema.safeParse(form.get("email"));
  const password = passwordSchema.safeParse(form.get("password"));
  const name = profileSchema.shape.display_name.safeParse(form.get("name"));
  const intent = form.get("intent") === "seller" ? "seller" : "buyer";
  if (
    !email.success ||
    !password.success ||
    !name.success ||
    form.get("terms") !== "on"
  )
    return {
      message:
        "Informe nome, e-mail válido, senha com 12 a 128 caracteres e aceite os termos.",
    };
  const captcha = captchaToken(form);
  if (captcha === undefined) return captchaMissing;
  const next = intent === "seller" ? "/vender" : "/conta";
  const db = await serverClient();
  const { error } = await db.auth.signUp({
    email: email.data,
    password: password.data,
    options: {
      emailRedirectTo: `${siteUrl()}/auth/callback?welcome=1&next=${encodeURIComponent(next)}`,
      data: { display_name: name.data, intent },
      captchaToken: captcha ?? undefined,
    },
  });
  if (error)
    return {
      message:
        "Não foi possível concluir o cadastro. Tente novamente mais tarde.",
    };
  return {
    ok: true,
    message:
      "Quase lá! Se o cadastro puder ser realizado, você receberá em instantes um e-mail de contato@brasilforce.com.br com o link de confirmação. Confira também o spam.",
  };
}
export async function recover(_: Result, form: FormData): Promise<Result> {
  if (!registrationEnabled()) return unavailable;
  const email = emailSchema.safeParse(form.get("email"));
  if (!email.success) return { message: "Informe um e-mail válido." };
  const captcha = captchaToken(form);
  if (captcha === undefined) return captchaMissing;
  const db = await serverClient();
  await db.auth.resetPasswordForEmail(email.data, {
    redirectTo: siteUrl() + "/auth/callback?next=/redefinir-senha",
    captchaToken: captcha ?? undefined,
  });
  return {
    ok: true,
    message:
      "Se houver uma conta elegível, enviaremos as instruções de recuperação.",
  };
}
export async function resetPassword(
  _: Result,
  form: FormData,
): Promise<Result> {
  const { db } = await requireUser();
  const password = passwordSchema.safeParse(form.get("password"));
  if (!password.success)
    return { message: "Use uma senha de 12 a 128 caracteres." };
  const { error } = await db.auth.updateUser({ password: password.data });
  if (error)
    return {
      message:
        "Não foi possível alterar a senha. Solicite um novo link ou confirme seu segundo fator.",
    };
  await db.auth.signOut({ scope: "global" });
  redirect("/entrar?status=password");
}
export async function logout() {
  const db = await serverClient();
  await db.auth.signOut({ scope: "local" });
  redirect("/entrar");
}
export async function logoutEverywhere(_: Result): Promise<Result> {
  const { db } = await requireUser();
  const { error } = await db.auth.signOut({ scope: "global" });
  if (error) return { message: "Não foi possível encerrar as sessões." };
  redirect("/entrar?status=logout");
}
export async function saveProfile(_: Result, form: FormData): Promise<Result> {
  const { db, user } = await requireUser();
  const parsed = profileSchema.safeParse({
    display_name: form.get("display_name"),
    institution: form.get("institution"),
  });
  if (!parsed.success)
    return { message: "Confira o nome e o vínculo selecionado." };
  const { error } = await db
    .from("bf_profiles")
    .update({
      display_name: parsed.data.display_name,
      institution: parsed.data.institution || null,
    })
    .eq("id", user.id);
  if (!error) revalidatePath("/conta");
  return error
    ? { message: "Não foi possível salvar o perfil." }
    : {
        ok: true,
        message: "Perfil atualizado. O vínculo informado é autodeclarado.",
      };
}
