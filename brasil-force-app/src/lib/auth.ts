import "server-only";
import { redirect } from "next/navigation";
import { serverClient } from "@/lib/supabase/server";
import { authConfigured } from "@/lib/config";
import { canManage } from "@/lib/validation";
export async function requireUser() {
  if (!authConfigured()) redirect("/entrar?status=config");
  const db = await serverClient();
  const {
    data: { user },
    error,
  } = await db.auth.getUser();
  if (error || !user || !user.email_confirmed_at) redirect("/entrar");
  const { data: account, error: accountError } = await db
    .from("bf_accounts")
    .select("role,status")
    .eq("id", user.id)
    .maybeSingle();
  if (accountError) redirect("/acesso-indisponivel");
  if (!account) redirect("/participar");
  if (account.status !== "active") redirect("/acesso-indisponivel");
  return { db, user, account };
}
export async function requireStaff() {
  const context = await requireUser();
  if (!["moderator", "admin", "superadmin"].includes(context.account.role))
    redirect("/conta");
  const { data, error } = await context.db.auth.getClaims();
  if (
    error ||
    !canManage(
      context.account.role,
      data?.claims.aal as string | undefined,
      true,
    )
  )
    redirect("/conta/seguranca");
  return context;
}

export async function requireSeller() {
  const context = await requireUser();
  if (!["seller", "store"].includes(context.account.role)) redirect("/vender");
  const { data, error } = await context.db
    .from("bf_seller_applications")
    .select("status")
    .eq("user_id", context.user.id)
    .maybeSingle();
  if (error) throw new Error("Não foi possível verificar a habilitação.");
  if (data?.status !== "approved") redirect("/vender");
  return context;
}
