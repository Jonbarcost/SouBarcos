import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { zohoAdmin, saveTokens } from "@/lib/zoho-server";
import { checkedConfig, verifySignedState, hash } from "@/lib/zoho-security";
import { provider } from "@/lib/zoho-provider";
export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  const { db, user } = await zohoAdmin();
  let result = "failed";
  try {
    const c = checkedConfig(process.env);
    if (process.env.ZOHO_OAUTH_ENABLED !== "true") throw new Error();
    const jar = await cookies();
    const binding = jar.get("__Host-bf-zoho")?.value ?? "";
    jar.delete("__Host-bf-zoho");
    const state = request.nextUrl.searchParams.get("state") ?? "";
    if (!verifySignedState(state, user.id, c.stateKey, binding))
      throw new Error();
    const { data, error } = await db.rpc("bf_zoho_nonce", {
      p_hash: hash(state),
      p_consume: true,
    });
    if (error || data !== true) throw new Error();
    const code = request.nextUrl.searchParams.get("code");
    if (
      request.nextUrl.searchParams.has("error") ||
      !code ||
      code.length > 3000
    )
      throw new Error();
    const api = provider(process.env);
    const tokens = await api.exchange(code);
    const account = await api.account(tokens.access_token);
    await saveTokens(db, tokens, account);
    result = "connected";
  } catch {
    /* Never log provider response, code, state or credentials. */
  }
  // Fixed relative destination strips the OAuth query from browser history/navigation.
  return new NextResponse(null, {
    status: 303,
    headers: {
      Location: "/admin/fornecedores?zoho=" + result,
      "Cache-Control": "no-store",
      "Referrer-Policy": "no-referrer",
    },
  });
}
