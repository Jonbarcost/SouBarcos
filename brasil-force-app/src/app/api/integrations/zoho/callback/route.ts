import { NextRequest, NextResponse } from "next/server";
import { requireStaff } from "@/lib/auth";
import { verifyState } from "@/lib/zoho-oauth";

export const dynamic = "force-dynamic";
/**
 * Deliberately does not exchange or persist OAuth codes until an encrypted,
 * access-controlled credential store and one-time state replay protection exist.
 */
export async function GET(request: NextRequest) {
  const { user, account } = await requireStaff();
  if (!["admin", "superadmin"].includes(account.role)) return new NextResponse("Forbidden", { status: 403 });
  const state = request.nextUrl.searchParams.get("state");
  if (!state || !verifyState(state, user.id)) return new NextResponse("Invalid or expired authorization state", { status: 400 });
  if (request.nextUrl.searchParams.has("error")) return new NextResponse("Zoho authorization was denied", { status: 400 });
  if (!request.nextUrl.searchParams.has("code")) return new NextResponse("Missing authorization code", { status: 400 });
  return new NextResponse("Authorization callback received. Mail access is not activated yet; secure token storage and replay protection must be implemented before enabling.", { status: 202, headers: { "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" } });
}
