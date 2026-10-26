import { after, NextRequest, NextResponse } from "next/server";
import { serverClient } from "@/lib/supabase/server";
import { safeNext } from "@/lib/validation";
import { siteUrl } from "@/lib/config";
import { sendMail } from "@/lib/mailer";
import { welcomeEmail, type Intent } from "@/lib/email-templates";

/** Confirmation links older than this do not trigger the welcome e-mail. */
const WELCOME_WINDOW_MS = 30 * 60 * 1000;

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  if (code) {
    const db = await serverClient();
    const { data, error } = await db.auth.exchangeCodeForSession(code);
    if (!error) {
      const user = data.user;
      const confirmedAt = user?.email_confirmed_at ? Date.parse(user.email_confirmed_at) : 0;
      if (
        request.nextUrl.searchParams.get("welcome") === "1" &&
        user?.email &&
        !user.user_metadata?.welcomed_at &&
        Date.now() - confirmedAt < WELCOME_WINDOW_MS
      ) {
        // Mark first, then send after the redirect: a reused link never sends twice.
        const { error: markError } = await db.auth.updateUser({
          data: { welcomed_at: new Date().toISOString() },
        });
        if (!markError) {
          const intent: Intent = user.user_metadata?.intent === "seller" ? "seller" : "buyer";
          const name = String(user.user_metadata?.display_name || "").slice(0, 80) || "recruta";
          const to = user.email;
          after(() => sendMail(welcomeEmail(to, name, intent)));
        }
      }
      return NextResponse.redirect(
        new URL(safeNext(request.nextUrl.searchParams.get("next")), siteUrl()),
      );
    }
  }
  return NextResponse.redirect(new URL("/entrar?status=invalid", siteUrl()));
}
