import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { zohoAdmin } from "@/lib/zoho-server";
import { checkedConfig, makeSignedState, hash } from "@/lib/zoho-security";
export const dynamic = "force-dynamic";
export async function POST(request: NextRequest) {
  const { db, user } = await zohoAdmin();
  try {
    const c = checkedConfig(process.env);
    if (
      process.env.ZOHO_OAUTH_ENABLED !== "true" ||
      request.headers.get("origin") !== new URL(c.redirectUri).origin
    )
      return new NextResponse("Autorização indisponível.", { status: 403 });
    const binding = randomBytes(32).toString("hex");
    const state = makeSignedState(user.id, c.stateKey, binding);
    const { error } = await db.rpc("bf_zoho_nonce", {
      p_hash: hash(state),
      p_consume: false,
    });
    if (error) throw new Error();
    (await cookies()).set("__Host-bf-zoho", binding, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 600,
    });
    const url = new URL(c.accounts + "/oauth/v2/auth");
    Object.entries({
      scope:
        "ZohoMail.accounts.READ,ZohoMail.messages.READ,ZohoMail.messages.CREATE",
      client_id: c.clientId,
      response_type: "code",
      access_type: "offline",
      prompt: "consent",
      redirect_uri: c.redirectUri,
      state,
    }).forEach(([k, v]) => url.searchParams.set(k, v));
    return NextResponse.redirect(url, {
      status: 303,
      headers: {
        "Cache-Control": "no-store",
        "Referrer-Policy": "no-referrer",
      },
    });
  } catch {
    return new NextResponse(
      "Integração bloqueada. Confira o diagnóstico administrativo.",
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
