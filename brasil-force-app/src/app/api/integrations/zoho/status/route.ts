import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** Administrative readiness check; never returns secret values or tokens. */
export async function GET() {
  const { account } = await requireStaff();
  if (!["admin", "superadmin"].includes(account.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const required = ["ZOHO_CLIENT_ID", "ZOHO_CLIENT_SECRET", "ZOHO_OAUTH_STATE_SECRET"] as const;
  const missing = required.filter((key) => !process.env[key]);
  const state = process.env.ZOHO_OAUTH_STATE_SECRET ?? "";
  const stateSecretLengthValid = state.length >= 32;
  const stateSecretLooksLikeProviderKey = /^(sk_(live|test)_|zoho)/i.test(state);
  const configured = missing.length === 0 && stateSecretLengthValid && !stateSecretLooksLikeProviderKey;
  return NextResponse.json(
    {
      integration: "zoho-mail",
      configured,
      missing,
      stateSecretValid: stateSecretLengthValid && !stateSecretLooksLikeProviderKey,
      mailboxConnected: false,
      sendingEnabled: false,
      oauthFlowEnabled: false,
      nextStep: "Implement secure one-time state, encrypted refresh-token storage and credential review before authorization",
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
