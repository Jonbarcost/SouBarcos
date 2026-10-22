import { NextResponse } from "next/server";
import { zohoAdmin } from "@/lib/zoho-server";
import { configStatus } from "@/lib/zoho-security";
export const dynamic = "force-dynamic";
export async function GET() {
  const { db } = await zohoAdmin();
  const config = configStatus(process.env);
  const { data, error } = await db
    .from("bf_zoho_connection")
    .select("id,mailbox,updated_at")
    .eq("id", "corporate")
    .maybeSingle();
  return NextResponse.json(
    {
      integration: "zoho-mail",
      ...config,
      schemaReady: !error,
      mailboxConnected: !!data,
      oauthFlowEnabled:
        config.configured && process.env.ZOHO_OAUTH_ENABLED === "true",
      mailboxReadingEnabled:
        config.configured &&
        !!data &&
        process.env.ZOHO_MAIL_READ_ENABLED === "true",
      sendingEnabled:
        config.configured &&
        !!data &&
        process.env.ZOHO_MAIL_SEND_ENABLED === "true",
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
