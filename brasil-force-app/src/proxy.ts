import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { randomBytes } from "node:crypto";
import { authConfigured } from "@/lib/config";
export async function proxy(request: NextRequest) {
  const nonce = randomBytes(16).toString("base64");
  const dev = process.env.NODE_ENV !== "production";
  const csp = `default-src 'self'; script-src 'self' 'nonce-${nonce}' 'strict-dynamic' ${dev ? "'unsafe-eval'" : ""}; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self' https://*.supabase.co wss://*.supabase.co ${dev ? "ws://localhost:* ws://127.0.0.1:*" : ""}; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'`;
  const headers = new Headers(request.headers);
  headers.set("x-nonce", nonce);
  headers.set("Content-Security-Policy", csp);
  let response = NextResponse.next({ request: { headers } });
  if (authConfigured()) {
    const client = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        cookieOptions: { name: "bf-auth" },
        cookies: {
          getAll: () => request.cookies.getAll(),
          setAll: (items) => {
            items.forEach(({ name, value }) =>
              request.cookies.set(name, value),
            );
            headers.set("cookie", request.cookies.toString());
            response = NextResponse.next({ request: { headers } });
            items.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options),
            );
          },
        },
      },
    );
    await client.auth.getClaims();
  }
  response.headers.set("Content-Security-Policy", csp);
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp)$).*)",
  ],
};
