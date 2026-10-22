import { z } from "zod";
import { checkedConfig, type Env } from "./zoho-security";
export const tokenSchema = z.object({
  access_token: z.string().min(1).max(8000),
  refresh_token: z.string().min(1).max(8000),
  expires_in: z.number().positive().max(86400),
});
export type Tokens = z.infer<typeof tokenSchema>;
export async function safeJson(response: Response) {
  if (!response.ok || !response.body) throw new Error("Zoho indisponível.");
  const reader = response.body.getReader();
  let bytes = 0;
  const chunks: Uint8Array[] = [];
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    bytes += value.length;
    if (bytes > 512000) {
      await reader.cancel();
      throw new Error("Resposta Zoho excedeu o limite.");
    }
    chunks.push(value);
  }
  const data = JSON.parse(Buffer.concat(chunks).toString());
  if (data.error || (data.status?.code && data.status.code !== 200))
    throw new Error("Zoho recusou a operação.");
  return data;
}
export function provider(env: Env, fetcher: typeof fetch = fetch) {
  const c = checkedConfig(env);
  async function token(params: Record<string, string>) {
    return safeJson(
      await fetcher(c.accounts + "/oauth/v2/token", {
        method: "POST",
        body: new URLSearchParams({
          ...params,
          client_id: c.clientId,
          client_secret: c.clientSecret,
        }),
        cache: "no-store",
        redirect: "error",
        signal: AbortSignal.timeout(15000),
      }),
    );
  }
  async function api(path: string, access: string, body?: unknown) {
    return safeJson(
      await fetcher(c.mail + "/api" + path, {
        method: body ? "POST" : "GET",
        headers: {
          Authorization: "Zoho-oauthtoken " + access,
          "Content-Type": "application/json",
        },
        body: body ? JSON.stringify(body) : undefined,
        cache: "no-store",
        redirect: "error",
        signal: AbortSignal.timeout(15000),
      }),
    );
  }
  const id = (s: string) => {
    if (!/^\d{1,30}$/.test(s)) throw new Error("Identificador Zoho inválido.");
    return s;
  };
  return {
    exchange: async (code: string) =>
      tokenSchema.parse(
        await token({
          grant_type: "authorization_code",
          code,
          redirect_uri: c.redirectUri,
        }),
      ),
    refresh: async (refresh: string) => {
      const r = await token({
        grant_type: "refresh_token",
        refresh_token: refresh,
      });
      return tokenSchema.parse({
        ...r,
        refresh_token: r.refresh_token ?? refresh,
      });
    },
    account: async (access: string) => {
      const r = await api("/accounts", access);
      const a = z
        .array(
          z.object({
            accountId: z.string(),
            emailAddress: z.array(
              z.object({ mailId: z.string(), isConfirmed: z.boolean() }),
            ),
          }),
        )
        .parse(r.data)
        .find((a) =>
          a.emailAddress.some(
            (e) => e.isConfirmed && e.mailId.toLowerCase() === c.mailbox,
          ),
        );
      if (!a)
        throw new Error("A conta Zoho não corresponde à caixa autorizada.");
      return id(a.accountId);
    },
    list: async (account: string, access: string, start = 1) => {
      if (!Number.isInteger(start) || start < 1 || start > 10000)
        throw new Error("Página inválida.");
      const r = await api(
        `/accounts/${id(account)}/messages/view?limit=20&start=${start}`,
        access,
      );
      return z
        .array(
          z.object({
            messageId: z.string(),
            folderId: z.string(),
            subject: z.string().max(1000),
            fromAddress: z.string().max(500),
            summary: z.string().max(10000).optional(),
          }),
        )
        .max(20)
        .parse(r.data);
    },
    content: async (
      account: string,
      folder: string,
      message: string,
      access: string,
    ) => {
      const r = await api(
        `/accounts/${id(account)}/folders/${id(folder)}/messages/${id(message)}/content`,
        access,
      );
      return z.object({ content: z.string().max(300000) }).parse(r.data)
        .content;
    },
    send: async (
      account: string,
      access: string,
      to: string,
      subject: string,
      body: string,
    ) => {
      if (env.ZOHO_MAIL_SEND_ENABLED !== "true")
        throw new Error("Envio desativado.");
      z.email().parse(to);
      if (
        /[\r\n]/.test(subject) ||
        subject.length > 200 ||
        !subject.trim() ||
        body.length > 10000 ||
        !body.trim()
      )
        throw new Error("Mensagem inválida.");
      const r = await api(`/accounts/${id(account)}/messages`, access, {
        fromAddress: c.mailbox,
        toAddress: to,
        subject,
        content: body,
        mailFormat: "plaintext",
        encoding: "UTF-8",
      });
      return z
        .string()
        .regex(/^\d{1,30}$/)
        .parse(r.data?.messageId);
    },
    revoke: async (refresh: string) => {
      await safeJson(
        await fetcher(c.accounts + "/oauth/v2/token/revoke", {
          method: "POST",
          body: new URLSearchParams({ token: refresh }),
          cache: "no-store",
          redirect: "error",
          signal: AbortSignal.timeout(15000),
        }),
      );
    },
  };
}
