import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export const ZOHO_CALLBACK_PATH = "/api/integrations/zoho/callback";
const MAX_AGE_SECONDS = 600;
function signingKey(): string {
  const key = process.env.ZOHO_OAUTH_STATE_SECRET;
  if (!key || key.length < 32 || /^(sk_(live|test)_|zoho)/i.test(key)) throw new Error("ZOHO_OAUTH_STATE_SECRET must be a dedicated random secret");
  return key;
}
export function zohoClientConfig() {
  const clientId = process.env.ZOHO_CLIENT_ID;
  const clientSecret = process.env.ZOHO_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error("Zoho OAuth credentials are not configured");
  return { clientId, clientSecret };
}
export function zohoRedirectUri() {
  return "https://brasilforce.com.br" + ZOHO_CALLBACK_PATH;
}
export function makeState(userId: string) {
  const payload = Buffer.from(JSON.stringify({ uid: userId, at: Math.floor(Date.now() / 1000), nonce: randomBytes(16).toString("hex") })).toString("base64url");
  const mac = createHmac("sha256", signingKey()).update(payload).digest("base64url");
  return payload + "." + mac;
}
export function verifyState(state: string, userId: string): boolean {
  const parts = state.split(".");
  if (parts.length !== 2 || !parts[0] || !parts[1]) return false;
  const expected = createHmac("sha256", signingKey()).update(parts[0]).digest();
  let actual: Buffer;
  try { actual = Buffer.from(parts[1], "base64url"); } catch { return false; }
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return false;
  try {
    const parsed = JSON.parse(Buffer.from(parts[0], "base64url").toString("utf8")) as { uid?: string; at?: number; nonce?: string };
    const now = Math.floor(Date.now() / 1000);
    return parsed.uid === userId && typeof parsed.at === "number" && parsed.at <= now && parsed.at > now - MAX_AGE_SECONDS && typeof parsed.nonce === "string" && parsed.nonce.length >= 16;
  } catch { return false; }
}
