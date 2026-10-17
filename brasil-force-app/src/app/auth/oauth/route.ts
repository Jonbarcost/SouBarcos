import { NextRequest, NextResponse } from "next/server";
import { serverClient } from "@/lib/supabase/server";
import { siteUrl } from "@/lib/config";
export async function GET(request: NextRequest) {
  const provider = request.nextUrl.searchParams.get("provider");
  if (
    (provider !== "google" && provider !== "apple") ||
    process.env[`AUTH_${provider.toUpperCase()}_ENABLED`] !== "true"
  )
    return NextResponse.json(
      { error: "Provedor indisponível" },
      { status: 404 },
    );
  const db = await serverClient();
  const { data, error } = await db.auth.signInWithOAuth({
    provider,
    options: { redirectTo: siteUrl() + "/auth/callback" },
  });
  if (error || !data.url)
    return NextResponse.redirect(new URL("/entrar?status=oauth", siteUrl()));
  return NextResponse.redirect(data.url);
}
