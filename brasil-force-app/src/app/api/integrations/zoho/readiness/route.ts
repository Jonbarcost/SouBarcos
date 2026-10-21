import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** Read-only integration readiness; does not read secrets or contact Zoho. */
export async function GET() {
  const { account } = await requireStaff();
  if (!["admin", "superadmin"].includes(account.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const keys = ["ZOHO_CLIENT_ID", "ZOHO_CLIENT_SECRET", "ZOHO_OAUTH_STATE_SECRET"] as const;
  const missing = keys.filter((key) => !process.env[key]);
  const state = process.env.ZOHO_OAUTH_STATE_SECRET ?? "";
  const stateSecretValid = state.length >= 32 && !/^sk_(live|test)_/i.test(state);
  return NextResponse.json({
    integration: "zoho-mail",
    environment: process.env.VERCEL_ENV ?? "unknown",
    credentialsPresent: missing.length === 0,
    missing,
    stateSecretValid,
    oauthConnectionActive: false,
    mailboxReadingEnabled: false,
    sendingEnabled: false,
    requires: ["single-use OAuth state", "encrypted refresh-token store", "credential security review", "verified Zoho region and scopes", "end-to-end tests"],
  }, { headers: { "Cache-Control": "no-store" } });
}
