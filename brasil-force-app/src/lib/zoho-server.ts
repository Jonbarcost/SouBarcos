import "server-only";
import { requireStaff } from "./auth";
import { checkedConfig, seal, unseal } from "./zoho-security";
import { provider, tokenSchema, type Tokens } from "./zoho-provider";
export async function zohoAdmin() {
  const context = await requireStaff();
  if (!["admin", "superadmin"].includes(context.account.role))
    throw new Error("Acesso restrito à administração.");
  return context;
}
export type AdminDb = Awaited<ReturnType<typeof zohoAdmin>>["db"];
export async function saveTokens(db: AdminDb, tokens: Tokens, account: string) {
  const c = checkedConfig(process.env);
  const ciphertext = seal(
    tokens,
    c.encryptionKey,
    `brasil-force:zoho:${c.region}:${c.mailbox}:${c.redirectUri}`,
  );
  const { error } = await db.rpc("bf_zoho_save", {
    p_ciphertext: ciphertext,
    p_region: c.region,
    p_account: account,
  });
  if (error) throw new Error("Não foi possível guardar a conexão.");
}
export async function connectedMailbox(db: AdminDb) {
  const c = checkedConfig(process.env);
  const { data, error } = await db
    .from("bf_zoho_connection")
    .select("ciphertext,region,account_id,mailbox")
    .eq("id", "corporate")
    .single();
  if (error || !data || data.region !== c.region || data.mailbox !== c.mailbox)
    throw new Error("Caixa Zoho não conectada.");
  const tokens = tokenSchema.parse(
    unseal(
      data.ciphertext,
      c.encryptionKey,
      `brasil-force:zoho:${c.region}:${c.mailbox}:${c.redirectUri}`,
    ),
  );
  return {
    c,
    tokens,
    account: data.account_id as string,
    api: provider(process.env),
  };
}
