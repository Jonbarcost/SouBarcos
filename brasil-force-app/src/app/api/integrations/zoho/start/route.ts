import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/auth";
import { makeState, zohoClientConfig, zohoRedirectUri } from "@/lib/zoho-oauth";

export const dynamic = "force-dynamic";
export async function GET() {
  const { user, account } = await requireStaff();
  if (!["admin", "superadmin"].includes(account.role)) return new NextResponse("Forbidden", { status: 403 });
  try {
    const { clientId } = zohoClientConfig();
    const url = new URL("https://accounts.zoho.com/oauth/v2/auth");
    url.searchParams.set("scope", "ZohoMail.accounts.READ,ZohoMail.messages.READ,ZohoMail.messages.CREATE");
    url.searchParams.set("client_id", clientId);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("access_type", "offline");
    url.searchParams.set("prompt", "consent");
    url.searchParams.set("redirect_uri", zohoRedirectUri());
    url.searchParams.set("state", makeState(user.id));
    return NextResponse.redirect(url, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return new NextResponse("Zoho OAuth is not configured", { status: 503 });
  }
}
